// ============================================================
// ADMIN.JS — Panel de administración (Firebase Compat)
// Solo se carga en admin.html, NO en index.html
// ============================================================

const Admin = (() => {

  async function init() {
    await loadDashboard();
    await loadBookingsTable();
  }

  // ── Dashboard stats ───────────────────────────────────────
  async function loadDashboard() {
    try {
      const [bookings, users] = await Promise.all([
        db.collection('bookings').get(),
        db.collection('users').get()
      ]);

      const allBookings = bookings.docs.map(d => ({ id: d.id, ...d.data() }));
      const pendientes  = allBookings.filter(b => b.estado === 'pendiente').length;
      const confirmadas = allBookings.filter(b => b.estado === 'confirmada').length;
      const ingresos    = allBookings
        .filter(b => b.estado === 'confirmada' && !b.esBloqueo)
        .reduce((s, b) => s + (b.precioTotal || 0), 0);

      setText('stat-active', confirmadas);
      const hoy=new Date();
      const esteMes=allBookings.filter(b=>{const f=b.fechaIngreso?.toDate?b.fechaIngreso.toDate():new Date(b.fechaIngreso);return f.getMonth()===hoy.getMonth()&&f.getFullYear()===hoy.getFullYear();}).length;
      setText('stat-month', esteMes);
      setText('stat-revenue', `$${ingresos.toLocaleString('es-AR')}`);
      setText('stat-total', allBookings.length);
    } catch (e) {
      console.error('Error cargando dashboard:', e);
    }
  }

  // ── Tabla de reservas ─────────────────────────────────────
  async function loadBookingsTable() {
    const tbody = document.getElementById('bookings-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem"><span class="loader-sm"></span></td></tr>';

    try {
      const bookings = await Bookings.getAllBookings();

      if (!bookings.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gray)">No hay reservas aún</td></tr>';
        return;
      }

      tbody.innerHTML = bookings.map(b => {
        const fi = b.fechaIngreso?.toDate ? b.fechaIngreso.toDate() : new Date(b.fechaIngreso);
        const fs = b.fechaSalida?.toDate  ? b.fechaSalida.toDate()  : new Date(b.fechaSalida);
        const estadoClass = { pendiente: 'warning', confirmada: 'success', cancelada: 'error' }[b.estado] || '';
        return `
          <tr>
            <td><code>#${b.id.slice(-6).toUpperCase()}</code></td>
            <td>${escHtml(b.userName || '—')}</td>
            <td>${escHtml(b.userEmail || '')}</td>
            <td>${formatDate(fi)}</td>
            <td>${formatDate(fs)}</td>
            <td>${b.cantidadPersonas || '—'}</td>
            <td>
              <span class="badge badge--${estadoClass}">${b.estado}</span>
              ${b.esBloqueo ? '' : `
                <div class="action-btns">
                  ${b.estado !== 'confirmada' ? `<button class="btn-sm btn-sm--success" onclick="Admin.updateStatus('${b.id}','confirmada')">✓</button>` : ''}
                  ${b.estado !== 'cancelada'  ? `<button class="btn-sm btn-sm--error"   onclick="Admin.updateStatus('${b.id}','cancelada')">✗</button>` : ''}
                  <button class="btn-sm btn-sm--danger" onclick="Admin.deleteB('${b.id}')">🗑</button>
                </div>
              `}
            </td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      console.error('Error cargando tabla de reservas:', e);
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--error)">Error al cargar reservas</td></tr>';
    }
  }

  // ── Acciones rápidas ──────────────────────────────────────
  async function updateStatus(id, estado) {
    await Bookings.updateBookingStatus(id, estado);
    await loadBookingsTable();
    await loadDashboard();
  }

  async function deleteB(id) {
    if (!confirm('¿Eliminar esta reserva?')) return;
    await Bookings.deleteBooking(id);
    await loadBookingsTable();
    await loadDashboard();
  }

  // ── Bloquear fechas ───────────────────────────────────────
  async function blockDatesAdmin() {
    const inicio = document.getElementById('block-start')?.value;
    const fin    = document.getElementById('block-end')?.value;
    const motivo = document.getElementById('block-reason')?.value?.trim() || 'Bloqueo manual';

    if (!inicio || !fin) { Toast.show('Seleccioná ambas fechas', 'warning'); return; }
    if (fin <= inicio)   { Toast.show('La fecha de fin debe ser posterior al inicio', 'warning'); return; }

    await Bookings.blockDates(inicio, fin, motivo);
    await loadBookingsTable();
    await loadDashboard();
  }

  // ── Configuración: precio y descripción ──────────────────
  async function loadCurrentPrice() {
    try {
      const snap = await db.collection('cabins').doc('cielito-lindo').get();
      if (!snap.exists) return;
      const data = snap.data();
      const priceEl = document.getElementById('admin-price-input');
      const descEl  = document.getElementById('admin-desc-input');
      if (priceEl && data.precio)      priceEl.value = data.precio;
      if (descEl  && data.descripcion) descEl.value  = data.descripcion;
    } catch (e) {
      console.error('Error cargando config de cabaña:', e);
    }
  }

  async function savePrice() {
    const price = parseInt(document.getElementById('admin-price-input')?.value);
    if (!price || price < 1000) { Toast.show('Ingresá un precio válido', 'warning'); return; }
    try {
      await db.collection('cabins').doc('cielito-lindo').set({ precio: price }, { merge: true });
      Toast.show('Precio actualizado', 'success');
    } catch (e) {
      Toast.show('Error al guardar precio', 'error');
    }
  }

  async function saveDescription() {
    const desc = document.getElementById('admin-desc-input')?.value?.trim();
    if (!desc) { Toast.show('Escribí una descripción', 'warning'); return; }
    try {
      await db.collection('cabins').doc('cielito-lindo').set({ descripcion: desc }, { merge: true });
      Toast.show('Descripción actualizada', 'success');
    } catch (e) {
      Toast.show('Error al guardar descripción', 'error');
    }
  }

  // ── Galería ───────────────────────────────────────────────
  async function loadGalleryAdmin() {
    try {
      const snap = await db.collection('cabins').doc('cielito-lindo').get();
      const imagenes = snap.exists ? (snap.data().imagenes || []) : [];
      const list = document.getElementById('gallery-admin-list');
      if (!list) return;
      list.innerHTML = imagenes.length
        ? imagenes.map((url, i) => `
            <div class="gallery-admin-item">
              <img src="${url}" style="width:80px;height:60px;object-fit:cover;border-radius:8px;">
              <span style="font-size:.8rem;word-break:break-all;">${url}</span>
              <button class="btn-sm btn-sm--danger" onclick="Admin.removeImage(${i})">✕</button>
            </div>`).join('')
        : '<p style="color:var(--gray)">No hay imágenes guardadas</p>';
    } catch (e) {
      console.error('Error cargando galería admin:', e);
    }
  }

  async function addImageUrl() {
    const input = document.getElementById('gallery-url-input');
    const url   = input?.value?.trim();
    if (!url || !url.startsWith('http')) { Toast.show('URL inválida', 'warning'); return; }
    try {
      const snap = await db.collection('cabins').doc('cielito-lindo').get();
      const imagenes = snap.exists ? (snap.data().imagenes || []) : [];
      imagenes.push(url);
      await db.collection('cabins').doc('cielito-lindo').set({ imagenes }, { merge: true });
      if (input) input.value = '';
      Toast.show('Imagen agregada', 'success');
      await loadGalleryAdmin();
    } catch (e) {
      Toast.show('Error al agregar imagen', 'error');
    }
  }

  async function removeImage(index) {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      const snap = await db.collection('cabins').doc('cielito-lindo').get();
      const imagenes = snap.exists ? (snap.data().imagenes || []) : [];
      imagenes.splice(index, 1);
      await db.collection('cabins').doc('cielito-lindo').set({ imagenes }, { merge: true });
      Toast.show('Imagen eliminada', 'success');
      await loadGalleryAdmin();
    } catch (e) {
      Toast.show('Error al eliminar imagen', 'error');
    }
  }

  // ── Calendario admin ──────────────────────────────────────
  async function loadCalendarAdmin() {
    await Calendar.init('admin-calendar', (start, end) => {
      const si = document.getElementById('block-start');
      const fi = document.getElementById('block-end');
      if (si) si.value = start;
      if (fi) fi.value = end;
      Toast.show(`Rango seleccionado: ${start} → ${end}`, 'info');
    });
  }

  // ── Helpers ───────────────────────────────────────────────
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function formatDate(date) {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return {
    init,
    loadDashboard,
    loadBookingsTable,
    updateStatus,
    deleteB,
    blockDatesAdmin,
    loadCurrentPrice,
    savePrice,
    saveDescription,
    loadGalleryAdmin,
    addImageUrl,
    removeImage,
    loadCalendarAdmin
  };
})();
