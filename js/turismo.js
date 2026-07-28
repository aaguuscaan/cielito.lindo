/* ============================================================
   TURISMO — Guía de paseos desde Barrio El Sereno / Cielito Lindo
   Fuente: guía turística provista por el anfitrión (jul. 2026)
   ============================================================ */

const TURISMO_ORIGEN = 'Cielito Lindo, V6FP+V9, Villa Yacanto, Córdoba, Argentina';

function turismoMapsUrl(destino) {
  const params = new URLSearchParams({
    api: '1',
    origin: TURISMO_ORIGEN,
    destination: `${destino}, Córdoba, Argentina`,
    travelmode: 'driving'
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

const LEVEL_LABELS = {
  facil:   'Salida fácil',
  ripio:   'Con ripio',
  montana: 'Montaña / aventura'
};

const TURISMO_DATA = [
  // ── Balnearios y ríos ──
  {
    categoria: 'balnearios', nombre: 'El Durazno', tag: 'Familiar · río', tiempo: '15–25 min', nivel: 'ripio',
    desc: 'Río de aguas transparentes y frías, playas pequeñas, ollas naturales y un entorno serrano muy tranquilo. Ideal para medio día o el día completo.',
    nota: 'Camino de ripio; manejar despacio y consultar estado tras lluvias.', destino: 'El Durazno'
  },
  {
    categoria: 'balnearios', nombre: 'Los Cajones del Durazno', tag: 'Naturaleza · caminata', tiempo: '25–40 min', nivel: 'montana',
    desc: 'Sector natural aguas arriba con paredones de piedra, pequeñas cascadas y pozones. Requiere caminar y prestar atención a rocas resbaladizas.',
    nota: 'No ingresar con tormentas o caudal alto.', destino: 'Los Cajones del Durazno'
  },
  {
    categoria: 'balnearios', nombre: 'Camping El Durazno', tag: 'Familiar · servicios', tiempo: '15–25 min', nivel: 'facil',
    desc: 'Opción práctica para combinar río, sombra y servicios básicos: sanitarios, proveeduría o zonas delimitadas.',
    nota: 'Servicios y tarifas pueden variar por temporada.', destino: 'Camping El Durazno'
  },
  {
    categoria: 'balnearios', nombre: 'San Miguel de los Ríos', tag: 'Familiar · paisaje', tiempo: '25–40 min', nivel: 'ripio',
    desc: 'Valle serrano atravesado por los ríos San Miguel y Tabaquillo, con sectores de playa y arboledas. Excelente para picnic y fotos.',
    nota: 'Aproximadamente 8 km de ripio desde Villa Yacanto.', destino: 'San Miguel de los Ríos'
  },
  {
    categoria: 'balnearios', nombre: 'Puente Blanco', tag: 'Familiar · río', tiempo: '30–45 min', nivel: 'ripio',
    desc: 'Balneario agreste sobre el río Santa Rosa, conocido por su arena clara, agua cristalina y pinares. Salida corta y muy fotogénica.',
    nota: 'Acceso por camino serrano; verificar transitabilidad.', destino: 'Puente Blanco'
  },
  {
    categoria: 'balnearios', nombre: 'Complejo / Camping Río Grande', tag: 'Río · descanso', tiempo: '30–50 min', nivel: 'ripio',
    desc: 'Paraje rural a orillas del Río Grande con espacios para pasar el día y alternativas de camping, dormis o cabañas según disponibilidad.',
    nota: 'Confirmar apertura, acceso y reservas antes de ir.', destino: 'Complejo / Camping Río Grande'
  },
  {
    categoria: 'balnearios', nombre: 'Intiyaco', tag: 'Río · paseo', tiempo: '45–70 min', nivel: 'ripio',
    desc: 'Pequeño enclave entre pinares y álamos, con río de agua clara y rincones tranquilos. Se puede combinar con Villa Alpina o La Cumbrecita.',
    nota: 'El tiempo depende del estado del camino y la ruta elegida.', destino: 'Intiyaco'
  },
  // ── Vistas y montaña ──
  {
    categoria: 'vistas', nombre: 'Camino a Cerro Linderos', tag: 'Panorámico · aventura', tiempo: '2–3 h hasta el filo', nivel: 'montana',
    desc: 'Una de las mejores rutas panorámicas de la región: asciende desde Villa Yacanto hacia las Sierras Grandes, con quebradas, pinares y vistas cada vez más amplias.',
    nota: 'Son unos 42 km de ripio; consultar Bomberos/Turismo y clima.', destino: 'Camino a Cerro Linderos'
  },
  {
    categoria: 'vistas', nombre: 'Cerro Champaquí desde Linderos', tag: 'Trekking · exigente', tiempo: 'Día completo', nivel: 'montana',
    desc: 'Desde el final del camino vehicular se realiza una caminata hasta la cumbre. Es una excursión de montaña: requiere planificación, abrigo y guía habilitado.',
    nota: 'Zona de riesgo; registrarse y usar prestador habilitado.', destino: 'Cerro Champaquí desde Linderos'
  },
  {
    categoria: 'vistas', nombre: 'Cerro Blanco', tag: 'Mirador · foto', tiempo: '45–75 min', nivel: 'ripio',
    desc: 'Punto serrano cercano al corredor hacia Linderos, apreciado por sus vistas abiertas del valle y las Sierras Grandes. Recomendable al amanecer o al atardecer.',
    nota: 'Ubicación y acceso local: confirmar en Turismo de Yacanto.', destino: 'Cerro Blanco'
  },
  {
    categoria: 'vistas', nombre: 'Mirador / zona de Tigre Muerto', tag: 'Aventura · MTB', tiempo: '1–2 h', nivel: 'montana',
    desc: 'Circuito rural de paisaje muy solitario, con senderos y vistas del entorno serrano. Más adecuado para caminantes, ciclistas o vehículos preparados.',
    nota: 'Acceso poco señalizado; usar track confiable o guía local.', destino: 'Mirador / zona de Tigre Muerto'
  },
  {
    categoria: 'vistas', nombre: 'Capilla de El Durazno', tag: 'Cultural · paisaje', tiempo: '15–25 min', nivel: 'facil',
    desc: 'Pequeña capilla integrada al paisaje del paraje, ideal para una parada breve, fotos y contemplación. Combina muy bien con el río y Los Cajones.',
    nota: 'Respetar horarios, silencio y propiedad privada.', destino: 'Capilla de El Durazno'
  },
  // ── Pueblos y circuitos ──
  {
    categoria: 'pueblos', nombre: 'Villa Yacanto centro', tag: 'Pueblo · servicios', tiempo: '8–15 min', nivel: 'facil',
    desc: 'Pueblo serrano tranquilo al pie del Champaquí. Vale recorrer la plaza, la capilla, comer algo y consultar en la oficina de Turismo.',
    nota: 'Buen punto para abastecer combustible, agua y alimentos.', destino: 'Villa Yacanto centro'
  },
  {
    categoria: 'pueblos', nombre: 'El Durazno (paraje)', tag: 'Paraje · río', tiempo: '15–25 min', nivel: 'facil',
    desc: 'Paraje pequeño y muy pintoresco junto al río. Su encanto está en caminar sin apuro, disfrutar la costa y combinar naturaleza con gastronomía sencilla.',
    nota: 'En verano puede haber alta demanda de estacionamiento.', destino: 'El Durazno'
  },
  {
    categoria: 'pueblos', nombre: 'Villa Alpina', tag: 'Aldea · trekking', tiempo: '60–90 min', nivel: 'ripio',
    desc: 'Aldea de montaña entre coníferas, a los pies del Champaquí. Excelente para caminar, almorzar y disfrutar del río; también punto de partida de travesías.',
    nota: 'Camino serrano; considerar tiempo extra por ripio.', destino: 'Villa Alpina'
  },
  {
    categoria: 'pueblos', nombre: 'La Cumbrecita', tag: 'Pueblo · senderos', tiempo: '75–110 min', nivel: 'ripio',
    desc: 'Pueblo peatonal de estilo centroeuropeo, con senderos, cascadas, bosques y gastronomía. Requiere prácticamente un día completo para disfrutarlo bien.',
    nota: 'En temporada puede requerir reserva de estacionamiento.', destino: 'La Cumbrecita'
  },
  {
    categoria: 'pueblos', nombre: 'Athos Pampa', tag: 'Ruta escénica', tiempo: '40–60 min', nivel: 'ripio',
    desc: 'Paraje rural rodeado de pinares y campos, ideal como parte del circuito hacia Intiyaco, Villa Alpina o La Cumbrecita.',
    nota: 'Pocos servicios; cargar combustible y provisiones antes.', destino: 'Athos Pampa'
  },
  {
    categoria: 'pueblos', nombre: 'Los Reartes', tag: 'Pueblo · río', tiempo: '55–80 min', nivel: 'facil',
    desc: 'Pueblo histórico con costanera y balnearios sobre el río Los Reartes. Buena opción para combinar río, gastronomía y arquitectura tradicional.',
    nota: 'Más movimiento en fines de semana y verano.', destino: 'Los Reartes'
  },
  {
    categoria: 'pueblos', nombre: 'Villa General Belgrano', tag: 'Gastronomía · paseo', tiempo: '60–85 min', nivel: 'facil',
    desc: 'Centro turístico emblemático de Calamuchita, con gastronomía, cervecerías, comercios y arquitectura alpina. Ideal para una tarde o noche con más servicios.',
    nota: 'Tránsito intenso en festivales y temporada alta.', destino: 'Villa General Belgrano'
  }
];

const TURISMO_CIRCUITOS = [
  { titulo: 'Medio día tranquilo', desc: 'Villa Yacanto centro + El Durazno + Capilla de El Durazno. Ideal para una primera salida, almuerzo o merienda y una caminata corta junto al río.' },
  { titulo: 'Día de ríos', desc: 'San Miguel de los Ríos por la mañana y Puente Blanco por la tarde. Llevar picnic, calzado para agua y una bolsa para regresar con todos los residuos.' },
  { titulo: 'Día de pueblos serranos', desc: 'Athos Pampa + Intiyaco + La Cumbrecita. Salir temprano: es un circuito largo y La Cumbrecita merece varias horas a pie.' },
  { titulo: 'Gran panorámica', desc: 'Camino a Cerro Linderos y, solo con condiciones adecuadas, aproximación al Champaquí. Consultar estado del camino el mismo día y evitar salida tardía.' },
  { titulo: 'Naturaleza con poca gente', desc: 'Río Grande + zona de Tigre Muerto, únicamente con acceso confirmado y navegación confiable. Mejor para adultos acostumbrados a caminos rurales y senderos.' }
];

const TURISMO_CHECKLIST = [
  'Agua, protector solar, gorra, repelente y abrigo liviano.',
  'Calzado con buena suela; para río, evitar ojotas en rocas mojadas.',
  'Descargar el mapa offline: en varios parajes hay señal limitada.',
  'No cruzar vados con agua alta y no permanecer en cauces si llueve en las sierras.',
  'Combustible suficiente y rueda de auxilio en buen estado.',
  'Consultar horarios, tarifas, reservas y políticas de mascotas directamente con cada camping o complejo.'
];

// ── Render ──────────────────────────────────────────────────
function renderTurismoCard(item) {
  const url = turismoMapsUrl(item.destino);
  return `
    <div class="turismo-card fade-in-el" data-categoria="${item.categoria}">
      <div class="turismo-card__top">
        <span class="turismo-card__tag">${item.tag}</span>
        <span class="turismo-card__level turismo-card__level--${item.nivel}">${LEVEL_LABELS[item.nivel]}</span>
      </div>
      <h3 class="turismo-card__name">${item.nombre}</h3>
      <span class="turismo-card__time">⏱ Desde El Sereno · ${item.tiempo}</span>
      <p class="turismo-card__desc">${item.desc}</p>
      <p class="turismo-card__note"><strong>A tener en cuenta:</strong> ${item.nota}</p>
      <a href="${url}" target="_blank" rel="noopener" class="turismo-card__link">Abrir ruta en Google Maps →</a>
    </div>`;
}

function renderTurismo() {
  const grid = document.getElementById('turismo-grid');
  const circuitosGrid = document.getElementById('circuitos-grid');
  const checklist = document.getElementById('checklist-list');
  if (!grid) return;

  grid.innerHTML = TURISMO_DATA.map(renderTurismoCard).join('');

  if (circuitosGrid) {
    circuitosGrid.innerHTML = TURISMO_CIRCUITOS.map(c => `
      <div class="circuito-card fade-in-el">
        <div class="circuito-card__title">${c.titulo}</div>
        <p class="circuito-card__desc">${c.desc}</p>
      </div>`).join('');
  }

  if (checklist) {
    checklist.innerHTML = TURISMO_CHECKLIST.map(c => `<li>${c}</li>`).join('');
  }

  initTurismoTabs();
  initTurismoAnimations();
}

function initTurismoTabs() {
  const tabs = document.querySelectorAll('.turismo-tab');
  const cards = document.querySelectorAll('.turismo-card');
  const empty = document.getElementById('turismo-empty');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filtro = tab.dataset.filtro;
      let visibles = 0;
      cards.forEach(card => {
        const match = filtro === 'todos' || card.dataset.categoria === filtro;
        card.classList.toggle('hidden', !match);
        if (match) visibles++;
      });
      if (empty) empty.style.display = visibles === 0 ? 'block' : 'none';
    });
  });
}

function initTurismoAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.turismo-section .fade-up, .fade-in-el').forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', renderTurismo);
