<table>
  <thead>
    <tr>
      <th>Команда</th>
      <th>Результат</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="22%"><code>npm i</code></td>
      <td>Установить зависимости</td>
    </tr>
    <tr>
      <td><code>npm start</code></td>
      <td>Запустить сборку, сервер и слежение за файлами</td>
    </tr>
    <tr>
      <td><code>npm run build</code></td>
      <td>Сборка проекта без карт кода (сжатый вид, как результат работы)</td>
    </tr>
    <tr>
      <td><code>npm start ЗАДАЧА</code></td>
      <td>Запустить задачу с названием ЗАДАЧА (список задач в <code>gulpfile.js</code>)</td>
    </tr>
  </tbody>
</table>

## Парадигма

- Используется именование классов по БЭМ.
- Каждый БЭМ-блок в отдельном файле внутри `source/blocks/`.
- Диспетчер подключения стилей `source/scss/style.scss` содержит ссылки на все файлы БЭМ-блоков `source/blocks/*.scss`. В этом файле, при необходимости, подключаются ссылки на css файлы библиотек зависимостей.
- Внешние файлы css библиотек зависимостей подключаются в style.scss с помощью gulp-file-include.
- В отдельной директории `source/libs` находятся файлы css, js, которые нужно по каким-то причинам нужно подключать отдельными файлами. Например, скрипт для стартовой проверки доступности JS и поддержки картинок WEBP с подключение в начале страницы до загрузки DOM.
- Файлы JS сторонних библиотек, которые нужно добавить в общий файл script.js, подключаются при указании ссылок на них в переменной patch.libs.js файла gulpfile.js
- Глобальные стили и переменные для scss находятся в общей папке `source/scss/`.
- Для инлайнинга картинок css используются плагины [postcss-inline-svg](https://github.com/TrySound/postcss-inline-svg) и [postcss-image-inliner](https://www.npmjs.com/package/postcss-image-inliner).
- Для разметки html используется [шаблонизация](https://www.npmjs.com/package/gulp-file-include).
- Комментарии вида "<!--DEV -->" для разработки и удалятся с html при сборке проекта на продакшин [gulp-replace](https://www.npmjs.com/package/gulp-replace).
- В gulpfile.js есть отдельная задача "html:sort", которая сортирует атрибуты тегов html, дабы атрибут класса был в начале тега. Задача обрабатывает исходные файлы, требует ручного запуска.


## Назначение папок

```bash
build/          # Папка сборки.
source/            # Исходные файлы
  blocks/       # - файлы БЭМ-блоков проекта
  fonts/        # - внешние шрифты
  html_templates/     # - фрагменты html шаблонов
  img/          # - глобальная папка для картинок, из нее генерируется минизированные картинки и картинки в формате webp
  img/favicon         # - содержит фавиконки, копируется как есть без обработки
  img/inline_img_to_css       # - картинки для инлайнинга в css
  img/inline_svg_to_css       # - svg для инлайнинга в css
  img/sprite-img        # - содержит картинки, которые объединяются в растровый спрайт (если такой спрайт используется на проекте)
  img/sprite-svg         # - содержит svg-файлы, которые объединяются в один svg-спрайт для подключения в html
  js/           # - содержит js-файлы, написанные для проекта
  libs/           # - содержит отдельные файлы js и css, которые нужно копировать в проект отдельными файлами
  scss/         # - содержит общие файлы scss и файл-диспетчер подключений для всех блоков из папки 'blocks'
  index.html    # - главная страница проекта
```


### HTML

Основные страницы проекта находятся в (`source/*.html`).
Шаблоны для подключения в основные страницы в (`source/html_templates/*.html`).

Используемый препроцессинг:

1. [gulp-file-include](https://www.npmjs.com/package/gulp-file-include)
2. [gulp-replace](https://www.npmjs.com/package/gulp-replace)


### Стили

Файл-диспетчер подключений (`source/scss/style.scss`).
Файл с общими переменными (`source/scss/variables.scss`).
Файл с общей стилизацией (`source/scss/scaffolding.scss`).

Используемый постпроцессинг:

1. [autoprefixer](https://github.com/postcss/autoprefixer)
2. [css-mqpacker](https://github.com/hail2u/node-css-mqpacker)
3. [postcss-inline-svg](https://github.com/TrySound/postcss-inline-svg)
4. [postcss-image-inliner](https://www.npmjs.com/package/postcss-image-inliner)
5. [cssnano](https://github.com/cssnano/cssnano) (только при генерации для продакшина)


### JS

Файлы JS находятся в папке (`source/js`) и объединяются в один при обработке.

Используемый препроцессинг:

1. [gulp-concat](https://www.npmjs.com/package/gulp-concat)
2. [gulp-uglify](https://www.npmjs.com/package/gulp-uglify) (только при генерации для продакшина)


### Картинки

Общие картинки находятся в корне папки (`source/img`). Минимизирются и генерируются варианты картинок с расширением webp.
Картинки фавиконок в (`source/img/favicon`). Копируются в проект как есть.
Растровые картинки для вставки в виде data:URI в css в папке (`source/img/inline_img_to_css`)
Векторные картинки для вставки в виде data:URI в css в папке (`source/img/inline_svg_to_css`)
Картинки для генерации растрового спрайта в папке (`source/img/sprite-img`)
Картинки для генерации векторного спрайта в папке (`source/img/sprite-svg`)

Минимизация общих картинок:

1. [gulp-pngquant](https://www.npmjs.com/package/gulp-pngquant)
2. [gulp-imagemin](https://www.npmjs.com/package/gulp-imagemin)
3. [imagemin-webp](https://github.com/imagemin/imagemin-webp)

Инлайнинг растровых картинок в css:

1. [postcss-image-inliner](https://www.npmjs.com/package/postcss-image-inliner)

Инлайнинг векторных картинов в css:

1. [postcss-inline-svg](https://github.com/TrySound/postcss-inline-svg)

Генерация растрового спрайта (если используется на проекте):

1. [gulp.spritesmith](https://www.npmjs.com/package/gulp.spritesmith)

Генерация веркторного спрайта:

1. [gulp-svgmin](https://www.npmjs.com/package/gulp-svgmin)
2. [gulp-svgstore](https://www.npmjs.com/package/gulp-svgstore)
3. [gulp-cheerio](https://www.npmjs.com/package/gulp-cheerio)
