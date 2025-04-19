from flask import Flask, jsonify, render_template, redirect, url_for, flash, session, request
from dbinit import init_db
import bcrypt
import os
from auth import auth_bp

# Инициализация БД
init_db()

# Создаем Flask приложение
app = Flask(__name__)
app.secret_key = os.urandom(24)  # Для работы с сессиями

# Регистрируем блюпринт для аутентификации
app.register_blueprint(auth_bp)

@app.route('/ping')
def index():
    return jsonify({"message": "pong"})

@app.route('/')
def home():
    # Проверяем, авторизован ли пользователь
    if 'user_id' in session:
        return redirect(url_for('chat'))
    return render_template('index.html')

@app.route('/chat')
def chat():
    # Проверяем, авторизован ли пользователь
    if 'user_id' not in session:
        return redirect(url_for('home'))
    return render_template('chat.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('nickname', None)
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
