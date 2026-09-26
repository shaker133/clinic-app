/* ============================================================
   منطق عرض المواعيد (appointments.html)
============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('appointmentsBody')) return;

  // عرض اسم المستخدم
  const user = getCurrentUser();
  if (user) {
    const el = document.getElementById('welcomeUser');
    if (el) el.textContent = user.username;
  }

  startSessionTimer();
  renderAppointments();
});

function startSessionTimer() {
  const el = document.getElementById('sessionTimer');
  if (!el) return;

  setInterval(() => {
    if (!isLoggedIn()) {
      logout();
      return;
    }
    try {
      const s = JSON.parse(localStorage.getItem('clinic_auth_session'));
      const remaining = Math.max(0, Math.floor((s.expiresAt - Date.now()) / 1000));
      const m = String(Math.floor(remaining / 60)).padStart(2, '0');
      const sec = String(remaining % 60).padStart(2, '0');
      el.textContent = `⏱️ الجلسة: ${m}:${sec}`;
      if (remaining === 0) logout();
    } catch (e) {}
  }, 1000);
}

function renderAppointments() {
  const tbody = document.getElementById('appointmentsBody');
  const appointments = getAppointments().sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">لا توجد مواعيد بعد.</td></tr>';
    return;
  }

  tbody.innerHTML = appointments.map((a, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escapeHtml(a.patientName)}</strong></td>
      <td>${escapeHtml(a.patientPhone)}</td>
      <td>${formatArabicDate(a.date)}</td>
      <td>${formatTime(a.time)}</td>
      <td>${escapeHtml(a.doctorName)}</td>
      <td>
        <span class="status-badge ${a.status === 'active' ? 'status-active' : 'status-cancelled'}">
          ${a.status === 'active' ? 'نشط' : 'ملغي'}
        </span>
      </td>
      <td>
        ${a.status === 'active'
          ? `<button class="btn-danger" onclick="cancelAppointment(${a.id})">إلغاء</button>`
          : '—'}
      </td>
    </tr>
  `).join('');
}

function cancelAppointment(id) {
  if (!confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) return;
  const appointments = getAppointments();
  const idx = appointments.findIndex(a => a.id === id);
  if (idx !== -1) {
    appointments[idx].status = 'cancelled';
    saveAppointments(appointments);
    renderAppointments();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}