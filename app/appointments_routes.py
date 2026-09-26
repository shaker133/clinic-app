from flask import Blueprint, request, jsonify
from .models import db, Appointment
from .utils import get_tomorrow
from .settings_routes import get_settings
from .auth import admin_required

appointments_bp = Blueprint('appointments', __name__, url_prefix='/api/appointments')


@appointments_bp.route('/book', methods=['POST'])
def book():
    data = request.get_json() or {}
    patient_name = (data.get('patientName') or '').strip()
    patient_phone = (data.get('patientPhone') or '').strip()
    time_str = (data.get('time') or '').strip()

    if not patient_name:
        return jsonify({'message': 'الرجاء إدخال اسم المريض'}), 400

    if not patient_phone:
        return jsonify({'message': 'الرجاء إدخال رقم الهاتف'}), 400

    if not time_str:
        return jsonify({'message': 'الرجاء اختيار وقت'}), 400

    s = get_settings()
    tomorrow = get_tomorrow()

    # ⚠️ استخدام transaction لضمان عدم التزامن
    try:
        # BEGIN IMMEDIATE يمنع الكتابة المتزامنة في SQLite
        db.session.execute(db.text('BEGIN IMMEDIATE'))
    except Exception:
        pass  # إذا كانت هناك معاملة قائمة

    try:
        in_slot = Appointment.query.filter_by(
            appointment_date=tomorrow,
            appointment_time=time_str,
            status='active'
        ).all()

        if len(in_slot) >= s.doctor_count:
            db.session.rollback()
            return jsonify({'message': 'عذراً، هذه الفترة امتلأت'}), 400

        used_doctors = {a.doctor_id for a in in_slot}
        doctor_id = None
        for i in range(1, s.doctor_count + 1):
            if i not in used_doctors:
                doctor_id = i
                break

        if doctor_id is None:
            db.session.rollback()
            return jsonify({'message': 'لا يوجد طبيب متاح'}), 400

        appt = Appointment(
            patient_name=patient_name,
            patient_phone=patient_phone,
            appointment_date=tomorrow,
            appointment_time=time_str,
            doctor_id=doctor_id,
            doctor_name=f'طبيب {doctor_id}',
            status='active'
        )
        db.session.add(appt)
        db.session.commit()

        return jsonify({
            'message': 'تم الحجز بنجاح',
            'data': {
                'id': appt.id,
                'doctorId': appt.doctor_id,
                'doctorName': appt.doctor_name,
                'date': tomorrow.strftime('%Y-%m-%d'),
                'time': time_str
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'حدث خطأ: {str(e)}'}), 500


@appointments_bp.route('', methods=['GET'])
@admin_required
def get_all():
    list_ = Appointment.query.order_by(
        Appointment.appointment_date,
        Appointment.appointment_time
    ).all()
    return jsonify([a.to_dict() for a in list_]), 200


@appointments_bp.route('/<int:appt_id>', methods=['DELETE'])
@admin_required
def cancel(appt_id):
    appt = Appointment.query.get(appt_id)
    if not appt:
        return jsonify({'message': 'الموعد غير موجود'}), 404

    appt.status = 'cancelled'
    db.session.commit()
    return jsonify({'message': 'تم إلغاء الموعد'}), 200


@appointments_bp.route('/all', methods=['DELETE'])
@admin_required
def delete_all():
    count = Appointment.query.delete()
    db.session.commit()
    return jsonify({'message': f'تم حذف {count} موعد'}), 200


@appointments_bp.route('/stats', methods=['GET'])
@admin_required
def stats():
    s = get_settings()
    tomorrow = get_tomorrow()

    from .utils import generate_slots
    all_slots = generate_slots(s.start_hour, s.end_hour, s.session_duration)
    total_slots = len(all_slots)
    total_capacity = total_slots * s.doctor_count

    booked = Appointment.query.filter_by(
        appointment_date=tomorrow,
        status='active'
    ).count()

    return jsonify({
        'doctorCount': s.doctor_count,
        'sessionDuration': s.session_duration,
        'totalSlots': total_slots,
        'totalCapacity': total_capacity,
        'booked': booked,
        'available': total_capacity - booked
    }), 200