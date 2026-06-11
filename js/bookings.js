// ============================================================
// BOOKINGS.JS — Firebase Compat
// ============================================================

const Bookings = (() => {

  // Obtener reservas activas
  async function getActiveBookings() {
    try {
      // Timeout de 8 segundos para no quedar colgado si hay problemas de red
      const snap = await Promise.race([
        db.collection('bookings')
          .where('estado', 'in', ['confirmada', 'pendiente'])
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 8000)
        )
      ]);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('Error obteniendo reservas activas:', e.message);
      return []; // Continuar sin fechas bloqueadas si hay problema de red
    }
  }

  // Fechas bloqueadas
  async function getBlockedDates() {
    const bookings = await getActiveBookings();
    const blocked = [];
    bookings.forEach(b => {
      const start = b.fechaIngreso?.toDate ? b.fechaIngreso.toDate() : new Date(b.fechaIngreso);
      const end   = b.fechaSalida?.toDate  ? b.fechaSalida.toDate()  : new Date(b.fechaSalida);
      const current = new Date(start);
      while (current < end) {
        blocked.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    });
    return blocked;
  }

  // Verificar disponibilidad
  async function isAvailable(checkIn, checkOut) {
    const blocked = await getBlockedDates();
    const current = new Date(checkIn);
    const end = new Date(checkOut);
    while (current < end) {
      if (blocked.includes(current.toISOString().split('T')[0])) return false;
      current.setDate(current.getDate() + 1);
    }
    return true;
  }

  // Calcular precio
  async function calculatePrice(checkIn, checkOut, personas = 2) {
    const precios = { 2: 100000, 3: 150000, 4: 200000, 5: 250000, 6: 300000 };
    const precioNoche = precios[personas] || 100000;
    const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    return { total: nights * precioNoche, noches: nights, precioPorNoche: precioNoche };
  }

  // FIX #3: Crear reserva con mejor manejo de errores y logging
  async function createBooking({ userId, userName, userEmail, telefono, fechaIngreso, fechaSalida, cantidadPersonas, precioTotal, notas }) {
    console.log('Iniciando createBooking...', { userId, fechaIngreso, fechaSalida });

    // Verificar que el usuario esté autenticado
    if (!userId) {
      Toast.show('Debés iniciar sesión para reservar', 'error');
      return { ok: false };
    }

    try {
      const available = await isAvailable(fechaIngreso, fechaSalida);
      if (!available) {
        Toast.show('Las fechas seleccionadas ya están reservadas', 'error');
        return { ok: false };
      }

      const bookingData = {
        userId,
        userName,
        userEmail,
        telefono: telefono || '',
        fechaIngreso: firebase.firestore.Timestamp.fromDate(new Date(fechaIngreso)),
        fechaSalida:  firebase.firestore.Timestamp.fromDate(new Date(fechaSalida)),
        cantidadPersonas: parseInt(cantidadPersonas),
        precioTotal,
        notas: notas || '',
        estado: 'pendiente',
        creadoEn: firebase.firestore.FieldValue.serverTimestamp(),
        cabinId: 'cielito-lindo'
      };

      console.log('Guardando en Firestore:', bookingData);
      // Timeout de 15 segundos para el guardado
      const ref = await Promise.race([
        db.collection('bookings').add(bookingData),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout-saving')), 15000)
        )
      ]);
      console.log('Reserva creada con ID:', ref.id);

      Toast.show('¡Reserva solicitada con éxito!', 'success');
      return { ok: true, id: ref.id };
    } catch (e) {
      console.error('Error detallado al crear reserva:', e);
      // Mensajes de error específicos para diagnóstico
      if (e.code === 'permission-denied') {
        Toast.show('Error de permisos. Revisá las reglas de Firestore.', 'error');
      } else if (e.code === 'unavailable' || e.message === 'timeout-saving') {
        Toast.show('Sin conexión con Firebase. Verificá tu internet e intentá de nuevo.', 'error');
      } else if (e.message === 'timeout') {
        Toast.show('Tiempo de espera agotado. Intentá de nuevo.', 'error');
      } else {
        Toast.show('Error al crear la reserva: ' + (e.message || e.code), 'error');
      }
      return { ok: false, error: e };
    }
  }

  // FIX #3: getUserBookings — eliminado orderBy para evitar requerir índice compuesto
  // Si necesitás orderBy, creá el índice en Firebase Console:
  // Firestore > Índices > Crear índice > Colección: bookings, campos: userId ASC, creadoEn DESC
  async function getUserBookings(userId) {
    try {
      const snap = await db.collection('bookings')
        .where('userId', '==', userId)
        .get();
      // Ordenamos en el cliente para evitar necesitar índice compuesto
      const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return bookings.sort((a, b) => {
        const dateA = a.creadoEn?.toDate ? a.creadoEn.toDate() : new Date(0);
        const dateB = b.creadoEn?.toDate ? b.creadoEn.toDate() : new Date(0);
        return dateB - dateA; // más reciente primero
      });
    } catch (e) {
      console.error('Error obteniendo reservas del usuario:', e);
      return [];
    }
  }

  // Admin: todas las reservas (sin orderBy para evitar índice)
  async function getAllBookings() {
    try {
      const snap = await db.collection('bookings').get();
      const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return bookings.sort((a, b) => {
        const dateA = a.creadoEn?.toDate ? a.creadoEn.toDate() : new Date(0);
        const dateB = b.creadoEn?.toDate ? b.creadoEn.toDate() : new Date(0);
        return dateB - dateA;
      });
    } catch (e) {
      console.error('Error obteniendo todas las reservas:', e);
      return [];
    }
  }

  // Admin: actualizar estado
  async function updateBookingStatus(bookingId, estado) {
    try {
      await db.collection('bookings').doc(bookingId).update({ estado });
      Toast.show(`Reserva ${estado}`, 'success');
    } catch (e) {
      console.error('Error actualizando estado:', e);
      Toast.show('Error al actualizar la reserva', 'error');
    }
  }

  // Admin: eliminar
  async function deleteBooking(bookingId) {
    try {
      await db.collection('bookings').doc(bookingId).delete();
      Toast.show('Reserva eliminada', 'info');
    } catch (e) {
      console.error('Error eliminando reserva:', e);
      Toast.show('Error al eliminar la reserva', 'error');
    }
  }

  // Admin: bloquear fechas
  async function blockDates(fechaInicio, fechaFin, motivo) {
    try {
      await db.collection('bookings').add({
        userId: 'admin-block',
        userName: 'Bloqueado',
        userEmail: '',
        telefono: '',
        fechaIngreso: firebase.firestore.Timestamp.fromDate(new Date(fechaInicio)),
        fechaSalida:  firebase.firestore.Timestamp.fromDate(new Date(fechaFin)),
        cantidadPersonas: 0,
        precioTotal: 0,
        notas: motivo || 'Bloqueo manual',
        estado: 'confirmada',
        esBloqueo: true,
        creadoEn: firebase.firestore.FieldValue.serverTimestamp(),
        cabinId: 'cielito-lindo'
      });
      Toast.show('Fechas bloqueadas', 'success');
    } catch (e) {
      console.error('Error bloqueando fechas:', e);
      Toast.show('Error al bloquear fechas', 'error');
    }
  }

  return { getBlockedDates, isAvailable, calculatePrice, createBooking, getUserBookings, getAllBookings, updateBookingStatus, deleteBooking, blockDates };
})();

// ============================================================
// CALENDAR.JS — Calendario interactivo (sin Firebase directo)
// ============================================================

const Calendar = (() => {
  let blockedDates = [];
  let selectedStart = null;
  let selectedEnd = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let onSelectCallback = null;
  let container = null;

  async function init(containerId, onSelect) {
    container = document.getElementById(containerId);
    if (!container) return;
    onSelectCallback = onSelect;
    blockedDates = await Bookings.getBlockedDates();
    render();
  }

  function render() {
    if (!container) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay  = new Date(currentYear, currentMonth + 1, 0);
    const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const dayNames   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

    let html = `
      <div class="calendar">
        <div class="calendar__header">
          <button class="cal-nav" id="cal-prev" aria-label="Mes anterior">&#8592;</button>
          <span class="calendar__title">${monthNames[currentMonth]} ${currentYear}</span>
          <button class="cal-nav" id="cal-next" aria-label="Mes siguiente">&#8594;</button>
        </div>
        <div class="calendar__days-header">
          ${dayNames.map(d => `<span>${d}</span>`).join('')}
        </div>
        <div class="calendar__grid">
    `;

    for (let i = 0; i < firstDay.getDay(); i++) {
      html += `<span class="cal-day cal-day--empty"></span>`;
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date    = new Date(currentYear, currentMonth, d);
      const dateStr = date.toISOString().split('T')[0];
      const isPast  = date < today;
      const isBlocked  = blockedDates.includes(dateStr);
      const isStart    = selectedStart && dateStr === selectedStart;
      const isEnd      = selectedEnd   && dateStr === selectedEnd;
      const isInRange  = selectedStart && selectedEnd && dateStr > selectedStart && dateStr < selectedEnd;

      let classes = 'cal-day';
      if (isPast)    classes += ' cal-day--past';
      if (isBlocked) classes += ' cal-day--blocked';
      if (isStart)   classes += ' cal-day--start';
      if (isEnd)     classes += ' cal-day--end';
      if (isInRange) classes += ' cal-day--in-range';
      const disabled = isPast || isBlocked;

      html += `<button class="${classes}" data-date="${dateStr}" ${disabled ? 'disabled' : ''}>${d}</button>`;
    }

    html += `</div></div>`;
    container.innerHTML = html;

    document.getElementById('cal-prev')?.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      render();
    });
    document.getElementById('cal-next')?.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      render();
    });
    container.querySelectorAll('.cal-day:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => handleDayClick(btn.dataset.date));
    });
  }

  function handleDayClick(dateStr) {
    if (!selectedStart || (selectedStart && selectedEnd)) {
      selectedStart = dateStr;
      selectedEnd   = null;
    } else {
      if (dateStr <= selectedStart) {
        selectedStart = dateStr;
        selectedEnd   = null;
      } else {
        const current = new Date(selectedStart);
        current.setDate(current.getDate() + 1);
        const end = new Date(dateStr);
        let conflict = false;
        while (current < end) {
          if (blockedDates.includes(current.toISOString().split('T')[0])) { conflict = true; break; }
          current.setDate(current.getDate() + 1);
        }
        if (conflict) {
          Toast.show('Hay fechas bloqueadas en ese rango', 'warning');
          selectedStart = dateStr;
          selectedEnd   = null;
        } else {
          selectedEnd = dateStr;
          onSelectCallback && onSelectCallback(selectedStart, selectedEnd);
        }
      }
    }
    render();
  }

  function reset() {
    selectedStart = null;
    selectedEnd   = null;
    render();
  }

  return { init, reset, getSelected: () => ({ start: selectedStart, end: selectedEnd }) };
})();
