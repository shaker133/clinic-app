from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='admin', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None
        }


class Settings(db.Model):
    __tablename__ = 'settings'

    id = db.Column(db.Integer, primary_key=True)
    doctor_count = db.Column(db.Integer, default=3, nullable=False)
    session_duration = db.Column(db.Integer, default=30, nullable=False)
    start_hour = db.Column(db.Integer, default=10, nullable=False)
    end_hour = db.Column(db.Integer, default=24, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, nullable=False)

    def to_dict(self):
        return {
            'doctorCount': self.doctor_count,
            'sessionDuration': self.session_duration,
            'startHour': self.start_hour,
            'endHour': self.end_hour,
            'updatedAt': self.updated_at.isoformat()
        }


class Appointment(db.Model):
    __tablename__ = 'appointments'

    id = db.Column(db.Integer, primary_key=True)
    patient_name = db.Column(db.String(100), nullable=False)
    patient_phone = db.Column(db.String(20), nullable=False)
    appointment_date = db.Column(db.Date, nullable=False, index=True)
    appointment_time = db.Column(db.String(5), nullable=False, index=True)
    doctor_id = db.Column(db.Integer, nullable=False)
    doctor_name = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='active', nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)

    __table_args__ = (
        db.Index('ix_appt_date_time', 'appointment_date', 'appointment_time'),
        db.Index('ix_appt_doctor_slot',
                 'appointment_date', 'appointment_time', 'doctor_id', 'status'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'patientName': self.patient_name,
            'patientPhone': self.patient_phone,
            'appointmentDate': self.appointment_date.strftime('%Y-%m-%d'),
            'appointmentTime': self.appointment_time,
            'doctorId': self.doctor_id,
            'doctorName': self.doctor_name,
            'status': self.status,
            'createdAt': self.created_at.isoformat()
        }