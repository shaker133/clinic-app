from datetime import datetime
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, jwt_required,
    get_jwt_identity, get_jwt
)
import bcrypt
from .models import db, User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def admin_required(fn):
    """Decorator: يجب أن يكون المستخدم admin"""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'message': 'غير مصرح'}), 403
        return fn(*args, **kwargs)
    return wrapper


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return jsonify({'message': 'الرجاء إدخال اسم المستخدم وكلمة المرور'}), 400

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'اسم المستخدم غير صحيح'}), 401

    if not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return jsonify({'message': 'كلمة المرور غير صحيحة'}), 401

    user.last_login = datetime.now()
    db.session.commit()

    token = create_access_token(
        identity=user.username,
        additional_claims={'role': user.role, 'uid': user.id}
    )

    return jsonify({
        'message': 'تم تسجيل الدخول',
        'token': token,
        'username': user.username
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    username = get_jwt_identity()
    return jsonify({'username': username}), 200


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    username = get_jwt_identity()
    data = request.get_json() or {}
    old_pass = data.get('oldPassword') or ''
    new_pass = data.get('newPassword') or ''

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'المستخدم غير موجود'}), 404

    if not bcrypt.checkpw(old_pass.encode(), user.password_hash.encode()):
        return jsonify({'message': 'كلمة المرور الحالية غير صحيحة'}), 400

    if len(new_pass) < 6:
        return jsonify({'message': 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'}), 400

    if old_pass == new_pass:
        return jsonify({'message': 'كلمة المرور الجديدة مطابقة للحالية'}), 400

    user.password_hash = bcrypt.hashpw(
        new_pass.encode(), bcrypt.gensalt()
    ).decode()
    db.session.commit()

    return jsonify({'message': 'تم تغيير كلمة المرور بنجاح'}), 200


@auth_bp.route('/change-username', methods=['POST'])
@jwt_required()
def change_username():
    old_username = get_jwt_identity()
    data = request.get_json() or {}
    new_username = (data.get('newUsername') or '').strip()

    if len(new_username) < 3:
        return jsonify({'message': 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'}), 400

    if old_username == new_username:
        return jsonify({'message': 'الاسم الجديد مطابق للحالي'}), 400

    if User.query.filter_by(username=new_username).first():
        return jsonify({'message': 'اسم المستخدم مستخدم بالفعل'}), 400

    user = User.query.filter_by(username=old_username).first()
    if not user:
        return jsonify({'message': 'المستخدم غير موجود'}), 404

    user.username = new_username
    db.session.commit()

    return jsonify({'message': 'تم تغيير اسم المستخدم بنجاح'}), 200