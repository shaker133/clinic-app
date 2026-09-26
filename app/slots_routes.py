from flask import Blueprint, jsonify
from .models import Appointment
from .utils import get_tomorrow, generate_slots
from .settings_routes import get_settings

slots_bp = Blueprint('slots', __name__, url_prefix='/api/slots')


@slots_bp.route('', methods=['GET'])
def get_slots():
    s = get_settings()
    tomorrow = get_tomorrow()

    # جلب الحجوزات النشطة
    appts = Appointment.query.filter_by(
        appointment_date=tomorrow,
        status='active'
    ).all()

    counts = {}
    for a in appts:
        counts[a.appointment_time] = counts.get(a.appointment_time, 0) + 1

    all_slots = generate_slots(s.start_hour, s.end_hour, s.session_duration)

    result = []
    for t in all_slots:
        cnt = counts.get(t, 0)
        result.append({
            'time': t,
            'booked': cnt,
            'capacity': s.doctor_count,
            'available': cnt < s.doctor_count
        })

    return jsonify({
        'date': tomorrow.strftime('%Y-%m-%d'),
        'slots': result
    }), 200