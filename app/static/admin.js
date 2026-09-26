/* ============================================================
   منطق لوحة التحكم (admin.html)
============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('doctorCount')) return;

  // عرض اسم المستخدم
  const user = getCurrentUser();
  if (user) {
    const el = document.getElementById('welcomeUser');
    if (el) el.textContent = user.username;
  }

  // عرض عدّاد الجلسة
  startSessionTimer();

  const settings = getSettings();
  document.getElementById('doctorCount').value = settings.doctorCount;
  document.getElementById('sessionDuration').value = settings.sessionDuration;

  updateStats();

  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettingsHandler);
  document.getElementById('clearAllBtn').addEventListener('click', clearAllHandler);
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

function saveSettingsHandler() {
  const doctorCount = parseInt(document.getElementById('doctorCount').value);
  const sessionDuration = parseInt(document.getElementById('sessionDuration').value);
  const msgEl = document.getElementById('adminMessage');

  if (isNaN(doctorCount) || doctorCount < 1 || doctorCount > 20) {
    showAdminMessage(msgEl, '⚠️ عدد الأطباء يجب أن يكون بين 1 و 20', 'error');
    return;
  }
  if (isNaN(sessionDuration) || sessionDuration < 15 || sessionDuration > 120) {
    showAdminMessage(msgEl, '⚠️ مدة الجلسة يجب أن تكون بين 15 و 120 دقيقة', 'error');
    return;
  }
  if (60 % sessionDuration !== 0) {
    showAdminMessage(msgEl, '⚠️ مدة الجلسة يجب أن تقسم 60 بدون باقي (15، 20، 30، 60)', 'error');
    return;
  }

  saveSettings({
    doctorCount,
    sessionDuration,
    startHour: START_HOUR,
    endHour: END_HOUR
  });

  showAdminMessage(msgEl, '✅ تم حفظ الإعدادات بنجاح', 'success');
  updateStats();
}

function updateStats() {
  const settings = getSettings();
  const slots = getAvailableSlots();
  const booked = slots.reduce((sum, s) => sum + s.booked, 0);
  const available = slots.filter(s => s.available).length;

  document.getElementById('statDoctors').textContent = settings.doctorCount;
  document.getElementById('statSlots').textContent = slots.length;
  document.getElementById('statBooked').textContent = booked;
  document.getElementById('statAvailable').textContent = available;
}

function clearAllHandler() {
  if (!confirm('⚠️ هل أنت متأكد من حذف جميع المواعيد؟ لا يمكن التراجع.')) return;

  saveAppointments([]);
  const msgEl = document.getElementById('clearMessage');
  showAdminMessage(msgEl, '✅ تم حذف جميع المواعيد', 'success');
  updateStats();
}

function showAdminMessage(el, text, type) {
  el.textContent = text;
  el.className = 'message ' + type;
  setTimeout(() => {
    if (el.classList.contains('success')) el.className = 'message';
  }, 5000);
}