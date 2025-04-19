import bcrypt
import sqlite3
from flask import Blueprint, request, jsonify, session

auth_bp = Blueprint('auth', __name__)

def get_db_connection():
    """Create and return a database connection"""
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or 'nickname' not in data or 'password' not in data:
        return jsonify({"success": False, "message": "Не все поля заполнены"}), 400
    
    nickname = data['nickname']
    password = data['password']
    
    # Проверка полей
    if not nickname or not password:
        return jsonify({"success": False, "message": "Необходимо заполнить все поля"}), 400
    
    if len(password) < 6:
        return jsonify({"success": False, "message": "Пароль должен содержать не менее 6 символов"}), 400
    
    # Проверка, существует ли пользователь с таким именем
    conn = get_db_connection()
    existing_user = conn.execute('SELECT id FROM users WHERE nickname = ?', 
                                (nickname,)).fetchone()
    
    if existing_user:
        conn.close()
        return jsonify({"success": False, "message": "Пользователь с таким именем уже существует"}), 409
    
    # Хэширование пароля и создание пользователя
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    conn.execute(
        'INSERT INTO users (nickname, password) VALUES (?, ?)',
        (nickname, hashed_password)
    )
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Регистрация успешна"})

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or 'nickname' not in data or 'password' not in data:
        return jsonify({"success": False, "message": "Не все поля заполнены"}), 400
    
    nickname = data['nickname']
    password = data['password']
    
    conn = get_db_connection()
    user = conn.execute('SELECT id, nickname, password FROM users WHERE nickname = ?', 
                      (nickname,)).fetchone()
    conn.close()
    
    if not user:
        return jsonify({"success": False, "message": "Неверный логин или пароль"}), 401
    
    # Проверка пароля
    if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        session['user_id'] = user['id']
        session['nickname'] = user['nickname']
        return jsonify({"success": True, "message": "Авторизация успешна"})
    else:
        return jsonify({"success": False, "message": "Неверный логин или пароль"}), 401
