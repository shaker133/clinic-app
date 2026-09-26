/* ============================================================
   منطق صفحة الحجز (index.html)
============================================================ */

let selectedSlot = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('timeSlots')) return;

  const tomorrow = getTomorrowDate();
  document.getElementById('appointmentDate').textContent = formatArabicDate(tomorrow);

  renderTimeSlots();
  document.getElementById('bookBtn').addEventListener('click', handleBooking);
});

function renderTimeSlots() {
  const container = document.getElementById('timeSlots');
  const slots = getAvailableSlots();
  container.innerHTML = '';

  if (slots.length === 0) {
    container.innerHTML = '<div class="loading">لا توجد فترات متاحة</div>';
    return;
  }

  slots.forEach(slot => {
    const div = document.createElement('div');
    div.className = 'slot' + (slot.available ? '' : ' disabled');
    div.textContent = formatTime(slot.time);

    if (slot.available) {
      div.addEventListener('click', () => selectSlot(div, slot.time));
    } else {
      div.title = 'هذه الفترة ممتلئة';
    }
    container.appendChild(div);
  });
}

function selectSlot(el, time) {
  document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  selectedSlot = time;
  document.getElementById('bookBtn').disabled = false;
}

function handleBooking() {
  const name = document.getElementById('patientName').value.trim();
  const phone = document.getElementById('patientPhone').value.trim();
  const msgEl = document.getElementById('message');

  // التحقق من المدخلات
  if (!name) {
    showMessage(msgEl, '⚠️ الرجاء إدخال اسم المريض', 'error');
    return;
  }
  if (!phone) {
    showMessage(msgEl, '⚠️ الرجاء إدخال رقم الهاتف', 'error');
    return;
  }
  if (!/^[0-9+\-\s]{7,15}$/.test(phone)) {
    showMessage(msgEl, '⚠️ رقم الهاتف غير صحيح', 'error');
    return;
  }
  if (!selectedSlot) {
    showMessage(msgEl, '⚠️ الرجاء اختيار وقت متاح', 'error');
    return;
  }

  const date = getTomorrowDate();
  let appointments = getAppointments();
  const settings = getSettings();

  // التحقق مرة أخرى من توفر الفترة
  const inSlot = appointments.filter(
    a => a.date === date && a.time === selectedSlot && a.status === 'active'
  );

  if (inSlot.length >= settings.doctorCount) {
    showMessage(msgEl, '❌ عذراً، هذه الفترة امتلأت للتو. اختر وقتاً آخر.', 'error');
    renderTimeSlots();
    return;
  }

  const doctorId = pickDoctorForSlot(selectedSlot, date, appointments);

  const newAppt = {
    id: Date.now(),
    patientName: name,
    patientPhone: phone,
    date,
    time: selectedSlot,
    doctorId,
    doctorName: `طبيب ${doctorId}`,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  appointments.push(newAppt);
  saveAppointments(appointments);

  showMessage(
    msgEl,
    `✅ تم الحجز بنجاح! موعدك ${formatArabicDate(date)} الساعة ${formatTime(selectedSlot)} مع ${newAppt.doctorName}`,
    'success'
  );

  // إعادة التعيين
  document.getElementById('patientName').value = '';
  document.getElementById('patientPhone').value = '';
  selectedSlot = null;
  document.getElementById('bookBtn').disabled = true;
  renderTimeSlots();
}

function showMessage(el, text, type) {
  el.textContent = text;
  el.className = 'message ' + type;
  setTimeout(() => {
    if (el.classList.contains('success')) {
      el.className = 'message';
    }
  }, 6000);
}