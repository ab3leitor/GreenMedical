document.addEventListener('DOMContentLoaded', () => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.progress');
  const menu = document.querySelector('.nav-links');
  const toggle = document.querySelector('.menu-toggle');

  document.querySelectorAll('.year').forEach(item => item.textContent = new Date().getFullYear());
  if (!reduced) prepareHeroCinema();

  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max ? scrollY / max * 100 : 0}%`;
    header.classList.toggle('scrolled', scrollY > 25);
  };
  addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.innerHTML = `<i class="bi bi-${open ? 'x-lg' : 'list'}"></i>`;
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<i class="bi bi-list"></i>';
  }));

  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach((item, index) => {
    item.style.transitionDelay = `${index % 3 * 65}ms`;
    observer.observe(item);
  });

  if (!reduced && matchMedia('(pointer:fine)').matches) {
    const orb = document.querySelector('.orb-cursor');
    addEventListener('pointermove', event => {
      orb.style.left = `${event.clientX}px`;
      orb.style.top = `${event.clientY}px`;
    }, { passive: true });
    document.querySelectorAll('.magnetic').forEach(button => {
      button.addEventListener('pointermove', event => {
        const rect = button.getBoundingClientRect();
        button.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .12}px,${(event.clientY - rect.top - rect.height / 2) * .12}px)`;
      });
      button.addEventListener('pointerleave', () => button.style.transform = '');
    });
  }

  setupCatalogExplorer();
  setupAboutCarousel(reduced);

  installContactExperience();
  installFooterMaps();
  document.querySelectorAll('form[data-contact]').forEach(setupContactForm);
  animateExperienceCounter(reduced);
  setupInstitutionalVideo(reduced);
});

function setupInstitutionalVideo(reduced) {
  const video = document.getElementById('institutionalVideo');
  const control = document.querySelector('.video-control');
  if (!video || !control) return;
  const icon = control.querySelector('i');
  const label = control.querySelector('span');
  let loaded = false;
  const loadVideo = () => {
    if (loaded || !video.dataset.src) return;
    loaded = true;
    video.src = video.dataset.src;
    video.load();
    if (!reduced) video.play().catch(() => {});
  };
  const updateControl = () => {
    icon.className = `bi bi-volume-${video.muted ? 'mute-fill' : 'up-fill'}`;
    label.textContent = video.muted ? 'Activar sonido' : 'Silenciar';
    control.setAttribute('aria-label', label.textContent + ' del video');
  };
  control.addEventListener('click', () => {
    loadVideo();
    video.muted = !video.muted;
    if (video.paused) video.play().catch(() => {});
    updateControl();
  });
  video.muted = true;
  const loader = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      loadVideo();
      loader.disconnect();
    }
  }, { rootMargin: '500px 0px' });
  loader.observe(video);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else if (loaded && !reduced) video.play().catch(() => {});
  });
  updateControl();
}

function setupAboutCarousel(reduced) {
  const carousel = document.querySelector('.about-carousel');
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll('.about-slide')];
  const dots = [...carousel.querySelectorAll('.about-carousel-dots button')];
  const progress = carousel.querySelector('.about-carousel-progress span');
  const previous = carousel.querySelector('[data-carousel-prev]');
  const next = carousel.querySelector('[data-carousel-next]');
  let current = 0;
  let timer;
  let touchStart = 0;

  const restartProgress = () => {
    progress.classList.remove('running');
    void progress.offsetWidth;
    if (!reduced) progress.classList.add('running');
  };
  const startAutoplay = () => {
    clearInterval(timer);
    if (!reduced) timer = setInterval(() => show(current + 1), 6500);
  };
  const show = (index, userInitiated = false) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === current;
      slide.classList.toggle('active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === current;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-selected', String(active));
    });
    restartProgress();
    if (userInitiated) startAutoplay();
  };
  const pause = () => {
    clearInterval(timer);
    progress.classList.remove('running');
  };

  previous.addEventListener('click', () => show(current - 1, true));
  next.addEventListener('click', () => show(current + 1, true));
  dots.forEach(dot => dot.addEventListener('click', () => show(Number(dot.dataset.slide), true)));
  carousel.addEventListener('mouseenter', pause);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', pause);
  carousel.addEventListener('focusout', event => {
    if (!carousel.contains(event.relatedTarget)) startAutoplay();
  });
  carousel.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') show(current - 1, true);
    if (event.key === 'ArrowRight') show(current + 1, true);
  });
  carousel.addEventListener('touchstart', event => touchStart = event.changedTouches[0].clientX, { passive: true });
  carousel.addEventListener('touchend', event => {
    const distance = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(distance) > 55) show(current + (distance < 0 ? 1 : -1), true);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : startAutoplay());
  show(0);
  startAutoplay();
}

function installFooterMaps() {
  document.querySelectorAll('.footer-grid').forEach(footer => {
    if (footer.querySelector('.footer-map')) return;
    footer.insertAdjacentHTML('beforeend', `<div class="footer-map"><div class="footer-map-copy"><span>Encuéntranos</span><b>Los Ebanistas #8521, La Reina</b><a href="https://maps.app.goo.gl/uhWnBv5ek7kK2BJJ7" target="_blank" rel="noreferrer">Abrir en Google Maps <i class="bi bi-arrow-up-right"></i></a></div><iframe title="Mapa de Green Medical" src="https://www.google.com/maps?q=Los%20Ebanistas%208521%2C%20La%20Reina%2C%20Santiago%2C%20Chile&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`);
  });
}

function prepareHeroCinema() {
  const heading = document.querySelector('.hero-content h1');
  if (!heading) return;
  const nodes = [...heading.childNodes];
  let letterIndex = 0;
  nodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const fragment = document.createDocumentFragment();
      [...node.textContent].forEach(character => {
        if (character === ' ') return fragment.append(' ');
        const span = document.createElement('span');
        span.className = 'hero-letter';
        span.textContent = character;
        span.style.animationDelay = `${.48 + letterIndex * .035}s`;
        fragment.append(span);
        letterIndex += 1;
      });
      node.replaceWith(fragment);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR') {
      const text = node.textContent;
      node.textContent = '';
      [...text].forEach(character => {
        const span = document.createElement('span');
        span.className = 'hero-letter';
        span.textContent = character;
        span.style.animationDelay = `${.48 + letterIndex * .035}s`;
        node.append(span);
        letterIndex += 1;
      });
    }
  });
  heading.classList.add('is-split');
}

function animateExperienceCounter(reduced) {
  const counter = document.querySelector('.hero-badge strong');
  if (!counter) return;
  if (reduced) {
    counter.textContent = '30+';
    return;
  }
  counter.textContent = '0';
  let started = false;
  const counterObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting) || started) return;
    started = true;
    const duration = 1450;
    const delay = 650;
    setTimeout(() => {
      const start = performance.now();
      const tick = now => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.min(30, Math.floor(eased * 31));
        counter.textContent = `${value}${value === 30 ? '+' : ''}`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    counterObserver.disconnect();
  }, { threshold: .45 });
  counterObserver.observe(counter);
}

function setupCatalogExplorer() {
  const catalog = window.GREEN_MEDICAL_CATALOG;
  const display = document.querySelector('.catalog-display');
  const tabs = [...document.querySelectorAll('.catalog-tab')];
  if (!catalog || !display || !tabs.length) return;

  const categoryMeta = {
    belleza: ['Categoría 01', 'Belleza', 'Aceites y geles para complementar rutinas de cuidado exterior.', 'bi-stars'],
    comestible: ['Categoría 02', 'Comestible', 'Opciones naturales para sumar variedad a diferentes momentos del día.', 'bi-cup-hot'],
    cuidado: ['Categoría 03', 'Cuidado personal', 'Soluciones prácticas para hábitos cotidianos de higiene y bienestar.', 'bi-droplet'],
    natural: ['Categoría 04', 'Natural', 'Productos basados en ingredientes de origen natural y formatos funcionales.', 'bi-flower1'],
    suplemento: ['Categoría 05', 'Suplementos', 'Vitaminas, minerales, extractos y formatos para distintas preferencias.', 'bi-capsule'],
  };
  let activeCategory = 'belleza';
  let activeGroup = 'Todos';
  let query = '';

  display.innerHTML = `
    <div class="catalog-panel catalog-dynamic active" role="tabpanel">
      <div class="catalog-heading">
        <div><p class="eyebrow" data-catalog-eyebrow></p><h3 data-catalog-title></h3><p data-catalog-copy></p></div>
        <div class="catalog-total"><strong data-catalog-count>0</strong><span>productos</span></div>
      </div>
      <div class="catalog-tools">
        <label class="catalog-search"><i class="bi bi-search"></i><span class="sr-only">Buscar producto</span><input type="search" placeholder="Buscar por nombre..." autocomplete="off"></label>
        <div class="catalog-filters" aria-label="Filtrar por subcategoría"></div>
      </div>
      <div class="catalog-results" aria-live="polite"></div>
      <p class="catalog-disclaimer">Información general del catálogo. La disponibilidad puede variar y los suplementos no sustituyen una alimentación equilibrada ni la orientación profesional.</p>
    </div>`;

  const eyebrow = display.querySelector('[data-catalog-eyebrow]');
  const title = display.querySelector('[data-catalog-title]');
  const copy = display.querySelector('[data-catalog-copy]');
  const count = display.querySelector('[data-catalog-count]');
  const search = display.querySelector('.catalog-search input');
  const filters = display.querySelector('.catalog-filters');
  const results = display.querySelector('.catalog-results');

  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const productCard = (product, icon) => {
    const article = document.createElement('article');
    article.className = 'catalog-card';
    article.innerHTML = `<div class="catalog-card-icon"><i class="bi ${icon}"></i></div><div><h4></h4><p></p><a href="contacto.html">Consultar <i class="bi bi-arrow-up-right"></i></a></div>`;
    article.querySelector('h4').textContent = product.name;
    article.querySelector('p').textContent = product.description;
    return article;
  };

  function renderProducts() {
    const products = catalog[activeCategory] || [];
    const filtered = products.filter(product => {
      const matchesGroup = activeGroup === 'Todos' || product.group === activeGroup;
      const matchesQuery = !query || normalize(`${product.name} ${product.group}`).includes(normalize(query));
      return matchesGroup && matchesQuery;
    });
    count.textContent = filtered.length;
    results.replaceChildren();

    if (!filtered.length) {
      results.innerHTML = '<div class="catalog-empty"><i class="bi bi-search"></i><b>No encontramos coincidencias</b><span>Prueba con otro nombre o limpia los filtros.</span></div>';
      return;
    }

    const groups = [...new Set(filtered.map(product => product.group))];
    groups.forEach(groupName => {
      const section = document.createElement('section');
      section.className = 'catalog-group';
      const groupProducts = filtered.filter(product => product.group === groupName);
      section.innerHTML = `<div class="catalog-group-title"><h4></h4><span>${groupProducts.length}</span></div><div class="catalog-grid"></div>`;
      section.querySelector('.catalog-group-title h4').textContent = groupName;
      const grid = section.querySelector('.catalog-grid');
      groupProducts.forEach(product => grid.append(productCard(product, categoryMeta[activeCategory][3])));
      results.append(section);
    });
  }

  function renderFilters() {
    const groups = ['Todos', ...new Set(catalog[activeCategory].map(product => product.group))];
    filters.replaceChildren();
    groups.forEach(groupName => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = groupName === activeGroup ? 'active' : '';
      button.textContent = groupName;
      button.addEventListener('click', () => {
        activeGroup = groupName;
        renderFilters();
        renderProducts();
      });
      filters.append(button);
    });
  }

  function activateCategory(category) {
    activeCategory = category;
    activeGroup = 'Todos';
    query = '';
    search.value = '';
    const [label, heading, description] = categoryMeta[category];
    eyebrow.textContent = label;
    title.textContent = heading;
    copy.textContent = description;
    tabs.forEach(tab => {
      const active = tab.dataset.category === category;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    renderFilters();
    renderProducts();
    if (innerWidth < 951) display.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  tabs.forEach(tab => tab.addEventListener('click', () => activateCategory(tab.dataset.category)));
  search.addEventListener('input', () => {
    query = search.value.trim();
    renderProducts();
  });
  activateCategory(activeCategory);
}

function installContactExperience() {
  document.body.insertAdjacentHTML('beforeend', `
    <aside class="social-bubbles" aria-label="Redes y contacto">
      <a class="social-bubble whatsapp" href="https://wa.me/56222387651" target="_blank" rel="noreferrer" aria-label="Contactar por WhatsApp"><i class="bi bi-whatsapp"></i><span>WhatsApp</span></a>
      <a class="social-bubble instagram" href="https://www.instagram.com/greenmedicalab" target="_blank" rel="noreferrer" aria-label="Visitar Instagram"><i class="bi bi-instagram"></i><span>Instagram</span></a>
      <a class="social-bubble facebook" href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Visitar Facebook"><i class="bi bi-facebook"></i><span>Facebook</span></a>
    </aside>
    <div class="contact-modal" id="contactModal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" aria-hidden="true">
      <div class="modal-backdrop" data-close-modal></div><div class="modal-orbit" aria-hidden="true"><i></i></div>
      <div class="modal-card"><button class="modal-close" type="button" data-close-modal aria-label="Cerrar contacto"><i class="bi bi-x-lg"></i></button>
        <div class="modal-info"><div class="modal-logo" aria-label="Green Medical Laboratorios"></div><p class="eyebrow" style="color:var(--lime)">Hablemos</p><h2 id="modalTitle">¿Cómo podemos ayudarte?</h2><p>Productos, distribución y oportunidades comerciales. Nuestro equipo está disponible de lunes a viernes.</p><div class="modal-quick"><a href="tel:+56222387651"><i class="bi bi-telephone"></i>+56 2 2238 7651</a><a href="mailto:comercial@greenmedical.cl"><i class="bi bi-envelope"></i>comercial@greenmedical.cl</a><a href="https://maps.app.goo.gl/uhWnBv5ek7kK2BJJ7" target="_blank" rel="noreferrer"><i class="bi bi-geo-alt"></i>La Reina, Santiago</a><a href="https://wa.me/56222387651" target="_blank" rel="noreferrer"><i class="bi bi-whatsapp"></i>WhatsApp</a></div></div>
        <form class="modal-form" data-contact action="contacto.php" method="post" novalidate><p class="eyebrow">Escríbenos</p><input class="contact-trap" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true"><div class="form-grid"><label><span>Nombre</span><input name="nombre" type="text" autocomplete="name" placeholder="Tu nombre" minlength="2" maxlength="100" required><small></small></label><label><span>Correo</span><input name="email" type="email" autocomplete="email" placeholder="tu@email.cl" maxlength="160" required><small></small></label><label><span>Teléfono</span><input name="telefono" type="tel" autocomplete="tel" placeholder="+56 9 1234 5678" maxlength="40"><small></small></label><label><span>Consulta</span><select name="tipo" required><option value="">Selecciona</option><option>Consulta de productos</option><option>Venta y distribución</option><option>Área comercial</option><option>Otra consulta</option></select><small></small></label><label class="full"><span>Mensaje</span><textarea name="mensaje" rows="4" minlength="10" maxlength="800" placeholder="Cuéntanos cómo podemos ayudarte..." required></textarea><small></small></label></div><button class="button button-dark" type="submit">Enviar mensaje <i class="bi bi-send"></i></button></form>
      </div>
    </div><div class="toast" role="status" aria-live="polite"></div>`);

  const modal = document.getElementById('contactModal');
  const openModal = event => {
    event?.preventDefault();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => modal.querySelector('input')?.focus(), 350);
  };
  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };
  document.querySelectorAll('a[href="contacto.html"], a[href$="contacto.html"], a[href="contacto.html#formulario"], a[href="#formulario"]').forEach(link => link.addEventListener('click', openModal));
  modal.querySelectorAll('[data-close-modal]').forEach(item => item.addEventListener('click', closeModal));
  addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
  setupContactForm(modal.querySelector('form'));
}

function setupContactForm(form) {
  if (!form || form.dataset.ready) return;
  form.dataset.ready = 'true';
  const toast = document.querySelector('.toast');
  const show = message => {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  };
  const validate = field => {
    const error = field.parentElement.querySelector('small');
    let message = '';
    if (field.required && !field.value.trim()) message = 'Este campo es obligatorio.';
    else if (field.type === 'email' && !/^\S+@\S+\.\S+$/.test(field.value)) message = 'Ingresa un correo válido.';
    else if (field.minLength > 0 && field.value.trim().length < field.minLength) message = `Escribe al menos ${field.minLength} caracteres.`;
    error.textContent = message;
    field.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
  };
  form.querySelectorAll('input,textarea,select').forEach(field => field.addEventListener('blur', () => validate(field)));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const fields = [...form.querySelectorAll('input,textarea,select')];
    if (!fields.map(validate).every(Boolean)) {
      show('Revisa los campos marcados.');
      fields.find(field => field.getAttribute('aria-invalid') === 'true')?.focus();
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    const originalLabel = button.innerHTML;
    button.disabled = true;
    button.innerHTML = 'Enviando... <i class="bi bi-arrow-repeat"></i>';
    try {
      const response = await fetch(form.action || 'contacto.php', {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'No pudimos enviar el mensaje.');
      form.reset();
      form.querySelectorAll('[aria-invalid]').forEach(field => field.setAttribute('aria-invalid', 'false'));
      show(result.message || 'Mensaje enviado correctamente.');
    } catch (error) {
      show(error.message || 'No pudimos enviar el mensaje. Intenta nuevamente.');
    } finally {
      button.disabled = false;
      button.innerHTML = originalLabel;
    }
  });
}
