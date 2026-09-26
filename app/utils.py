from datetime import date, timedelta


def get_tomorrow():
    """تاريخ الغد فقط"""
    return date.today() + timedelta(days=1)


def generate_slots(start_hour, end_hour, session_duration):
    """توليد الفترات الزمنية"""
    slots = []
    for h in range(start_hour, end_hour):
        for m in range(0, 60, session_duration):
            slots.append(f"{h:02d}:{m:02d}")
    return slots