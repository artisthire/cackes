(function() {

var toggle_btn = document.querySelector('.js-menu-toggle-btn');

if (toggle_btn) {

  var screen_width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  var screen_md = 768;

  //установка исходного состояния главного меню (закрыто)
  toggle_btn.classList.remove('menu-toggle-btn--open');
  toggle_btn.classList.add('menu-toggle-btn--close');

  if (toggle_btn.hasAttribute('aria-label'))
    toggle_btn.setAttribute('aria-label', 'Открыть меню');


  //обработка отрытия меню
  toggle_btn.addEventListener('click', function(event) {

    event.preventDefault();

    if(this.classList.contains('menu-toggle-btn--open')) {
      this.classList.remove('menu-toggle-btn--open');
      this.classList.add('menu-toggle-btn--close');

      if (this.hasAttribute('aria-label'))
        this.setAttribute('aria-label', 'Открыть меню');
    }
    else {
      this.classList.add('menu-toggle-btn--open');
      this.classList.remove('menu-toggle-btn--close');

      if (this.hasAttribute('aria-label'))
        this.setAttribute('aria-label', 'Закрыть меню');
    }
  });
}

}());
