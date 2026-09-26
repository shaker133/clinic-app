/* ============================================================
   نظام المصادقة (Authentication)
   - تخزين بيانات المستخدم في localStorage (مشفّرة بشكل مبسّط)
   - إدارة الجلسة والانتهاء التلقائي
============================================================ */

const AUTH_KEYS = {
  USER: 'clinic_auth_user',
  SESSION: 'clinic_auth_session'
};

// مدة الجلسة بالدقائق (30 دقيقة)
const SESSION_DURATION_MINUTES = 30;

// المستخدم الافتراضي
const DEFAULT_USER = {
  username: 'admin',
  // ملاحظة: في الإنتاج استخدم hash حقيقي (bcrypt/Argon2)
  password: simpleHash('admin123'),
  createdAt: new Date().toISOString(),
  role: 'admin'
};

/* ============ تشفير بسيط (ليس آمناً للإنتاج) ============ */
function simpleHash(str) {
  // تحويل بسيط جداً للعرض فقط - في الإنتاج استخدم SHA-256/bcrypt
  let hash = 0;
  const salt = 'clinic_salt_2025_';
  const input = salt + str;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

/* ============ المستخدم ============ */
function getUser() {
  try {
    const u = localStorage.getItem(AUTH_KEYS.USER);
    if (u) return JSON.parse(u);
    // إنشاء المستخدم الافتراضي عند أول تشغيل
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(DEFAULT_USER));
    return DEFAULT_USER;
  } catch (e) {
    return DEFAULT_USER;
  }
}

function saveUser(user) {
  localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
}

/* ============ تسجيل الدخول ============ */
function login(username, password) {
  const user = getUser();

  if (!username || !password) {
    return { success: false, message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' };
  }

  if (username !== user.username) {
    return { success: false, message: 'اسم المستخدم غير صحيح' };
  }

  if (simpleHash(password) !== user.password) {
    return { success: false, message: 'كلمة المرور غير صحيحة' };
  }

  // إنشاء جلسة
  const session = {
    username: user.username,
    loginTime: Date.now(),
    expiresAt: Date.now() + (SESSION_DURATION_MINUTES * 60 * 1000),
    sessionId: 'sess_' + Math.random().toString(36).substr(2, 16)
  };
  localStorage.setItem(AUTH_KEYS.SESSION, JSON.stringify(session));

  return { success: true, message: 'تم تسجيل الدخول' };
}

/* ============ تسجيل الخروج ============ */
function logout() {
  localStorage.removeItem(AUTH_KEYS.SESSION);
  window.location.href = 'login.html';
}

/* ============ التحقق من الجلسة ============ */
function isLoggedIn() {
  try {
    const s = localStorage.getItem(AUTH_KEYS.SESSION);
    if (!s) return false;

    const session = JSON.parse(s);

    // التحقق من انتهاء الجلسة
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(AUTH_KEYS.SESSION);
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

/* ============ تمديد الجلسة عند النشاط ============ */
function refreshSession() {
  if (!isLoggedIn()) return;
  try {
    const s = JSON.parse(localStorage.getItem(AUTH_KEYS.SESSION));
    s.expiresAt = Date.now() + (SESSION_DURATION_MINUTES * 60 * 1000);
    localStorage.setItem(AUTH_KEYS.SESSION, JSON.stringify(s));
  } catch (e) {}
}

/* ============ حماية الصفحة ============ */
function requireAuth() {
  if (!isLoggedIn()) {
    // حفظ الصفحة المطلوبة للعودة إليها بعد الدخول
    sessionStorage.setItem('redirect_after_login', window.location.pathname);
    window.location.replace('login.html');
    return false;
  }
  return true;
}

/* ============ تغيير كلمة المرور ============ */
function changePassword(oldPass, newPass, confirmPass) {
  const user = getUser();

  if (simpleHash(oldPass) !== user.password) {
    return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
  }

  if (newPass.length < 6) {
    return { success: false, message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' };
  }

  if (newPass !== confirmPass) {
    return { success: false, message: 'كلمتا المرور غير متطابقتين' };
  }

  if (simpleHash(newPass) === user.password) {
    return { success: false, message: 'كلمة المرور الجديدة مطابقة للحالية' };
  }

  user.password = simpleHash(newPass);
  user.updatedAt = new Date().toISOString();
  saveUser(user);

  return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
}

/* ============ تغيير اسم المستخدم ============ */
function changeUsername(newUsername) {
  if (!newUsername || newUsername.length < 3) {
    return { success: false, message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' };
  }

  const user = getUser();
  user.username = newUsername;
  saveUser(user);

  // تحديث الجلسة
  try {
    const s = JSON.parse(localStorage.getItem(AUTH_KEYS.SESSION));
    s.username = newUsername;
    localStorage.setItem(AUTH_KEYS.SESSION, JSON.stringify(s));
  } catch (e) {}

  return { success: true, message: 'تم تغيير اسم المستخدم بنجاح' };
}

/* ============ معلومات المستخدم الحالي ============ */
function getCurrentUser() {
  if (!isLoggedIn()) return null;
  const user = getUser();
  const session = JSON.parse(localStorage.getItem(AUTH_KEYS.SESSION));
  return {
    username: user.username,
    loginTime: session.loginTime,
    expiresAt: session.expiresAt
  };
}

/* ============ إضافة تمديد تلقائي للجلسة عند النشاط ============ */
if (typeof window !== 'undefined') {
  ['click', 'keypress', 'scroll', 'mousemove'].forEach(evt => {
    window.addEventListener(evt, refreshSession, { passive: true });
  });
}