from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from .models import db, Settings
from .auth import admin_required

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')


def get_settings():
    """الحصول على الإعدادات أو إنشاؤها"""
    s = Settings.query.order_by(Settings.id.desc()).first()
    if not s:
        s = Settings(
            doctor_count=3,
            session_duration=30,
            start_hour=10,
            end_hour=24
        )
        db.session.add(s)
        db.session.commit()
    return s


@settings_bp.route('', methods=['GET'])
def get_settings_route():
    s = get_settings()
    return jsonify(s.to_dict()), 200


@settings_bp.route('', methods=['POST'])
@admin_required
def update_settings():
    data = request.get_json() or {}
    doctor_count = data.get('doctorCount')
    session_duration = data.get('sessionDuration')

    try:
        doctor_count = int(doctor_count)
        session_duration = int(session_duration)
    except (TypeError, ValueError):
        return jsonify({'message': 'قيم غير صحيحة'}), 400

    if doctor_count < 1 or doctor_count > 20:
        return jsonify({'message': 'عدد الأطباء يجب أن يكون بين 1 و 20'}), 400

    if session_duration < 15 or session_duration > 120:
        return jsonify({'message': 'مدة الجلسة يجب أن تكون بين 15 و 120 دقيقة'}), 400

    if 60 % session_duration != 0:
        return jsonify({'message': 'مدة الجلسة يجب أن تقسم 60 بدون باقي'}), 400

    s = get_settings()
    s.doctor_count = doctor_count
    s.session_duration = session_duration
    s.updated_at = datetime.now()
    db.session.commit()

    return jsonify({'message': 'تم حفظ الإعدادات'}), 200