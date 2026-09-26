import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

# تأكد من وجود مجلد البيانات
os.makedirs(DATA_DIR, exist_ok=True)

class Config:
    # ===== قاعدة البيانات SQLite =====
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(DATA_DIR, 'clinic.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "connect_args": {"check_same_thread": False}
    }

    # ===== JWT =====
    JWT_SECRET_KEY = os.environ.get(
        'JWT_SECRET_KEY',
        'ClinicSecretKey_2025_SuperSecure_ChangeInProduction_12345678'
    )
    JWT_ACCESS_TOKEN_EXPIRES = 30 * 60  # 30 دقيقة بالثواني

    # ===== إعدادات العيادة =====
    CLINIC_START_HOUR = 10
    CLINIC_END_HOUR = 24

    # ===== إعدادات افتراضية =====
    DEFAULT_DOCTOR_COUNT = 3
    DEFAULT_SESSION_DURATION = 30

    # ===== مستخدم افتراضي =====
    DEFAULT_ADMIN_USERNAME = 'admin'
    DEFAULT_ADMIN_PASSWORD = 'admin123'