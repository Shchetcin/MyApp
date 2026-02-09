// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    // Для демо-режима
    DEMO_MODE: true,
    DEMO_DATA: {
        teams: [
            { id: 1, name: "Фениксы", score: 450, code: "TEAM01", color: "#FF6B6B", members: 4 },
            { id: 2, name: "Титаны", score: 380, code: "TEAM02", color: "#4ECDC4", members: 5 },
            { id: 3, name: "Волки", score: 520, code: "TEAM03", color: "#45B7D1", members: 4 },
            { id: 4, name: "Орлы", score: 290, code: "TEAM04", color: "#96CEB4", members: 3 },
            { id: 5, name: "Молния", score: 610, code: "TEAM05", color: "#FFEAA7", members: 5 },
            { id: 6, name: "Викинги", score: 340, code: "TEAM06", color: "#DDA0DD", members: 4 }
        ],
        achievements: [
            { id: 1, name: "Первые шаги", desc: "Войти в приложение", icon: "fa-door-open", earned: true },
            { id: 2, name: "Быстрый старт", desc: "Получить 100 баллов", icon: "fa-bolt", earned: true },
            { id: 3, name: "Лидер", desc: "Занять 1 место в рейтинге", icon: "fa-crown", earned: false },
            { id: 4, name: "Социальный", desc: "Загрузить фото команды", icon: "fa-camera", earned: false },
            { id: 5, name: "Победитель", desc: "Выиграть 5 заданий", icon: "fa-trophy", earned: false },
            { id: 6, name: "Активный", desc: "Быть онлайн 3 часа", icon: "fa-fire", earned: true }
        ],
        tasks: [
            { id: 1, title: "Квест: Тайны кампуса", time: "45 мин", reward: 50, urgent: true },
            { id: 2, title: "Интеллектуальный батл", time: "1 ч 30 мин", reward: 30, urgent: false },
            { id: 3, title: "Фото-челлендж", time: "2 ч", reward: 40, urgent: false },
            { id: 4, title: "Командный квиз", time: "3 ч", reward: 60, urgent: false }
        ]
    },
    
    // Для реального режима (Google Apps Script)
    API_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    ADMIN_CREDENTIALS: { login: 'admin', password: 'event2024' },
    
    // Настройки
    REFRESH_INTERVAL: 10000, // 10 секунд
    NOTIFICATION_DURATION: 5000 // 5 секунд
};

// ===== СОСТОЯНИЕ ПРИЛОЖЕНИЯ =====
let state = {
    currentTeam: null,
    isAdmin: false,
    activeSection: 'dashboard',
    sidebarOpen: false,
    notificationsOpen: false,
    currentTheme: localStorage.getItem('theme') || 'dark',
    notifications: [
        { id: 1, text: "Вашей команде начислено 20 баллов за активность", time: "5 мин назад", read: false },
        { id: 2, text: "Новое задание доступно: 'Квест кампуса'", time: "15 мин назад", read: false },
        { id: 3, text: "Команда 'Титаны' обогнала вас в рейтинге", time: "30 мин назад", read: true }
    ]
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    // Устанавливаем тему
    document.documentElement.setAttribute('data-theme', state.currentTheme);
    updateThemeButton();
    
    // Восстанавливаем сессию
    restoreSession();
    
    // Инициализируем демо-данные
    if (CONFIG.DEMO_MODE) {
        initDemoData();
    }
    
    // Обновляем статистику в футере
    updateFooterStats();
    
    // Запускаем автообновление
    startAutoRefresh();
});

// ===== ТЕМА =====
function toggleTheme() {
    state.currentTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.currentTheme);
    localStorage.setItem('theme', state.currentTheme);
    updateThemeButton();
    showNotification(`Переключена ${state.currentTheme === 'dark' ? 'темная' : 'светлая'} тема`);
}

function updateThemeButton() {
    const btn = document.querySelector('.theme-btn');
    if (btn) {
        const icon = btn.querySelector('i');
        const text = btn.querySelector('span');
        if (state.currentTheme === 'dark') {
            icon.className = 'fas fa-sun';
            text.textContent = 'Светлая тема';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = 'Темная тема';
        }
    }
}

// ===== АВТОРИЗАЦИЯ =====
function switchRole(role) {
    // Обновляем кнопки
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.role === role);
    });
    
    // Показываем нужную форму
    document.getElementById('participant-form').classList.toggle('active', role === 'participant');
    document.getElementById('organizer-form').classList.toggle('active', role === 'organizer');
}

async function loginAsTeam() {
    const code = document.getElementById('team-code').value.trim().toUpperCase();
    const playerName = document.getElementById('player-name').value.trim();
    
    if (!code) {
        showNotification('Введите код команды', 'error');
        return;
    }
    
    if (!playerName) {
        showNotification('Введите ваше имя', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        let team;
        
        if (CONFIG.DEMO_MODE) {
            // Демо-режим: ищем в демо-данных
            team = CONFIG.DEMO_DATA.teams.find(t => t.code === code);
            
            if (!team) {
                showNotification('Команда не найдена. Попробуйте TEAM01, TEAM02, TEAM03', 'error');
                showLoading(false);
                return;
            }
            
            // Добавляем имя игрока
            team.playerName = playerName;
            
            // Имитируем задержку сети
            await new Promise(resolve => setTimeout(resolve, 800));
        } else {
            // Реальный режим: запрос к API
            // const response = await fetch(`${CONFIG.API_URL}?action=getTeam&code=${code}`);
            // const data = await response.json();
            // if (!data.success) throw new Error(data.error);
            // team = data.team;
        }
        
        state.currentTeam = team;
        localStorage.setItem('currentTeam', JSON.stringify(team));
        localStorage.setItem('playerName', playerName);
        
        // Переходим на экран команды
        switchScreen('team-screen');
        loadTeamDashboard();
        
        showNotification(`Добро пожаловать, ${playerName}! Команда "${team.name}"`, 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Ошибка входа. Проверьте код команды', 'error');
    } finally {
        showLoading(false);
    }
}

async function loginAsAdmin() {
    const login = document.getElementById('admin-login').value.trim();
    const password = document.getElementById('admin-password').value;
    
    if (!login || !password) {
        showNotification('Заполните все поля', 'error');
        return;
    }
    
    if (CONFIG.DEMO_MODE) {
        // Демо-проверка
        if (login === CONFIG.ADMIN_CREDENTIALS.login && password === CONFIG.ADMIN_CREDENTIALS.password) {
            state.isAdmin = true;
            localStorage.setItem('isAdmin', 'true');
            switchScreen('admin-screen');
            loadAdminDashboard();
            showNotification('Панель администратора загружена', 'success');
        } else {
            showNotification('Неверные учетные данные', 'error');
        }
    } else {
        // Реальная проверка
        // ... API call
    }
}

function logout() {
    state.currentTeam = null;
    state.isAdmin = false;
    localStorage.removeItem('currentTeam');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('playerName');
    switchScreen('login-screen');
    showNotification('Вы успешно вышли из системы');
}

function restoreSession() {
    const savedTeam = localStorage.getItem('currentTeam');
    const savedAdmin = localStorage.getItem('isAdmin');
    
    if (savedTeam) {
        try {
            state.currentTeam = JSON.parse(savedTeam);
            switchScreen('team-screen');
            loadTeamDashboard();
        } catch (e) {
            console.error('Error restoring session:', e);
            localStorage.removeItem('currentTeam');
        }
    } else if (savedAdmin === 'true') {
        state.isAdmin = true;
        switchScreen('admin-screen');
        loadAdminDashboard();
    }
}

// ===== НАВИГАЦИЯ =====
function switchScreen(screenId) {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показываем нужный экран
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    // Закрываем меню и уведомления
    state.sidebarOpen = false;
    state.notificationsOpen = false;
    updateSidebar();
    updateNotificationsPanel();
}

function toggleSidebar() {
    state.sidebarOpen = !state.sidebarOpen;
    updateSidebar();
}

function updateSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar) {
        sidebar.classList.toggle('open', state.sidebarOpen);
    }
    
    if (overlay) {
        overlay.classList.toggle('active', state.sidebarOpen);
    }
}

function toggleNotifications() {
    state.notificationsOpen = !state.notificationsOpen;
    updateNotificationsPanel();
}

function updateNotificationsPanel() {
    const panel = document.getElementById('notification-panel');
    if (panel) {
        panel.classList.toggle('active', state.notificationsOpen);
    }
}

function showSection(sectionId) {
    state.activeSection = sectionId;
    
    // Обновляем меню
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
    
    // Показываем секцию
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Закрываем меню на мобильных
    if (window.innerWidth < 768) {
        state.sidebarOpen = false;
        updateSidebar();
    }
}

// ===== КОМАНДА: ДАШБОРД =====
function loadTeamDashboard() {
    if (!state.currentTeam) return;
    
    // Обновляем информацию в шапке
    document.getElementById('team-name').textContent = state.currentTeam.name;
    document.getElementById('sidebar-team-name').textContent = state.currentTeam.name;
    document.getElementById('sidebar-team-code').textContent = `Код: ${state.currentTeam.code}`;
    document.getElementById('sidebar-score').textContent = state.currentTeam.score;
    
    // Обновляем аватар
    const avatar = document.getElementById('team-avatar');
    if (avatar) {
        avatar.textContent = state.currentTeam.name.substring(0, 2).toUpperCase();
        avatar.style.background = state.currentTeam.color || getRandomColor(state.currentTeam.id);
    }
    
    // Обновляем статистику
    updateTeamStats();
    
    // Загружаем историю
    loadTeamHistory();
    
    // Загружаем ачивки
    loadAchievements();
    
    // Загружаем рейтинг
    loadRating();
    
    // Обновляем позицию в рейтинге
    updateTeamPosition();
}

function updateTeamStats() {
    if (!state.currentTeam) return;
    
    // Основной счет
    document.getElementById('team-score').textContent = state.currentTeam.score;
    
    // Счет за сегодня (демо)
    const todayScore = Math.floor(Math.random() * 100) + 50;
    document.getElementById('team-today').textContent = `+${todayScore}`;
    
    // Дней активности (демо)
    const streak = Math.floor(Math.random() * 5) + 1;
    document.getElementById('team-streak').textContent = streak;
}

function loadTeamHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    // Демо-история
    const demoHistory = [
        { time: "14:30", change: 20, reason: "Активность на лекции", by: "Иван Петров" },
        { time: "13:45", change: 50, reason: "Победа в квесте", by: "Мария Сидорова" },
        { time: "12:15", change: 30, reason: "Креативное решение", by: "Алексей Иванов" },
        { time: "11:30", change: 10, reason: "Помощь другой команде", by: "Ольга Смирнова" },
        { time: "10:00", change: 40, reason: "Выполнение задания", by: "Дмитрий Кузнецов" }
    ];
    
    historyList.innerHTML = demoHistory.map(item => `
        <div class="history-item">
            <div class="history-icon">
                <i class="fas fa-${item.change > 0 ? 'plus' : 'minus'}"></i>
            </div>
            <div class="history-content">
                <h4>${item.reason}</h4>
                <p>${item.time} • ${item.by}</p>
            </div>
            <div class="history-points ${item.change > 0 ? '' : 'negative'}">
                ${item.change > 0 ? '+' : ''}${item.change}
            </div>
        </div>
    `).join('');
}

function loadAchievements() {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;
    
    const countElement = document.getElementById('achievement-count');
    const earnedCount = CONFIG.DEMO_DATA.achievements.filter(a => a.earned).length;
    
    if (countElement) {
        countElement.textContent = earnedCount;
    }
    
    grid.innerHTML = CONFIG.DEMO_DATA.achievements.map(achievement => `
        <div class="achievement-item ${achievement.earned ? '' : 'locked'}" 
             onclick="showAchievementDetail(${achievement.id})">
            <div class="achievement-icon">
                <i class="fas ${achievement.icon}"></i>
            </div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-desc">${achievement.desc}</div>
        </div>
    `).join('');
}

function loadRating() {
    const table = document.getElementById('rating-table');
    if (!table) return;
    
    // Сортируем команды по баллам
    const sortedTeams = [...CONFIG.DEMO_DATA.teams].sort((a, b) => b.score - a.score);
    
    table.innerHTML = `
        <div class="rating-header">
            <div>Место</div>
            <div>Команда</div>
            <div>Баллы</div>
        </div>
        ${sortedTeams.map((team, index) => {
            const isCurrent = state.currentTeam && team.id === state.currentTeam.id;
            return `
                <div class="rating-row ${isCurrent ? 'current' : ''}">
                    <div class="rank rank-${index + 1}">${index + 1}</div>
                    <div class="team-info-small">
                        <div class="team-avatar-small" style="background: ${team.color}">
                            ${team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div class="team-name">${team.name}</div>
                            <div class="team-members">${team.members} участника</div>
                        </div>
                    </div>
                    <div class="team-score">${team.score}</div>
                </div>
            `;
        }).join('')}
    `;
}

function updateTeamPosition() {
    if (!state.currentTeam) return;
    
    const sortedTeams = [...CONFIG.DEMO_DATA.teams].sort((a, b) => b.score - a.score);
    const position = sortedTeams.findIndex(team => team.id === state.currentTeam.id) + 1;
    
    const positionElement = document.getElementById('team-position');
    if (positionElement) {
        positionElement.textContent = position;
        
        // Обновляем прогресс до следующего места
        if (position > 1) {
            const currentScore = state.currentTeam.score;
            const nextTeam = sortedTeams[position - 2]; // Команда выше на 1 позицию
            const scoreDiff = nextTeam.score - currentScore;
            const maxDiff = 200; // Максимальная разница для 100% прогресса
            
            const progressPercent = Math.min(100, Math.max(0, 100 - (scoreDiff / maxDiff * 100)));
            const progressBar = document.getElementById('next-rank-progress');
            if (progressBar) {
                progressBar.style.width = `${progressPercent}%`;
            }
        }
    }
}

// ===== КАРТА МЕРОПРИЯТИЯ =====
function refreshMap() {
    const grid = document.querySelector('.map-grid');
    if (!grid) return;
    
    // Генерируем демо-карту 5x5
    const mapSize = 5;
    const totalCells = mapSize * mapSize;
    
    // Определяем позицию команды (случайно для демо)
    const teamPosition = Math.floor(Math.random() * totalCells);
    
    // Определяем активные задания (5 случайных клеток)
    const activeTasks = new Set();
    while (activeTasks.size < 5) {
        activeTasks.add(Math.floor(Math.random() * totalCells));
    }
    
    // Определяем пройденные задания (до 3 случайных)
    const completedTasks = new Set();
    const completedCount = Math.floor(Math.random() * 4);
    Array.from(activeTasks).slice(0, completedCount).forEach(pos => {
        completedTasks.add(pos);
    });
    
    grid.innerHTML = '';
    
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'map-cell';
        
        if (i === teamPosition) {
            cell.classList.add('active');
            cell.innerHTML = '<i class="fas fa-users"></i><div>Вы здесь</div>';
        } else if (completedTasks.has(i)) {
            cell.classList.add('completed');
            cell.innerHTML = '<i class="fas fa-check"></i><div>Пройдено</div>';
        } else if (activeTasks.has(i)) {
            cell.innerHTML = '<i class="fas fa-quest"></i><div>Задание</div>';
            cell.onclick = () => showTaskDetail(i);
        } else {
            cell.classList.add('empty');
            cell.innerHTML = '<i class="fas fa-map"></i>';
        }
        
        grid.appendChild(cell);
    }
    
    showNotification('Карта обновлена', 'success');
}

// ===== АДМИНИСТРИРОВАНИЕ =====
function loadAdminDashboard() {
    // Обновляем статистику
    updateAdminStats();
    
    // Загружаем список команд
    loadTeamsTable();
    
    // Заполняем выпадающий список команд
    populateTeamSelect();
}

function updateAdminStats() {
    // Демо-статистика
    document.getElementById('active-teams').textContent = CONFIG.DEMO_DATA.teams.length;
    document.getElementById('total-points').textContent = CONFIG.DEMO_DATA.teams.reduce((sum, team) => sum + team.score, 0);
    document.getElementById('active-tasks').textContent = CONFIG.DEMO_DATA.tasks.length;
    document.getElementById('online-participants').textContent = CONFIG.DEMO_DATA.teams.reduce((sum, team) => sum + team.members, 0);
}

function loadTeamsTable() {
    const tbody = document.getElementById('teams-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = CONFIG.DEMO_DATA.teams.map(team => `
        <tr class="team-row">
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="team-avatar-small" style="background: ${team.color}">
                        ${team.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight: 600;">${team.name}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Код: ${team.code}</div>
                    </div>
                </div>
            </td>
            <td>
                <div style="font-weight: 700; font-size: 1.2rem;">${team.score}</div>
                <div style="font-size: 12px; color: var(--success-color);">+${Math.floor(Math.random() * 50)} сегодня</div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span class="status-indicator online"></span>
                    <span>Активна</span>
                </div>
            </td>
            <td>
                <div class="team-actions">
                    <button class="action-btn" onclick="editTeam(${team.id})" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" onclick="viewTeamDetails(${team.id})" title="Подробнее">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" onclick="selectTeamForPoints(${team.id})" title="Начислить баллы">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function populateTeamSelect() {
    const select = document.getElementById('admin-team-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Выберите команду --</option>' +
        CONFIG.DEMO_DATA.teams.map(team => 
            `<option value="${team.id}">${team.name} (${team.code}) - ${team.score} баллов</option>`
        ).join('');
}

function quickAction(points, reason) {
    // В демо-режиме просто показываем уведомление
    showNotification(`Готово к начислению: ${points} баллов за "${reason}"`, 'success');
    
    // Автоматически заполняем форму
    document.getElementById('admin-points-input').value = points;
    document.getElementById('admin-reason-select').value = reason;
    
    // Прокручиваем к форме
    document.querySelector('.points-panel').scrollIntoView({ behavior: 'smooth' });
}

function adjustPoints(change) {
    const input = document.getElementById('admin-points-input');
    if (!input) return;
    
    let currentValue = parseInt(input.value) || 0;
    currentValue += change;
    
    // Ограничиваем значения
    if (currentValue < -100) currentValue = -100;
    if (currentValue > 1000) currentValue = 1000;
    
    input.value = currentValue;
}

async function adminAddPoints() {
    const teamId = parseInt(document.getElementById('admin-team-select').value);
    const points = parseInt(document.getElementById('admin-points-input').value);
    let reason = document.getElementById('admin-reason-select').value;
    const comment = document.getElementById('admin-comment').value.trim();
    
    if (!teamId || isNaN(points)) {
        showNotification('Выберите команду и укажите количество баллов', 'error');
        return;
    }
    
    if (reason === 'custom') {
        reason = document.getElementById('custom-reason').value.trim();
        if (!reason) {
            showNotification('Укажите причину начисления', 'error');
            return;
        }
    }
    
    if (CONFIG.DEMO_MODE) {
        // Демо-режим: обновляем локальные данные
        const team = CONFIG.DEMO_DATA.teams.find(t => t.id === teamId);
        if (team) {
            team.score += points;
            
            // Показываем уведомление
            showNotification(`Начислено ${points} баллов команде "${team.name}"`, 'success');
            
            // Обновляем интерфейс
            loadTeamsTable();
            populateTeamSelect();
            
            // Если текущий пользователь - эта команда, обновляем его данные
            if (state.currentTeam && state.currentTeam.id === teamId) {
                state.currentTeam.score = team.score;
                updateTeamStats();
                updateTeamPosition();
                loadRating();
            }
            
            // Сбрасываем форму
            document.getElementById('admin-points-input').value = 10;
            document.getElementById('admin-comment').value = '';
            document.getElementById('admin-reason-select').value = 'Активность';
        }
    } else {
        // Реальный режим: отправка на сервер
        // ... API call
    }
}

function selectTeamForPoints(teamId) {
    const select = document.getElementById('admin-team-select');
    if (select) {
        select.value = teamId;
        select.scrollIntoView({ behavior: 'smooth' });
    }
}

// ===== QR-КОДЫ =====
function showQRScanner() {
    const scanner = document.getElementById('qr-scanner');
    if (scanner) {
        scanner.style.display = 'block';
    }
}

function hideQRScanner() {
    const scanner = document.getElementById('qr-scanner');
    if (scanner) {
        scanner.style.display = 'none';
    }
}

function showTeamQR() {
    if (!state.currentTeam) return;
    
    const modal = document.getElementById('qr-modal');
    const qrContainer = document.getElementById('team-qr-code');
    
    if (modal && qrContainer) {
        // Генерируем простой QR-код (в реальном приложении используйте библиотеку)
        qrContainer.innerHTML = `
            <div style="width: 200px; height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">${state.currentTeam.code}</div>
                    <div style="font-size: 14px; color: #666;">${state.currentTeam.name}</div>
                </div>
            </div>
        `;
        
        openModal('qr-modal');
    }
}

// ===== МОДАЛЬНЫЕ ОКНА =====
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (modal && overlay) {
        modal.classList.add('active');
        overlay.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (modal) {
        modal.classList.remove('active');
    }
    
    if (overlay) {
        overlay.classList.remove('active');
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(message, type = 'info') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification-item ${type}`;
    notification.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">${type === 'error' ? '⚠️' : '✅'} ${message}</div>
        <div class="notification-time">Только что</div>
    `;
    
    // Добавляем в панель уведомлений
    const notificationList = document.getElementById('notification-list');
    if (notificationList) {
        notificationList.insertBefore(notification, notificationList.firstChild);
        
        // Обновляем счетчик
        updateNotificationBadge();
    }
    
    // Показываем временное уведомление
    showTemporaryNotification(message, type);
}

function showTemporaryNotification(message, type = 'info') {
    // Создаем временное уведомление
    const tempNotification = document.createElement('div');
    tempNotification.className = `notification ${type}`;
    tempNotification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-card);
        color: var(--text-primary);
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-xl);
        z-index: 2000;
        border-left: 4px solid ${type === 'error' ? 'var(--danger-color)' : type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'};
        transform: translateX(120%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    tempNotification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(tempNotification);
    
    // Анимация появления
    setTimeout(() => {
        tempNotification.style.transform = 'translateX(0)';
    }, 10);
    
    // Автоматическое скрытие
    setTimeout(() => {
        tempNotification.style.transform = 'translateX(120%)';
        setTimeout(() => {
            if (tempNotification.parentNode) {
                tempNotification.parentNode.removeChild(tempNotification);
            }
        }, 300);
    }, CONFIG.NOTIFICATION_DURATION);
}

function updateNotificationBadge() {
    const unreadCount = state.notifications.filter(n => !n.read).length;
    const badge = document.querySelector('.notification-btn .badge');
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// ===== УТИЛИТЫ =====
function showLoading(show) {
    // Реализуйте индикатор загрузки по необходимости
    if (show) {
        console.log('Loading started...');
    } else {
        console.log('Loading finished...');
    }
}

function getRandomColor(seed) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
        '#FF9FF3', '#F368E0', '#FF9F43', '#EE5A24', '#00D2D3', '#54A0FF'
    ];
    return colors[seed % colors.length];
}

function initDemoData() {
    // Обновляем демо-информацию в футере
    const totalPoints = CONFIG.DEMO_DATA.teams.reduce((sum, team) => sum + team.score, 0);
    const totalMembers = CONFIG.DEMO_DATA.teams.reduce((sum, team) => sum + team.members, 0);
    
    // Обновляем статистику в футере
    const statsElement = document.querySelector('.stats');
    if (statsElement) {
        statsElement.innerHTML = `
            <div class="stat">
                <i class="fas fa-users"></i>
                <span>${CONFIG.DEMO_DATA.teams.length} команд, ${totalMembers} участников</span>
            </div>
            <div class="stat">
                <i class="fas fa-bolt"></i>
                <span>${totalPoints} баллов начислено</span>
            </div>
        `;
    }
}

function updateFooterStats() {
    // Обновляем счетчики в реальном времени
    setInterval(() => {
        if (CONFIG.DEMO_MODE) {
            // В демо-режиме увеличиваем счетчики
            const pointsElement = document.querySelector('.stat:nth-child(2) span');
            if (pointsElement) {
                const currentPoints = parseInt(pointsElement.textContent) || 0;
                pointsElement.textContent = `${currentPoints + Math.floor(Math.random() * 10)} баллов начислено`;
            }
        }
    }, 30000); // Каждые 30 секунд
}

function startAutoRefresh() {
    // Автоматическое обновление данных
    setInterval(() => {
        if (state.currentTeam) {
            // Обновляем данные команды
            updateTeamStats();
            updateTeamPosition();
        } else if (state.isAdmin) {
            // Обновляем данные администратора
            updateAdminStats();
        }
    }, CONFIG.REFRESH_INTERVAL);
}

// ===== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ =====
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('admin-password');
    const toggleButton = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleButton.className = 'fas fa-eye';
    }
}

function manualCodeEntry() {
    hideQRScanner();
    document.getElementById('team-code').focus();
}

function showAchievementDetail(id) {
    const achievement = CONFIG.DEMO_DATA.achievements.find(a => a.id === id);
    if (achievement) {
        showNotification(`${achievement.earned ? 'Получено: ' : 'Не получено: '}${achievement.name} - ${achievement.desc}`);
    }
}

function showTaskDetail(taskId) {
    const task = CONFIG.DEMO_DATA.tasks.find(t => t.id === taskId) || CONFIG.DEMO_DATA.tasks[0];
    showNotification(`Задание: ${task.title}. Награда: ${task.reward} баллов. Время: ${task.time}`);
}

// Делаем функции глобальными для использования в HTML
window.switchRole = switchRole;
window.loginAsTeam = loginAsTeam;
window.loginAsAdmin = loginAsAdmin;
window.logout = logout;
window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.showSection = showSection;
window.toggleNotifications = toggleNotifications;
window.showQRScanner = showQRScanner;
window.hideQRScanner = hideQRScanner;
window.manualCodeEntry = manualCodeEntry;
window.showTeamQR = showTeamQR;
window.refreshMap = refreshMap;
window.quickAction = quickAction;
window.adjustPoints = adjustPoints;
window.adminAddPoints = adminAddPoints;
window.selectTeamForPoints = selectTeamForPoints;
window.togglePasswordVisibility = togglePasswordVisibility;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;