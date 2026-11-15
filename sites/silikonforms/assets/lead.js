/* Local portfolio demo: render a request preview without transmitting or persisting it. */
(function () {
  'use strict';

  function value(field) {
    if (field.type === 'checkbox') {
      return field.checked ? (field.getAttribute('data-checked-value') || 'да') : '';
    }
    return (field.value || '').trim();
  }

  function preview(group) {
    var fields = Array.prototype.slice.call(group.querySelectorAll('[data-label]'));
    var note = group.querySelector('[data-lead-note]');
    var panel = group.querySelector('[data-lead-preview]');
    var output = group.querySelector('[data-lead-output]');
    var missing = null;
    fields.forEach(function (field) {
      var invalid = field.hasAttribute('data-required') && !value(field);
      field.classList.toggle('is-invalid', invalid);
      if (invalid) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
      if (invalid && !missing) missing = field;
    });
    if (missing) {
      panel.hidden = true;
      note.textContent = 'Добавьте описание изделия, чтобы посмотреть пример заявки.';
      note.setAttribute('data-kind', 'warn');
      missing.focus();
      return;
    }
    var lines = [
      'Демонстрационная заявка · ' + group.getAttribute('data-brand'),
      group.getAttribute('data-service') || '',
      ''
    ];
    fields.forEach(function (field) {
      var content = value(field);
      if (content) lines.push(field.getAttribute('data-label') + ': ' + content);
    });
    output.textContent = lines.join('\n');
    panel.hidden = false;
    note.textContent = 'Пример готов. Он показан только на этой странице.';
    note.setAttribute('data-kind', 'ok');
    panel.focus();
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-lead]'), function (group) {
      var button = group.querySelector('[data-lead-button]');
      if (!button) return;
      button.addEventListener('click', function () { preview(group); });
    });
  });
})();
