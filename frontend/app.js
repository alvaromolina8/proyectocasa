const dashboard = document.querySelector("#dashboard");
const toast = document.querySelector("#toast");
const navLinks = [...document.querySelectorAll("[data-view]")];

const state = {
  view: "home",
  theme: "light",
  devices: {
    "salon-luz": true,
    "cocina-luz": false,
    "dormitorio-luz": false,
    "salon-enchufe": true,
    "clima": true,
    "entrada-luz": false,
    "taller-luz": true,
  },
};

const icons = {
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>',
  bulb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6m-5 4h4m-2-20a7 7 0 0 0-4 12.75c.6.4 1 1.1 1 1.75h6c0-.65.4-1.35 1-1.75A7 7 0 0 0 12 2Z" /></svg>',
  camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h-4l-2 3H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-4l-2-3Z" /><circle cx="12" cy="14" r="3.5" /></svg>',
  bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 10-12h-7l1-8Z" /></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>',
  plug: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22v-5m-5-9V3m10 5V3M5 8h14v4a7 7 0 0 1-14 0V8Z" /></svg>',
  thermometer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 14.76V5a3 3 0 0 0-6 0v9.76a5 5 0 1 0 6 0Z" /><path d="M11 11v6" /></svg>',
  more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>',
};

const rooms = [
  { name: "Salón", subtitle: "Luz principal", device: "salon-luz", icon: "sun", color: "amber", temperature: "22°" },
  { name: "Cocina", subtitle: "Luz del techo", device: "cocina-luz", icon: "bulb", color: "violet", temperature: "20°" },
  { name: "Dormitorio", subtitle: "Lámpara de noche", device: "dormitorio-luz", icon: "bulb", color: "blue", temperature: "19°" },
  { name: "Entrada", subtitle: "Luz del recibidor", device: "entrada-luz", icon: "sun", color: "green", temperature: "21°" },
];

function deviceButton(device, label) {
  const isOn = state.devices[device];
  return `<button class="switch ${isOn ? "is-on" : ""}" type="button" data-action="toggle" data-device="${device}" aria-label="${label}: ${isOn ? "encendido" : "apagado"}" aria-pressed="${isOn}"><span></span></button>`;
}

function roomCard(room) {
  const isOn = state.devices[room.device];
  return `
    <article class="room-card">
      <div class="room-card-top">
        <span class="device-icon ${room.color}">${icons[room.icon]}</span>
        ${deviceButton(room.device, room.name)}
      </div>
      <div class="room-card-info">
        <div><h3>${room.name}</h3><p>${isOn ? "Encendida · " : "Apagada · "}${room.subtitle}</p></div>
        <span class="room-temp">${icons.thermometer}${room.temperature}</span>
      </div>
    </article>`;
}

function cameraCard(name, place, className) {
  return `
    <article class="camera-card ${className}">
      <div class="camera-image">
        <div class="camera-scene"><span class="scene-moon"></span><span class="scene-house"></span><span class="scene-ground"></span></div>
        <span class="camera-live"><span></span> EN DIRECTO</span>
        <button class="camera-expand" type="button" data-action="camera" aria-label="Ver cámara ${name}">${icons.arrow}</button>
        <span class="camera-time" data-clock></span>
      </div>
      <div class="camera-info"><div><h3>${name}</h3><p>${place}</p></div><span class="online-indicator"><span></span> En línea</span></div>
    </article>`;
}

function overviewView() {
  const enabledLights = Object.entries(state.devices).filter(([id, on]) => on && id.endsWith("-luz")).length;
  return `
    <div class="welcome-row">
      <div><div class="eyebrow"><span class="weather-sun">${icons.sun}</span> <span id="current-date"></span></div><h1>Tu casa, <span>a un vistazo.</span></h1><p class="welcome-subtitle">Todo tranquilo por aquí. ¿Qué te apetece hacer?</p></div>
      <button class="weather-card" type="button" data-action="weather"><span class="weather-icon">${icons.sun}</span><span><strong>22°</strong><small>Despejado</small></span><span class="weather-divider"></span><span class="weather-location">Madrid</span></button>
    </div>
    <div class="summary-grid">
      <article class="summary-card"><span class="summary-icon icon-green">${icons.bulb}</span><div><p>Luces encendidas</p><strong>${enabledLights}<small> / 4</small></strong></div><span class="summary-foot">En toda la casa</span></article>
      <article class="summary-card"><span class="summary-icon icon-blue">${icons.camera}</span><div><p>Cámaras activas</p><strong>2<small> / 2</small></strong></div><span class="summary-foot"><i class="tiny-dot"></i> Sin incidencias</span></article>
      <article class="summary-card"><span class="summary-icon icon-amber">${icons.bolt}</span><div><p>Consumo de hoy</p><strong>3,2<small> kWh</small></strong></div><span class="summary-foot">↓ 12% respecto a ayer</span></article>
      <article class="summary-card"><span class="summary-icon icon-violet">${icons.thermometer}</span><div><p>Temperatura media</p><strong>21,5<small> °C</small></strong></div><span class="summary-foot">Confortable en casa</span></article>
    </div>
    <div class="section-heading"><div><span class="section-kicker">CONTROL RÁPIDO</span><h2>Tus estancias</h2></div><button class="text-link" type="button" data-view="rooms">Ver todas ${icons.arrow}</button></div>
    <div class="rooms-grid">${rooms.slice(0, 3).map(roomCard).join("")}</div>
    <div class="lower-grid">
      <section class="panel cameras-panel"><div class="panel-heading"><div><span class="section-kicker">SEGURIDAD</span><h2>En directo</h2></div><button class="icon-button small-icon" type="button" data-view="security" aria-label="Ver todas las cámaras">${icons.arrow}</button></div><div class="camera-grid">${cameraCard("Entrada", "Puerta principal", "camera-entry")}${cameraCard("Taller", "Zona de trabajo", "camera-workshop")}</div></section>
      <section class="panel activity-panel"><div class="panel-heading"><div><span class="section-kicker">ÚLTIMA HORA</span><h2>Actividad reciente</h2></div><button class="icon-button small-icon" type="button" data-action="activity" aria-label="Más actividad">${icons.more}</button></div><div class="activity-list"><div class="activity-item"><span class="activity-mark mark-green">${icons.bulb}</span><div><strong>Luz del salón encendida</strong><p>Has activado la luz principal</p></div><time>Hace 12 min</time></div><div class="activity-item"><span class="activity-mark mark-blue">${icons.camera}</span><div><strong>Movimiento detectado</strong><p>Cámara de la entrada</p></div><time>Hace 38 min</time></div><div class="activity-item"><span class="activity-mark mark-amber">${icons.thermometer}</span><div><strong>Temperatura actualizada</strong><p>Salón · 22 °C</p></div><time>Hace 1 h</time></div></div><div class="privacy-note"><span>✳</span> Tus datos se quedan en este dispositivo</div></section>
    </div>
    <p class="prototype-footnote"><span class="demo-dot"></span> Prototipo de interfaz · los dispositivos y datos son simulados</p>`;
}

function roomsView() {
  const allRooms = [
    ...rooms,
    { name: "Taller", subtitle: "Luz de trabajo", device: "taller-luz", icon: "sun", color: "rose", temperature: "18°" },
  ];
  return `
    <div class="page-heading"><div><span class="section-kicker">TU HOGAR</span><h1>Estancias</h1><p>Controla la iluminación y consulta el estado de cada habitación.</p></div><span class="pill">${allRooms.length} estancias</span></div>
    <div class="rooms-page-grid">${allRooms.map(roomCard).join("")}</div>
    <section class="panel room-extras"><div class="panel-heading"><div><span class="section-kicker">OTROS DISPOSITIVOS</span><h2>Enchufes y clima</h2></div></div>
      <div class="extra-device"><span class="device-icon blue">${icons.plug}</span><div class="extra-device-copy"><strong>Enchufe del salón</strong><span>Televisión y consola</span></div>${deviceButton("salon-enchufe", "Enchufe del salón")}<span class="extra-value">${state.devices["salon-enchufe"] ? "Encendido" : "Apagado"}</span></div>
      <div class="extra-device"><span class="device-icon amber">${icons.thermometer}</span><div class="extra-device-copy"><strong>Climatización</strong><span>Modo automático · Salón</span></div>${deviceButton("clima", "Climatización")}<span class="extra-value">22 °C</span></div>
    </section>
    <p class="prototype-footnote"><span class="demo-dot"></span> Prototipo de interfaz · los dispositivos y datos son simulados</p>`;
}

function securityView() {
  return `
    <div class="page-heading"><div><span class="section-kicker">TODO BAJO CONTROL</span><h1>Seguridad</h1><p>Un vistazo a las cámaras de tu casa y a los últimos avisos.</p></div><span class="pill pill-green"><i class="tiny-dot"></i> Casa protegida</span></div>
    <div class="security-camera-grid">${cameraCard("Entrada", "Puerta principal · Exterior", "camera-entry")}${cameraCard("Taller", "Zona de trabajo · Interior", "camera-workshop")}</div>
    <section class="panel security-events"><div class="panel-heading"><div><span class="section-kicker">HOY</span><h2>Eventos recientes</h2></div><span class="pill">2 eventos</span></div>
      <div class="security-event"><span class="event-symbol mark-blue">${icons.camera}</span><div><strong>Movimiento detectado en la entrada</strong><p>La cámara exterior ha registrado actividad.</p></div><time>17:19</time><span class="event-tag">Revisar</span></div>
      <div class="security-event"><span class="event-symbol mark-green">${icons.camera}</span><div><strong>Taller conectado</strong><p>La cámara está funcionando correctamente.</p></div><time>16:42</time><span class="event-tag tag-ok">Normal</span></div>
    </section>
    <p class="prototype-footnote"><span class="demo-dot"></span> Prototipo de interfaz · las cámaras son ilustraciones, no vídeo real</p>`;
}

function energyView() {
  const bars = [35, 48, 30, 66, 42, 74, 49, 61, 38, 86, 55, 68, 44, 94, 57, 72, 47, 63, 36, 78, 51, 70, 42, 59];
  return `
    <div class="page-heading"><div><span class="section-kicker">CONSUMO DEL HOGAR</span><h1>Energía</h1><p>Una estimación de cómo se reparte el consumo en casa.</p></div><span class="pill">Hoy · 18 oct</span></div>
    <div class="energy-summary"><article class="energy-total panel"><span class="summary-icon icon-amber">${icons.bolt}</span><p>Consumo total de hoy</p><strong>3,2 <small>kWh</small></strong><span class="energy-change">↓ 12% menos que ayer</span><div class="chart-bars">${bars.map((height, i) => `<span class="${i > 19 ? "bar-later" : ""}" style="--bar-height:${height}%"></span>`).join("")}</div><div class="chart-labels"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>Ahora</span></div></article>
      <article class="energy-tip panel"><span class="tip-icon">${icons.sun}</span><span class="section-kicker">PEQUEÑO CONSEJO</span><h2>Vas por buen camino</h2><p>Hoy estás consumiendo menos que ayer a esta hora. Apaga los dispositivos que no estés utilizando para seguir ahorrando.</p><span class="tip-footer">Datos de demostración · sin contador conectado</span></article></div>
    <section class="panel energy-breakdown"><div class="panel-heading"><div><span class="section-kicker">ESTIMACIÓN</span><h2>Consumo por estancia</h2></div></div>
      <div class="energy-row"><span class="energy-room-icon amber">${icons.sun}</span><strong>Salón</strong><div class="energy-track"><span style="width:72%"></span></div><span class="energy-number">1,4 kWh</span></div>
      <div class="energy-row"><span class="energy-room-icon violet">${icons.bulb}</span><strong>Cocina</strong><div class="energy-track"><span style="width:48%"></span></div><span class="energy-number">0,9 kWh</span></div>
      <div class="energy-row"><span class="energy-room-icon blue">${icons.bulb}</span><strong>Dormitorio</strong><div class="energy-track"><span style="width:28%"></span></div><span class="energy-number">0,5 kWh</span></div>
      <div class="energy-row"><span class="energy-room-icon green">${icons.plug}</span><strong>Otros</strong><div class="energy-track"><span style="width:19%"></span></div><span class="energy-number">0,4 kWh</span></div>
    </section>
    <p class="prototype-footnote"><span class="demo-dot"></span> Prototipo de interfaz · consumo estimado y simulado</p>`;
}

const views = {
  home: { title: "Resumen", render: overviewView },
  rooms: { title: "Estancias", render: roomsView },
  security: { title: "Seguridad", render: securityView },
  energy: { title: "Energía", render: energyView },
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function render() {
  const page = views[state.view];
  dashboard.innerHTML = page.render();
  document.querySelector("#breadcrumb-current").textContent = page.title;
  navLinks.forEach((link) => {
    const isActive = link.dataset.view === state.view;
    link.classList.toggle("is-active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  dashboard.querySelectorAll("[data-clock]").forEach((clock) => {
    clock.textContent = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  });
  const currentDate = dashboard.querySelector("#current-date");
  if (currentDate) {
    currentDate.textContent = new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date()).toLocaleUpperCase("es-ES");
  }
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.view && views[button.dataset.view]) {
    state.view = button.dataset.view;
    render();
    return;
  }

  switch (button.dataset.action) {
    case "toggle": {
      const device = button.dataset.device;
      state.devices[device] = !state.devices[device];
      render();
      showToast(`${button.getAttribute("aria-label").split(":")[0]} ${state.devices[device] ? "encendido" : "apagado"} (simulación)`);
      break;
    }
    case "theme":
      state.theme = state.theme === "light" ? "dark" : "light";
      document.body.classList.toggle("dark-theme", state.theme === "dark");
      button.setAttribute("aria-label", state.theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
      break;
    case "notifications":
      showToast("No hay notificaciones nuevas.");
      break;
    case "camera":
      showToast("La cámara se mostrará aquí cuando conectemos Frigate.");
      break;
    case "weather":
      showToast("El tiempo aparecerá aquí cuando conectemos Home Assistant.");
      break;
    case "activity":
      showToast("El historial completo estará disponible al conectar Home Assistant.");
      break;
    default:
      break;
  }
});

render();
