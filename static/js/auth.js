document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');

    // Функция для входа
    loginButton.addEventListener('click', function() {
        const nickname = document.getElementById('loginNickname').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!nickname || !password) {
            loginError.textContent = 'Пожалуйста, заполните все поля';
            loginError.classList.remove('hidden');
            return;
        }

        // Отправляем запрос на сервер для входа
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nickname, password }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/chat';
            } else {
                loginError.textContent = data.message || 'Ошибка входа';
                loginError.classList.remove('hidden');
            }
        })
        .catch(error => {
            loginError.textContent = 'Ошибка сервера';
            loginError.classList.remove('hidden');
            console.error('Error:', error);
        });
    });

    // Функция для регистрации
    registerButton.addEventListener('click', function() {
        const nickname = document.getElementById('registerNickname').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        // Сбросить предыдущие ошибки
        registerError.classList.add('hidden');
        
        // Валидация
        if (!nickname || !password || !confirmPassword) {
            registerError.textContent = 'Пожалуйста, заполните все поля';
            registerError.classList.remove('hidden');
            return;
        }
        
        if (password !== confirmPassword) {
            registerError.textContent = 'Пароли не совпадают';
            registerError.classList.remove('hidden');
            return;
        }

        if (password.length < 6) {
            registerError.textContent = 'Пароль должен содержать не менее 6 символов';
            registerError.classList.remove('hidden');
            return;
        }

        // Отправляем запрос на сервер для регистрации
        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nickname, password }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Показать сообщение об успехе и перейти к форме входа
                alert('Регистрация успешна! Теперь вы можете войти в систему.');
                document.getElementById('showLoginLink').click();
            } else {
                registerError.textContent = data.message || 'Ошибка регистрации';
                registerError.classList.remove('hidden');
            }
        })
        .catch(error => {
            registerError.textContent = 'Ошибка сервера';
            registerError.classList.remove('hidden');
            console.error('Error:', error);
        });
    });
});
