(function() {

var toggle_btn = document.querySelector('.js-menu-toggle-btn');

if (toggle_btn) {

  //установка исходного состояния главного меню (закрыто)
  toggle_btn.classList.remove('menu-toggle-btn--open');
  toggle_btn.classList.add('menu-toggle-btn--close');


  //обработка отрытия меню
  toggle_btn.addEventListener('click', function(event) {

    event.preventDefault();

    if(this.classList.contains('menu-toggle-btn--open')) {
      this.classList.remove('menu-toggle-btn--open');
      this.classList.add('menu-toggle-btn--close');
    }
    else {
      this.classList.add('menu-toggle-btn--open');
      this.classList.remove('menu-toggle-btn--close');
    }
  });
}

}());
