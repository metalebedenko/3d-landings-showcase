/* ui.js — мобильное меню (бургер) + аккордеон на нативных <details>.
 * Плавный скролл — через CSS scroll-behavior, JS не требуется.
 * Хуки: [data-burger] (кнопка), [data-nav] (контейнер меню); открытое меню — класс .is-open.
 */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var burger = document.querySelector('[data-burger]');
    var nav = document.querySelector('[data-nav]');
    if (!burger || !nav) return;

    function close() { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }

    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  });
})();
