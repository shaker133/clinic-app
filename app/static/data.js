/* ============================================================
   طبقة البيانات المشتركة بين جميع الصفحات
   تستخدم localStorage لمحاكاة قاعدة البيانات
============================================================ */

const STORAGE_KEYS = {
  SETTINGS: 'clinic_settings',
  APPOINTMENTS: 'clinic_appointments'
};

// الفترة الثابتة: من 10 صباحاً حتى 12 منتصف الليل
const START_HOUR = 10;
const END_HOUR = 24; // 24 = 12 منتصف الليل

/* ============ الإعدادات ============ */
function getDefaultSettings() {
  return {
    doctorCount: 3,
    sessionDuration: 30,
    startHour: START_HOUR,
    endHour: END_HOUR
  };
}

function getSettings() {
  try {
    const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return s ? JSON.parse(s) : getDefaultSettings();
  } catch (e) {
    return getDefaultSettings();
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

/* ============ المواعيد ============ */
function getAppointments() {
  try {
    const a = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return a ? JSON.parse(a) : [];
  } catch (e) {
    return [];
  }
}

function saveAppointments(list) {
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(list));
}

/* ============ التاريخ ============ */
// تاريخ الغد بصيغة YYYY-MM-DD
function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// تنسيق التاريخ بالعربية
function formatArabicDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  return `${days[date.getDay()]} ${d} ${months[m-1]} ${y}`;
}

// تنسيق الوقت بالعربية
function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const period = h < 12 ? 'ص' : 'م';
  const hour12 = h === 0 ? 12 : (h > 12 ? h - 12 : h);
  return `${hour12}:${String(m).padStart(2,'0')} ${period}`;
}

/* ============ توليد الفترات ============ */
// توليد جميع الفترات الزمنية بناءً على مدة الجلسة
function generateAllSlots() {
  const settings = getSettings();
  const slots = [];
  const step = settings.sessionDuration;

  for (let h = settings.startHour; h < settings.endHour; h++) {
    for (let m = 0; m < 60; m += step) {
      const hour = String(h).padStart(2, '0');
      const min = String(m).padStart(2, '0');
      slots.push(`${hour}:${min}`);
    }
  }
  return slots;
}

// حساب الأوقات المتاحة مع عدد الحجوزات
function getAvailableSlots() {
  const settings = getSettings();
  const tomorrow = getTomorrowDate();
  const allSlots = generateAllSlots();
  const appointments = getAppointments().filter(
    a => a.date === tomorrow && a.status === 'active'
  );

  const counts = {};
  appointments.forEach(a => {
    counts[a.time] = (counts[a.time] || 0) + 1;
  });

  return allSlots.map(time => {
    const booked = counts[time] || 0;
    return {
      time,
      booked,
      capacity: settings.doctorCount,
      available: booked < settings.doctorCount
    };
  });
}

// اختيار أول طبيب متاح في فترة معينة
function pickDoctorForSlot(time, date, appointments) {
  const settings = getSettings();
  const inSlot = appointments.filter(
    a => a.date === date && a.time === time && a.status === 'active'
  );
  const usedDoctors = new Set(inSlot.map(a => a.doctorId));

  for (let i = 1; i <= settings.doctorCount; i++) {
    if (!usedDoctors.has(i)) return i;
  }
  return null;
}