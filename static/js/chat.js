document.addEventListener('DOMContentLoaded', function() {
    // DOM элементы
    const chatsList = document.getElementById('chatsList');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const searchUserModal = document.getElementById('searchUserModal');
    const profileModal = document.getElementById('profileModal');
    const searchUsersBtn = document.getElementById('searchUsersBtn');
    const userSearchInput = document.getElementById('userSearchInput');
    const searchResults = document.getElementById('searchResults');
    const chatProfilePhoto = document.getElementById('chatProfilePhoto');
    const chatUsername = document.getElementById('chatUsername');
    const chatStatus = document.getElementById('chatStatus');
    const emptyChatMessage = document.getElementById('emptyChatMessage');
    const messageInputArea = document.getElementById('messageInputArea');
    const profilePhotoLarge = document.getElementById('profilePhotoLarge');
    const profileName = document.getElementById('profileName');
    
    // Текущие данные
    let currentChatId = null;
    let lastMessageTimestamp = null;
    let chats = [];
    let pollingInterval = null;
    
    // Иницилизация
    init();
    
    function init() {
        // Загружаем список чатов
        loadChats();
        
        // Скрываем область ввода сообщений, пока не выбран чат
        messageInputArea.style.display = 'none';
        emptyChatMessage.style.display = 'flex';
        
        // Добавляем обработчик для отправки сообщений
        if (sendMessageBtn && messageInput) {
            sendMessageBtn.addEventListener('click', sendMessage);
            messageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
        
        // Обработчик для кнопки нового чата
        newChatBtn.addEventListener('click', showSearchUserModal);
        
        // Обработчики для модальных окон
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', function() {
                searchUserModal.style.display = 'none';
                profileModal.style.display = 'none';
            });
        });
        
        // Обработчик клика вне модального окна
        window.addEventListener('click', function(event) {
            if (event.target === searchUserModal) {
                searchUserModal.style.display = 'none';
            }
            if (event.target === profileModal) {
                profileModal.style.display = 'none';
            }
        });
        
        // Обработчик для поиска пользователей
        searchUsersBtn.addEventListener('click', searchUsers);
        userSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchUsers();
            }
        });
        
        // Обработчик для клика на фото профиля чата
        chatProfilePhoto.addEventListener('click', showProfileModal);
        
        // Запускаем цикл опроса сообщений (каждую секунду)
        startPolling();
    }
    
    function startPolling() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
        
        pollingInterval = setInterval(function() {
            if (currentChatId) {
                loadMessages(currentChatId, false);
            }
            loadChats(); // Обновление списка чатов для обновления последних сообщений
        }, 1000);
    }
    
    function stopPolling() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }
    
    function loadChats() {
        fetch('/api/chats')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderChats(data.chats);
                } else {
                    console.error('Ошибка загрузки чатов:', data.message);
                }
            })
            .catch(error => {
                console.error('Ошибка при загрузке чатов:', error);
            });
    }
    
    function renderChats(newChats) {
        if (!chatsList) return;
        
        // Сохраняем ID выбранного чата
        const selectedChatId = currentChatId;
        
        // Создаем Map с существующими чатами для быстрого поиска
        const existingChatsMap = new Map();
        chats.forEach(chat => existingChatsMap.set(chat.id, chat));
        
        // Обновляем только изменившиеся чаты, добавляем новые
        newChats.forEach(newChat => {
            const existingChat = existingChatsMap.get(newChat.id);
            
            // Если чата нет в списке или изменилось последнее сообщение, обновляем
            if (!existingChat || existingChat.latest_message !== newChat.latest_message) {
                // Удаляем старую версию чата из DOM, если она есть
                const existingChatElement = document.querySelector(`[data-chat-id="${newChat.id}"]`);
                if (existingChatElement) {
                    existingChatElement.remove();
                }
                
                // Добавляем новую версию чата
                const chatItem = document.createElement('li');
                chatItem.setAttribute('data-chat-id', newChat.id);
                
                if (newChat.id === selectedChatId) {
                    chatItem.classList.add('active');
                }
                
                const unreadBadge = newChat.unread ? `<div class="notification">•</div>` : '';
                
                chatItem.innerHTML = `
                    <div class="user-info">
                        <div class="avatar">
                            <img src="${newChat.user_photo || '/static/images/default-profile.png'}" alt="Фото профиля">
                        </div>
                        <div class="user-details">
                            <div class="username">${newChat.user_name}</div>
                            <div class="last-message">${newChat.latest_message}</div>
                        </div>
                    </div>
                    <div class="message-meta">
                        <div class="timestamp">${newChat.timestamp}</div>
                        ${unreadBadge}
                    </div>
                `;
                
                chatItem.addEventListener('click', function() {
                    onChatClick(newChat);
                });
                
                // Добавляем чат в DOM
                chatsList.appendChild(chatItem);
            }
        });
        
        // Сортируем чаты по времени последнего сообщения в DOM
        Array.from(chatsList.children)
            .sort((a, b) => {
                const aChat = newChats.find(chat => chat.id === parseInt(a.getAttribute('data-chat-id')));
                const bChat = newChats.find(chat => chat.id === parseInt(b.getAttribute('data-chat-id')));
                
                if (!aChat || !bChat || !aChat.timestamp_raw || !bChat.timestamp_raw) return 0;
                return new Date(bChat.timestamp_raw) - new Date(aChat.timestamp_raw);
            })
            .forEach(node => chatsList.appendChild(node));
        
        // Обновляем список чатов в памяти
        chats = newChats;
    }
    
    function onChatClick(chat) {
        // Обновляем активный класс
        document.querySelectorAll('.user-list li').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        
        // Обновляем заголовок чата
        chatUsername.textContent = chat.user_name;
        document.getElementById('chatProfilePhoto').querySelector('img').src = 
            chat.user_photo || '/static/images/default-profile.png';
        chatStatus.textContent = ''; // Убираем текст статуса "В сети"
        
        // Обновляем текущий ID чата
        currentChatId = chat.id;
        
        // Скрываем сообщение пустого чата и показываем поле ввода
        emptyChatMessage.style.display = 'none';
        messageInputArea.style.display = 'flex';
        
        // Загружаем сообщения
        loadMessages(chat.id, true);
    }
    
    function loadMessages(chatId, scrollToBottom = false) {
        fetch(`/api/chats/${chatId}/messages`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderMessages(data.messages, scrollToBottom);
                    // Обновляем временную метку последнего сообщения
                    if (data.messages.length > 0) {
                        const lastMsg = data.messages[data.messages.length - 1];
                        lastMessageTimestamp = lastMsg.timestamp_raw;
                    }
                } else {
                    console.error('Ошибка загрузки сообщений:', data.message);
                }
            })
            .catch(error => {
                console.error('Ошибка при загрузке сообщений:', error);
            });
    }
    
    function renderMessages(messages, scrollToBottom = false) {
        if (!messagesContainer) return;
        
        // Если это не обновление, очищаем контейнер
        if (scrollToBottom) {
            messagesContainer.innerHTML = '';
        }
        
        // Добавляем сообщения
        messages.forEach(msg => {
            const messageClass = msg.is_sent_by_me ? 'sent' : 'received';
            
            // Проверяем, существует ли уже это сообщение
            const existingMessage = document.getElementById(`message-${msg.id}`);
            if (existingMessage) {
                return; // Пропускаем добавление, если сообщение уже есть
            }
            
            const messageElement = document.createElement('div');
            messageElement.className = `message ${messageClass}`;
            messageElement.id = `message-${msg.id}`;
            
            messageElement.innerHTML = `
                <div class="content">${msg.content}</div>
                <div class="timestamp">${msg.timestamp}</div>
            `;
            
            messagesContainer.appendChild(messageElement);
        });
        
        if (scrollToBottom) {
            scrollToBottomMessages();
        }
    }
    
    function scrollToBottomMessages() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (!messageText || !currentChatId) return;
        
        // Отправляем сообщение
        fetch(`/api/chats/${currentChatId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: messageText
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Очищаем поле ввода
                messageInput.value = '';
                
                // Добавляем сообщение и прокручиваем вниз
                renderMessages([data.message], true);
                
                // Обновляем список чатов
                loadChats();
            } else {
                console.error('Ошибка отправки сообщения:', data.message);
            }
        })
        .catch(error => {
            console.error('Ошибка при отправке сообщения:', error);
        });
    }
    
    function showSearchUserModal() {
        searchUserModal.style.display = 'block';
        userSearchInput.focus();
        searchResults.innerHTML = '';
    }
    
    function showProfileModal() {
        if (!currentChatId) return;
        
        // Находим информацию о текущем чате
        const currentChat = chats.find(chat => chat.id === currentChatId);
        if (!currentChat) return;
        
        // Заполняем модальное окно информацией о пользователе
        profilePhotoLarge.src = currentChat.user_photo || '/static/images/default-profile.png';
        profileName.textContent = currentChat.user_name;
        
        // Отображаем модальное окно
        profileModal.style.display = 'block';
    }
    
    function searchUsers() {
        const query = userSearchInput.value.trim();
        if (!query) return;
        
        fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                renderSearchResults(data.users || []);
            })
            .catch(error => {
                console.error('Ошибка при поиске пользователей:', error);
                searchResults.innerHTML = '<p>Произошла ошибка при поиске</p>';
            });
    }
    
    function renderSearchResults(users) {
        searchResults.innerHTML = '';
        
        if (users.length === 0) {
            searchResults.innerHTML = '<p>Пользователи не найдены</p>';
            return;
        }
        
        users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'search-result-item';
            
            userItem.innerHTML = `
                <div class="avatar">
                    <img src="${user.photo || '/static/images/default-profile.png'}" alt="Фото профиля">
                </div>
                <div class="username">${user.nickname}</div>
            `;
            
            userItem.addEventListener('click', function() {
                createChat(user.id);
            });
            
            searchResults.appendChild(userItem);
        });
    }
    
    function createChat(userId) {
        fetch('/api/chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Закрываем модальное окно
                searchUserModal.style.display = 'none';
                
                // Обновляем список чатов
                loadChats();
                
                // Автоматически выбираем новый чат
                setTimeout(() => {
                    const newChatItem = document.querySelector(`[data-chat-id="${data.chat.id}"]`);
                    if (newChatItem) {
                        newChatItem.click();
                    }
                }, 500);
            } else {
                console.error('Ошибка создания чата:', data.message);
            }
        })
        .catch(error => {
            console.error('Ошибка при создании чата:', error);
        });
    }
});
