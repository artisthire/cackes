(function () {
  var html = document.documentElement;

  if (html.classList.contains('no-js'))
      html.classList.remove('no-js');
  html.classList.add('js');

  var  WebP = new Image();

  WebP.onload = WebP.onerror = function() {
    isSupported = (WebP.height === 2);

    if (isSupported) {
      if (html.classList.contains('no-webp'))
        html.classList.remove('no-webp');
      html.classList.add('webp');
    }
  };
  WebP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
} ());
