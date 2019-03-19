var gulp = require('gulp');
var plumber = require('gulp-plumber');
// var gulpSequence = require('gulp-sequence');
var gulpIf = require('gulp-if');
// var size = require('gulp-size');
var changed = require('gulp-changed');
var debug = require('gulp-debug');
var notify = require('gulp-notify');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var fileinclude = require('gulp-file-include');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
//var gulpMerge = require('gulp-merge');
var browserSync = require('browser-sync').create();
var fs = require('fs');
var del = require('del');

var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var mqpacker = require('css-mqpacker');
var inlineSVG = require('postcss-inline-svg');
var imageInliner = require('postcss-image-inliner');
var cssnano = require('cssnano');
//var gcmq = require('gulp-group-css-media-queries');

//var realFavicon = require ('gulp-real-favicon'); - генерация фавиконок
var imagemin = require('gulp-imagemin');
var webp = require('imagemin-webp');
//var pngquant = require('imagemin-pngquant');
//Для минимизации PNG используется отдельный плагин pngquant, поскольку imagemin-pngquant выдает ошибку
var gulpPngquant = require('gulp-pngquant');

var svgstore = require('gulp-svgstore');
var svgmin = require('gulp-svgmin');
var cheerio = require('gulp-cheerio');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var patch = {
  src: {
    root: 'source/',
    html: 'source/*.html',
    html_templ: 'source/html_templates/*.html',
    scss: 'source/scss/*.scss',
    scss_mixins: 'source/scss/mixins',
    scss_file: 'source/scss/style.scss',
    blocks: 'source/blocks/*.scss',
    img: 'source/img/',
    favicon: 'source/img/favicon/*',
    js: 'source/js/*.js',
    fonts: 'source/fonts/*.{woff,woff2}',
    copy_css: '',
    copy_js: 'source/libs/js/*.js',
    svg_sprite: 'source/img/sprite-svg/',
    img_sprite: '',
    img_to_bg: 'source/img/inline_img_to_css/',
    svg_inline: 'source/img/inline_svg_to_css/'
  },
  build: {
    root: 'build/',
    css: 'build/css/',
    img: 'build/img/',
    svg_sprite: 'build/img/sprite-svg/',
    img_sprite: 'build/img/sprite-png/',
    favicon: 'build/favicon/',
    fonts: 'build/fonts/',
    js: 'build/js/'
  },
  libs: {
    js: [
      'node_modules/leaflet/dist/leaflet-src.js',
      'node_modules/picturefill/dist/picturefill.js'
    ]
  }
};

//используется для подключения и объединения в один JS файл внешних библиотек
if (patch.libs.js) patch.src.js = patch.libs.js.concat(patch.src.js);


//флаг, устанавливающий разработка это или сборка для продакшина
var isDev = !process.env.NODE_ENV || (process.env.NODE_ENV == 'development');

// Плагины postCSS, которыми обрабатываются все стилевые файлы
var postCssPlugins = [
  autoprefixer({browsers: ['ie >= 11', 'last 2 versions']}),
  mqpacker({
    sort: true
  }),
  inlineSVG({path: patch.src.svg_inline}),
  imageInliner({
    assetPaths: [patch.src.img_to_bg],
    maxFileSize: 10240
  })
  // cssnano()
];

//обработка файлов html
gulp.task('html', function () {
  console.log('---------- Компиляция HTML');
  return gulp.src(patch.src.html)
  .pipe(plumber({
    errorHandler: function(err) {
      notify.onError({
        title: 'HTML compilation error',
        message: err.message
      })(err);
      this.emit('end');
    }
  }))
  .pipe(fileinclude({
    prefix: '@@',
    basepath: '@file',
    indent: true
  }))
  .pipe(gulpIf(!isDev, replace(/\n\s*<!--DEV[\s\S]+?-->/gm, '')))
  .pipe(gulp.dest(patch.build.root))
  .pipe(browserSync.reload({stream:true}));
});

//сортировка атрибутов в тегах html
//выполняется один раз для исходных файлов, чтобы атрибут класса был в начале тега
gulp.task('html:sort',function() {
  var posthtml = require('gulp-posthtml');
  var posthtmlAttrSort = require('posthtml-attrs-sorter');

  console.log('---------- Сортировка атрибутов в тегах (делается в исходниках)');
  return gulp.src([patch.src.html ,patch.src.html_templ])
  .pipe(posthtml([
    posthtmlAttrSort(
      {
        'order': [
          'class', 'id', 'name',
          'data-.+', 'ng-.+', 'src',
          'for', 'type', 'href',
          'values', 'title', 'alt',
          'role', 'aria-.+',
          '$unknown$'
        ]
      }
    )
  ]))
  .pipe(gulp.dest(function(file) {
    if (file.base) return file.base;
  }));
});


//обработка стилевых файлов
gulp.task('style', function() {
  console.log('---------- Компиляция стилей');
  return gulp.src(patch.src.scss_file)
  .pipe(plumber({
    errorHandler: function(err) {
      notify.onError({
        title: 'Styles compilation error',
        message: err.message
      })(err);
      this.emit('end');
    }
  }))
  .pipe(fileinclude({
    prefix: '@@',
    basepath: '@file',
    indent: true
  }))
  .pipe(sass())
  .pipe(gulpIf(isDev, sourcemaps.init()))
  .pipe(postcss(postCssPlugins))
  .pipe(gulpIf(!isDev, postcss([cssnano()])))
  .pipe(rename({suffix: '.min'}))
  .pipe(gulpIf(!isDev, rev()))
  .pipe(gulpIf(isDev, sourcemaps.write('.')))
  .pipe(gulp.dest(patch.build.css))
  .pipe(gulpIf(!isDev, rev.manifest(
    patch.build.root + 'rev-manifest.json',
    { base: patch.build.root,
    merge: true
  })))
  .pipe(gulpIf(!isDev, gulp.dest(patch.build.root)))
  .pipe(browserSync.stream());
});


gulp.task('style:copy', function(done) {
  if (patch.src.copy_css && patch.src.copy_css != '') {
    console.log('---------- Копирование стилей');
    return gulp.src(patch.src.copy_css)
    .pipe(gulp.dest(patch.build.css))
    .pipe(browserSync.stream());
  }
  else {
    console.log('---------- Копирование CSS файлов отменено. Нет отдельных файлов');
    done();
  }
});

gulp.task('js', function() {
  console.log('---------- Компиляция JS');
  return gulp.src(patch.src.js)
  .pipe(plumber({
    errorHandler: function(err) {
      notify.onError({
        title: 'Javascript compilation error',
        message: err.message
      })(err);
      this.emit('end');
    }
  }))
  .pipe(gulpIf(isDev, sourcemaps.init()))
  .pipe(concat('script.min.js'))
  .pipe(gulpIf(!isDev, uglify()))
  .pipe(gulpIf(!isDev, rev()))
  .pipe(gulpIf(isDev, sourcemaps.write('/')))
  .pipe(gulp.dest(patch.build.js))
  .pipe(gulpIf(!isDev, rev.manifest(
    patch.build.root + 'rev-manifest.json',
    { base: patch.build.root,
    merge: true
  })))
  .pipe(gulpIf(!isDev, gulp.dest(patch.build.root)))
  .pipe(browserSync.reload({stream:true}));
});

gulp.task('js:copy', function(done) {
  if (patch.src.copy_js && patch.src.copy_js != '') {
    console.log('---------- Копирование JS файлов');
    return gulp.src(patch.src.copy_js)
    .pipe(plumber({
      errorHandler: function(err) {
        notify.onError({
          title: 'Single JS compilation error',
          message: err.message
        })(err);
        this.emit('end');
      }
    }))
    .pipe(gulpIf(!isDev, uglify()))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(patch.build.js))
    .pipe(browserSync.reload({stream:true}));
  }
  else {
    console.log('---------- Копирование JS файлов отменено. Нет отдельных файлов');
    done();
  }

});

// Оптимизация изображений
gulp.task('img:opt', function () {

  console.log('---------- Оптимизация картинок');
  return gulp.src(patch.src.img + '*.{jpg,jpeg,gif,svg,png}')
    .pipe(changed(patch.build.img))
    .pipe(gulpIf(isDev, debug({'title':' image:opt'})))
    .pipe(
      gulpIf(function (file) { return file.extname == '.png';},

      gulpPngquant({quality: '65-80'}),

      imagemin([
    	imagemin.gifsicle({interlaced: true}),
    	imagemin.jpegtran({progressive: true}),
    	imagemin.svgo({removeViewBox: false})
      ])
    ))
    .pipe(gulp.dest(patch.build.img))
    .pipe(browserSync.reload({stream:true}));
});

gulp.task('img:webp', function () {
  //var webp = require('gulp-webp');
  console.log('---------- Создание картинок webp');
  return gulp.src(patch.src.img+ '*.{jpg,jpeg,gif,png}')
  .pipe(changed(patch.build.img, {extension: '.webp'}))
  .pipe(imagemin([
    webp({
      quality: 90
    })
  ]))
  .pipe(rename({extname: '.webp'}))
  .pipe(gulpIf(isDev, debug({'title':' image:webp'})))
  .pipe(gulp.dest(patch.build.img))
  .pipe(browserSync.reload({stream:true}));

  // return gulp.src(source_img + '*.{jpg,jpeg,gif,png}')
  // .pipe(changed(build_img, {extension: '.webp'}))
  // .pipe(debug({'title':' image:webp'}))
  // .pipe(webp({quality: 90}))
  // .pipe(gulp.dest(build_img))
  // .pipe(browserSync.reload({stream:true}));
});

// gulp.task('img', function() {
//   console.log('---------- Копирование картинок');
//   return gulp.src([source_img_webp + '*', source_img_optim + '*'])
//   .pipe(changed(build_img))
//   .pipe(gulp.dest(build_img))
//   .pipe(browserSync.reload({stream:true}));
// });

//копирование фавиконок в корень директории сайта
gulp.task('favicon', function() {
  console.log('---------- Копирование фавиконок');
  return gulp.src(patch.src.favicon)
  .pipe(changed(patch.build.favicon))
  .pipe(gulp.dest(patch.build.favicon))
  .pipe(browserSync.reload({stream:true}));
});

gulp.task('sprite:svg', function() {

  if(patch.src.svg_sprite && patch.src.svg_sprite != '') {
     console.log('---------- Сборка SVG спрайта');
     return gulp.src(patch.src.svg_sprite + '*.svg')
       .pipe(svgmin({
         plugins: [
           {minifyStyles: true},
           {cleanupIDs: {
             minify: true
           }}
         ]
       }))
       .pipe(svgstore({ inlineSvg: true}))
       .pipe(cheerio({
         run: function($) {
           // используется при инлайнинге в html, для IE11 только инлайнинг
           $('svg').attr('style',  'display:none');
           // используется при внешнем спрайте для изменения цвета через color
           //$('symbol').attr('fill',  'currentColor');
         },
         parserOptions: {
           xmlMode: true
         }
       }))
       .pipe(rename('sprite-svg.svg'))
       //.pipe(gulpIf(!isDev, rev()))
       .pipe(gulp.dest(patch.src.svg_sprite + 'img/'));
       // .pipe(gulpIf(!isDev, rev.manifest(
       //   patch.build.root + 'rev-manifest.json',
       //   { base: patch.build.root,
       //   merge: true
       // })))
       // .pipe(gulpIf(!isDev, gulp.dest(patch.build.root)));

   }
   else {
     console.log('---------- Сборка SVG спрайта: ОТМЕНА, не используется на проекте');
   }
});

gulp.task('sprite:png', function (done) {
  if(patch.src.img_sprite && patch.src.img_sprite != '') {
    var spritesmith = require('gulp.spritesmith');
    var buffer = require('vinyl-buffer');
    var merge = require('merge-stream');

    console.log('---------- Сборка PNG спрайта');

    var spriteData = gulp.src(patch.src.img_sprite + '*.png')
      .pipe(spritesmith({
        imgName: 'sprite-png.png',
        cssName: 'sprite-png.scss',
        padding: 4,
        imgPath: '../img/sprite-png/sprite-png.png',
        algorithm: 'binary-tree',
        cssFormat: 'scss',
        cssTemplate: patch.src.img_sprite + 'scss-minimal.handlebars',
        cssVarMap: function(sprite) {
                    sprite.name = 's-' + sprite.name ;
                }
      }));
    var imgStream = spriteData.img
      .pipe(buffer())
      .pipe(gulpPngquant({quality: '65-80'}))
      .pipe(gulp.dest(patch.build.img_sprite));
    var cssStream = spriteData.css
      .pipe(gulp.dest(patch.src.scss_mixins));
    return merge(imgStream, cssStream);
  }
  else {
    console.log('---------- Сборка PNG спрайта: ОТМЕНА, нет используетя на проекте');
    done();
  }
});

gulp.task('font', function() {
  console.log('---------- Копирование шрифтов');
  return gulp.src(patch.src.fonts)
  .pipe(changed(patch.build.fonts))
  .pipe(gulp.dest(patch.build.fonts))
  .pipe(browserSync.reload({stream:true}));
});

gulp.task('revreplace', function(done) {

  if(fileExist(patch.build.root + 'rev-manifest.json') !== false) {
    var manifest = gulp.src(patch.build.root + 'rev-manifest.json');
    console.log('---------- Патчинг html для версионирования файлов');
    return gulp.src(patch.build.root + '*.html')
      .pipe(revReplace({manifest: manifest}))
      .pipe(gulp.dest(patch.build.root));
  }
  else {
    done();
  }
});

gulp.task('clean', function(done) {
  console.log('---------- Очистка рабочей директории');
  del.sync(patch.build.root + '*');
  done();
});

gulp.task('serve', function () {
    browserSync.init({
        server: patch.build.root,
        open: false,
        port: 8080,
        ui: false
    });
});

gulp.task('watch', function() {
  gulp.watch([patch.src.html, patch.src.html_templ],gulp.series('html'));

  gulp.watch([patch.src.scss, patch.src.blocks], gulp.series('style'));
  if (patch.src.copy_css && patch.src.copy_css != '')
    gulp.watch(patch.src.copy_css, gulp.series('style:copy'));

  gulp.watch(patch.src.js, gulp.series('js'));
  if (patch.src.copy_js && patch.src.copy_js != '')
    gulp.watch(patch.src.copy_js, gulp.series('js:copy'));

  gulp.watch(patch.src.img + '*.{jpg,jpeg,gif,png}', gulp.series('img:opt', 'img:webp'));
  gulp.watch(patch.src.img + '*.svg', gulp.series('img:opt'));
  gulp.watch(patch.src.favicon, gulp.series('favicon'));

  gulp.watch(patch.src.fonts, gulp.series('font'));

  gulp.watch(patch.src.img_to_bg + '*', gulp.series('style'));
  gulp.watch(patch.src.svg_inline + '*.svg', gulp.series('style'));

  if(patch.src.svg_sprite && patch.src.svg_sprite != '')
    gulp.watch(patch.src.svg_sprite + '*.svg', gulp.series('sprite:svg', 'html')); //требуется инклюд итогового спрайта в html
    //gulp.watch(patch.src.svg_sprite + '*.svg', gulp.series('sprite:svg')); - ватчер при подключении svg#extend

  if(patch.src.img_sprite && patch.src.img_sprite != '')
    gulp.watch(patch.src.img_sprite + '*.png', gulp.series('sprite:png', 'style'));
});

//по умолчанию запускаются задачи необходимые для продакшина
gulp.task('build', gulp.series(
  'clean', 'sprite:svg', 'sprite:png', 'img:opt', 'img:webp',
  gulp.parallel('html', 'style', 'style:copy', 'js', 'js:copy', 'favicon', 'font'),
  'revreplace'
));

//отдельная задача под разработку с ватчером и сервером
gulp.task('default', gulp.series('build', gulp.parallel('watch', 'serve')));

/**
 * Проверка существования файла или папки
 * @param  {string} filepath      Путь до файла или папки
 * @return {boolean}
 */
function fileExist (filepath) {
  var flag = true;
  try{
    fs.accessSync(filepath, fs.F_OK);
  } catch(e) {
    flag = false;
  }
  return flag;
}
