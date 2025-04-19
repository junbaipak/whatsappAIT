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
    const chatSearchInput = document.getElementById('chatSearchInput'); // Добавляем ссылку на поле поиска чатов
    const currentUserName = document.getElementById('currentUserName'); // Добавляем ссылку на элемент имени текущего пользователя
    
    // Текущие данные
    let currentChatId = null;
    let lastMessageTimestamp = null;
    let chats = [];
    let pollingInterval = null;
    let filteredChats = []; // Добавляем массив для отфильтрованных чатов
    
    // Иницилизация
    init();
    
    function init() {
        // Устанавливаем имя пользователя по умолчанию
        if (currentUserName) {
            currentUserName.textContent = 'Пользователь';
        }
        
        // Загружаем информацию о текущем пользователе
        getCurrentUserInfo();
        
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
        
        // Добавляем обработчик для поиска чатов
        if (chatSearchInput) {
            chatSearchInput.addEventListener('input', searchChats);
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
        
        // Обновляем список чатов в памяти
        chats = newChats;
        
        // Применяем текущий поисковый фильтр, если он есть
        const searchQuery = chatSearchInput ? chatSearchInput.value.trim().toLowerCase() : '';
        if (searchQuery) {
            filteredChats = chats.filter(chat => 
                chat.user_name.toLowerCase().includes(searchQuery)
            );
            updateChatsUI(filteredChats, selectedChatId);
        } else {
            filteredChats = [...chats];
            updateChatsUI(chats, selectedChatId);
        }
    }
    
    // Новая функция для обновления UI списка чатов
    function updateChatsUI(chatsToRender, selectedChatId) {
        if (!chatsList) return;
        
        // Очищаем текущий список
        chatsList.innerHTML = '';
        
        // Сортируем чаты по времени последнего сообщения
        const sortedChats = [...chatsToRender].sort((a, b) => {
            if (!a.timestamp_raw || !b.timestamp_raw) return 0;
            return new Date(b.timestamp_raw) - new Date(a.timestamp_raw);
        });
        
        // Если нет чатов после фильтрации, показываем сообщение
        if (sortedChats.length === 0) {
            const noChatsMessage = document.createElement('li');
            noChatsMessage.classList.add('no-chats-message');
            noChatsMessage.textContent = 'Чаты не найдены';
            chatsList.appendChild(noChatsMessage);
            return;
        }
        
        // Добавляем чаты в DOM
        sortedChats.forEach(chat => {
            const chatItem = document.createElement('li');
            chatItem.setAttribute('data-chat-id', chat.id);
            
            if (chat.id === selectedChatId) {
                chatItem.classList.add('active');
            }
            
            const unreadBadge = chat.unread ? `<div class="notification">•</div>` : '';
            
            chatItem.innerHTML = `
                <div class="user-info">
                    <div class="avatar">
                        <img src="${chat.user_photo || '/static/images/default-profile.png'}" alt="Фото профиля">
                    </div>
                    <div class="user-details">
                        <div class="username">${chat.user_name}</div>
                        <div class="last-message">${chat.latest_message}</div>
                    </div>
                </div>
                <div class="message-meta">
                    <div class="timestamp">${chat.timestamp}</div>
                    ${unreadBadge}
                </div>
            `;
            
            chatItem.addEventListener('click', function() {
                onChatClick(chat);
            });
            
            chatsList.appendChild(chatItem);
        });
    }
    
    // Функция поиска чатов
    function searchChats() {
        const searchQuery = chatSearchInput.value.trim().toLowerCase();
        
        if (searchQuery) {
            filteredChats = chats.filter(chat => 
                chat.user_name.toLowerCase().includes(searchQuery)
            );
            updateChatsUI(filteredChats, currentChatId);
        } else {
            filteredChats = [...chats];
            updateChatsUI(chats, currentChatId);
        }
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
    
    // Функция для получения информации о текущем пользователе
    function getCurrentUserInfo() {
        fetch('/api/users/current')
            .then(response => response.json())
            .then(data => {
                if (data.success && currentUserName) {
                    currentUserName.textContent = data.user.nickname || data.user.name || 'Пользователь';
                }
            })
            .catch(error => {
                console.error('Ошибка при получении данных пользователя:', error);
                // Если произошла ошибка, оставляем текст по умолчанию "Пользователь"
            });
    }
});
