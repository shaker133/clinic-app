import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'

    print('=' * 60)
    print('🏥  نظام حجز عيادة العلاج الطبيعي')
    print('=' * 60)
    print(f'🌐  الخادم يعمل على: http://0.0.0.0:{port}')
    print(f'🔑  بيانات الدخول: admin / admin123')
    print('=' * 60)

    app.run(host='0.0.0.0', port=port, debug=debug)