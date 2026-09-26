import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .models import db, User, Settings
import bcrypt

jwt = JWTManager()


def create_app(config_class='config.Config'):
    app = Flask(__name__,
                static_folder='static',
                static_url_path='')
    app.config.from_object(config_class)

    # ===== تهيئة الملحقات =====
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r'/api/*': {'origins': '*'}})

    # ===== تسجيل Blueprints =====
    from .auth import auth_bp
    from .settings_routes import settings_bp
    from .slots_routes import slots_bp
    from .appointments_routes import appointments_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(slots_bp)
    app.register_blueprint(appointments_bp)

    # ===== الصفحة الرئيسية =====
    @app.route('/')
    def index():
        return send_from_directory(app.static_folder, 'index.html')

    # ===== معالجة الأخطاء =====
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'message': 'انتهت الجلسة، الرجاء تسجيل الدخول مجدداً'}, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'message': 'جلسة غير صالحة'}, 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {'message': 'الرجاء تسجيل الدخول'}, 401

    # ===== إنشاء قاعدة البيانات + البيانات الافتراضية =====
    with app.app_context():
        db.create_all()
        seed_data(app)

    return app


def seed_data(app):
    """إنشاء المستخدم والإعدادات الافتراضية إذا لم تكن موجودة"""
    # مستخدم افتراضي
    if not User.query.first():
        default_user = User(
            username=app.config['DEFAULT_ADMIN_USERNAME'],
            password_hash=bcrypt.hashpw(
                app.config['DEFAULT_ADMIN_PASSWORD'].encode(),
                bcrypt.gensalt()
            ).decode(),
            role='admin'
        )
        db.session.add(default_user)
        app.logger.info('✅ تم إنشاء المستخدم الافتراضي: admin / admin123')

    # إعدادات افتراضية
    if not Settings.query.first():
        default_settings = Settings(
            doctor_count=app.config['DEFAULT_DOCTOR_COUNT'],
            session_duration=app.config['DEFAULT_SESSION_DURATION'],
            start_hour=app.config['CLINIC_START_HOUR'],
            end_hour=app.config['CLINIC_END_HOUR']
        )
        db.session.add(default_settings)
        app.logger.info('✅ تم إنشاء الإعدادات الافتراضية')

    db.session.commit()