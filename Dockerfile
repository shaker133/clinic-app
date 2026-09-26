FROM python:3.11-slim

# معلومات المشروع
LABEL maintainer="Clinic App"
LABEL description="نظام حجز عيادة العلاج الطبيعي"

# متغيرات البيئة
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    TZ=Africa/Cairo

# مجلد العمل
WORKDIR /app

# تثبيت التبعيات النظامية
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    sqlite3 \
    curl \
    tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone

# نسخ المتطلبات أولاً (للاستفادة من Docker cache)
COPY requirements.txt .

# تثبيت مكتبات Python
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# نسخ باقي المشروع
COPY . .

# إنشاء مجلد البيانات
RUN mkdir -p /app/data

# مستخدم غير root للأمان
RUN useradd -m -u 1000 clinic && \
    chown -R clinic:clinic /app
USER clinic

# منفذ التطبيق
EXPOSE 5000

# فحص الصحة
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

# التشغيل عبر gunicorn (production-ready)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", \
     "--workers", "2", \
     "--threads", "4", \
     "--timeout", "60", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "run:app"]