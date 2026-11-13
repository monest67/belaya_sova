/* ==========================================================================
   Учебный центр «Белая Сова» — интерактив лендинга
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. КОНФИГУРАЦИЯ — ЗАПОЛНИТЕ ПЕРЕД ПУБЛИКАЦИЕЙ
     ------------------------------------------------------------------ */
  const CONFIG = {
    // URL обработчика заявок (API, Telegram-бот и т.п.).
    // Пока пусто — форма НЕ отправляется и НЕ показывает фейковый успех.
    formEndpoint: '',

    // Ссылка на карточку организации в Яндекс Картах (для кнопки «Смотреть отзывы»)
    yandexReviewsUrl: ''
  };

  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     2. ШАПКА: тень при прокрутке
     ------------------------------------------------------------------ */
  const header = $('#header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

    /* ------------------------------------------------------------------
     3. БУРГЕР-МЕНЮ (полноэкранный оверлей)
     ------------------------------------------------------------------ */
  document.documentElement.style.colorScheme = 'light';

  const burger = $('.burger');
  const mobileMenu = $('#mobile-menu');

  // Переносим меню прямо в <body> — position:fixed работает от вьюпорта,
  // меню не «зажимается» sticky-шапкой
  if (mobileMenu && mobileMenu.parentElement !== document.body) {
    document.body.appendChild(mobileMenu);
  }

  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');

    // Блокировка скролла body (дублирует CSS, на случай JS-выключенных стилей)
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.style.touchAction = open ? 'none' : '';
  }

  burger.addEventListener('click', () => {
    setMenu(!document.body.classList.contains('menu-open'));
  });

  // Закрытие по клику на любой элемент меню (ссылки, телефон, CTA)
  $$('#mobile-menu a, #mobile-menu button').forEach((el) => {
    el.addEventListener('click', () => setMenu(false));
  });

  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
  });

  // Закрытие по клику на пустую область меню (не по ссылкам и не по бургеру)
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) setMenu(false);
  });

  // Автоматическое закрытие при ресайзе до десктопа
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024 && document.body.classList.contains('menu-open')) {
      setMenu(false);
    }
  });

  // Предотвращаем случайный скролл вьюпорта за открытым меню на iOS
  mobileMenu.addEventListener('touchmove', (e) => {
    if (e.target === mobileMenu) e.preventDefault();
  }, { passive: false });
  /* ------------------------------------------------------------------
     4. ПОЯВЛЕНИЕ БЛОКОВ ПРИ СКРОЛЛЕ
     ------------------------------------------------------------------ */
  const revealEls = $$('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------
     5. ФИКСИРОВАННАЯ МОБИЛЬНАЯ CTA
        Видна после первого экрана, скрыта в зоне контактов и футера
     ------------------------------------------------------------------ */
  const mobileCta = $('#mobile-cta');
  const hero = $('#hero');
  const contacts = $('#contacts');
  const footer = $('.site-footer');
  let heroVisible = true, contactsVisible = false, footerVisible = false;

  function updateCta() {
    const show = !heroVisible && !contactsVisible && !footerVisible && window.innerWidth < 1024;
    mobileCta.classList.toggle('is-visible', show);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { heroVisible = es[0].isIntersecting; updateCta(); }, { threshold: 0.15 }).observe(hero);
    new IntersectionObserver((es) => { contactsVisible = es[0].isIntersecting; updateCta(); }, { threshold: 0.05 }).observe(contacts);
    new IntersectionObserver((es) => { footerVisible = es[0].isIntersecting; updateCta(); }, { threshold: 0.05 }).observe(footer);
  }
  window.addEventListener('resize', updateCta);

  /* ------------------------------------------------------------------
     6. CTA-КНОПКИ: прокрутка к форме, фокус, предвыбор направления
     ------------------------------------------------------------------ */
  const formCard = $('#request-form');
  const directionSelect = $('#f-direction');

  function focusForm() {
    formCard.classList.add('flash');
    setTimeout(() => formCard.classList.remove('flash'), 1200);
    const nameInput = $('#f-name');
    setTimeout(() => nameInput.focus({ preventScroll: true }), prefersReduced ? 0 : 450);
  }

  $$('[data-focus-form]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setMenu(false);
      setTimeout(focusForm, 100);
    });
  });

  // Кнопки карточек направлений: подставляют направление в форму
  $$('[data-direction]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-direction');
      if (directionSelect && directionSelect.querySelector(`option[value="${value}"]`)) {
        directionSelect.value = value;
      }
    });
  });

  /* ------------------------------------------------------------------
     7. FAQ-АККОРДЕОН
     ------------------------------------------------------------------ */
  $$('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ------------------------------------------------------------------
     8. МАСКА И ВАЛИДАЦИЯ ТЕЛЕФОНА
     ------------------------------------------------------------------ */
  const phoneInput = $('#f-phone');
  const digitsOf = (v) => v.replace(/\D/g, '');

  function formatPhone(raw) {
    let d = digitsOf(raw);
    if (!d) return '';
    if (d[0] === '7' || d[0] === '8') d = d.slice(1);
    d = d.slice(0, 10);
    let out = '+7';
    if (d.length > 0) out += ' (' + d.slice(0, 3);
    if (d.length >= 3) out += ')';
    if (d.length > 3) out += ' ' + d.slice(3, 6);
    if (d.length > 6) out += '-' + d.slice(6, 8);
    if (d.length > 8) out += '-' + d.slice(8, 10);
    return out;
  }

  phoneInput.addEventListener('input', () => {
    phoneInput.value = formatPhone(phoneInput.value);
  });
  phoneInput.addEventListener('focus', () => {
    if (!phoneInput.value) phoneInput.value = '+7 (';
  });
  phoneInput.addEventListener('blur', () => {
    if (digitsOf(phoneInput.value).length === 0) phoneInput.value = '';
  });

  /* ------------------------------------------------------------------
     9. ФОРМА ЗАЯВКИ: валидация, состояния, отправка
     ------------------------------------------------------------------ */
  const form = $('#lead-form');
  const submitBtn = $('#submit-btn');
  const statusBox = $('#form-status');

  function setFieldError(input, errorEl, show) {
    if (show) {
      input.setAttribute('aria-invalid', 'true');
      errorEl.hidden = false;
    } else {
      input.removeAttribute('aria-invalid');
      errorEl.hidden = true;
    }
  }

  function showStatus(type, text) {
    statusBox.hidden = false;
    statusBox.className = 'form-status ' + (type === 'success' ? 'is-success' : 'is-error');
    statusBox.textContent = text;
  }

  function validate() {
    let ok = true;
    const name = $('#f-name');
    const nameErr = $('#err-name');
    const nameBad = name.value.trim().length < 2;
    setFieldError(name, nameErr, nameBad);
    if (nameBad) ok = false;

    const phoneErr = $('#err-phone');
    const phoneBad = digitsOf(phoneInput.value).length !== 10;
    setFieldError(phoneInput, phoneErr, phoneBad);
    if (phoneBad) ok = false;

    const consent = $('#f-consent');
    const consentErr = $('#err-consent');
    setFieldError(consent, consentErr, !consent.checked);
    if (!consent.checked) ok = false;

    return ok;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    statusBox.hidden = true;

    if (!validate()) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const payload = {
      name: $('#f-name').value.trim(),
      phone: phoneInput.value.trim(),
      child: $('#f-child').value.trim(),
      direction: directionSelect.value,
      format: (form.querySelector('input[name="format"]:checked') || {}).value || 'undecided',
      comment: $('#f-comment').value.trim(),
      consent: true,
      meta: { page: 'belaya-sova-landing', submittedAt: new Date().toISOString() }
    };

    // Обработчик не подключён — честно сообщаем, фейкового успеха нет
    if (!CONFIG.formEndpoint) {
      showStatus('error',
        'Заявка не отправлена: сервис приёма заявок не подключён. ' +
        'Укажите CONFIG.formEndpoint в файле js/script.js (см. README.md).');
      console.warn('[Белая Сова] FORM_ENDPOINT не задан. Данные заявки:', payload);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');

    fetch(CONFIG.formEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        showStatus('success', 'Заявка отправлена! Мы свяжем с вами в ближайшее время.');
        form.reset();
      })
      .catch(() => {
        showStatus('error', 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.');
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
      });
  });

  // Сброс ошибки поля при вводе
  [['#f-name', '#err-name'], ['#f-phone', '#err-phone'], ['#f-consent', '#err-consent']].forEach(([i, e]) => {
    const input = $(i); const err = $(e);
    const ev = input.type === 'checkbox' ? 'change' : 'input';
    input.addEventListener(ev, () => setFieldError(input, err, false));
  });

  /* ------------------------------------------------------------------
     10. ССЫЛКИ-ЗАГЛУШКИ (телефон, отзывы, политики)
     ------------------------------------------------------------------ */
  $$('a[data-placeholder]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const key = a.getAttribute('data-placeholder');
      if (key === 'yandex-reviews-url' && CONFIG.yandexReviewsUrl) {
        window.open(CONFIG.yandexReviewsUrl, '_blank', 'noopener');
        return;
      }
      console.info('[Белая Сова] Ссылка-заглушка: "' + key + '". Заполните её перед публикацией (см. README.md).');
    });
  });

  /* ------------------------------------------------------------------
     11. ЗАГЛУШКИ ОТСУТСТВУЮЩИХ ИЗОБРАЖЕНИЙ (dev-режим)
         Если файла нет — показывается аккуратный плейсхолдер с именем файла.
         Уберите атрибут data-fallback в HTML, чтобы отключить.
     ------------------------------------------------------------------ */
  function placeholderSrc(label, isLogo) {
    const w = isLogo ? 96 : 800;
    const h = isLogo ? 96 : 600;
    const body = isLogo
      ? "<circle cx='48' cy='42' r='24' fill='#FFFDF7'/>" +
        "<path d='M31 28 L35 16 L43 24 Z M65 28 L61 16 L53 24 Z' fill='#FFFDF7'/>" +
        "<circle cx='40' cy='40' r='6.5' fill='#17172D'/><circle cx='56' cy='40' r='6.5' fill='#17172D'/>" +
        "<circle cx='41.5' cy='38.5' r='2' fill='#D6A94F'/><circle cx='57.5' cy='38.5' r='2' fill='#D6A94F'/>" +
        "<path d='M48 46 l-4 5 4 6 4-6 z' fill='#D6A94F'/>" +
        "<rect x='30' y='72' width='36' height='6' rx='3' fill='#D6A94F'/>"
      : "<circle cx='400' cy='250' r='70' fill='none' stroke='#D6A94F' stroke-width='3'/>" +
        "<circle cx='380' cy='235' r='10' fill='#D6A94F'/><circle cx='420' cy='235' r='10' fill='#D6A94F'/>" +
        "<text x='400' y='380' fill='#D6A94F' font-family='Georgia,serif' font-size='34' text-anchor='middle'>" + label + "</text>" +
        "<text x='400' y='415' fill='#8f8fa8' font-family='Arial,sans-serif' font-size='18' text-anchor='middle'>фотография будет добавлена</text>";
    const svg =
      "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "' viewBox='0 0 " + w + " " + h + "'>" +
      "<rect width='" + w + "' height='" + h + "' rx='" + (isLogo ? 22 : 0) + "' fill='#252542'/>" + body + "</svg>";
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  $$('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', function handle() {
      img.removeEventListener('error', handle);
      img.classList.add('img-missing');
      img.src = placeholderSrc(img.getAttribute('data-fallback'), img.getAttribute('data-fallback') === 'logo');
    });
  });
})();