// === КОНФИГУРАЦИЯ РЕАЛЬНОГО РЕЖИМА ===
const CONFIG = {
  // Переключатель режима
  DEMO_MODE: false, // ИЗМЕНИТЕ НА false ДЛЯ РЕАЛЬНОГО РЕЖИМА
  
  // URL вашего Google Apps Script (ЗАМЕНИТЕ НА СВОЙ)
  API_URL: 'https://script.google.com/macros/s/AKfycbxTqAwe_PfNoqXBFuXkdcRkvR-p6EUSATCEJWbvIuv1yUhsoiURwrP8lreQSC5tuFz2pg/exec',
  
  // Альтернатива: прокси для обхода CORS (если нужно)
  USE_PROXY: false,
  PROXY_URL: 'https://corsproxy.io/?',
  
  // Настройки приложения
  REFRESH_INTERVAL: 10000, // 10 секунд
  CACHE_DURATION: 30000,   // 30 секунд
  
  // Цвета для команд (запасные)
  TEAM_COLORS: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
    '#FF9FF3', '#F368E0', '#FF9F43', '#EE5A24', '#00D2D3', '#54A0FF'
  ]
};

// === МОДУЛЬ API ===
const API = {
  // Генерация URL
  getUrl(action, params = {}) {
    let baseUrl = CONFIG.API_URL;
    
    if (CONFIG.USE_PROXY) {
      baseUrl = CONFIG.PROXY_URL + encodeURIComponent(CONFIG.API_URL);
    }
    
    const url = new URL(baseUrl);
    
    // Добавляем параметры
    if (action) url.searchParams.append('action', action);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    // Добавляем timestamp для избежания кеширования
    url.searchParams.append('_t', Date.now());
    
    return url.toString();
  },
  
  // Отправка запроса
  async request(action, params = {}, method = 'GET', body = null) {
    // Если демо-режим, используем локальные данные
    if (CONFIG.DEMO_MODE && window.DEMO_DATA) {
      return this.mockRequest(action, params, body);
    }
    
    const url = this.getUrl(action, method === 'GET' ? params : {});
    
    const options = {
      method: method,
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    try {
      console.log(`API ${action}:`, { url, params, body });
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown API error');
      }
      
      return data;
      
    } catch (error) {
      console.error(`API ${action} failed:`, error);
      
      // Фолбэк на демо-данные при ошибке
      if (!CONFIG.DEMO_MODE && window.DEMO_DATA) {
        console.warn('Falling back to demo data');
        return this.mockRequest(action, params, body);
      }
      
      throw error;
    }
  },
  
  // Мок-запрос для демо-режима
  mockRequest(action, params, body) {
    console.log(`Mock API: ${action}`, params);
    
    return new Promise((resolve) => {
      // Имитируем задержку сети
      setTimeout(() => {
        const data = this.getMockData(action, params, body);
        resolve(data);
      }, 300);
    });
  },
  
  // Демо-данные (сохраните ваш существующий демо-код здесь)
  getMockData(action, params, body) {
    // Ваш существующий код getMockData из предыдущего ответа
    // ... (оставьте без изменений)
  },
  
  // === КОНКРЕТНЫЕ API МЕТОДЫ ===
  
  // Авторизация
  async loginTeam(code) {
    return this.request('loginTeam', { code: code.toUpperCase() });
  },
  
  async loginAdmin(username, password) {
    return this.request('loginAdmin', { username, password });
  },
  
  // Команды
  async getTeams() {
    const cacheKey = 'teams_cache';
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      console.log('Using cached teams');
      return cached;
    }
    
    const data = await this.request('getTeams');
    
    if (data.success) {
      this.setCached(cacheKey, data, CONFIG.CACHE_DURATION);
    }
    
    return data;
  },
  
  async getTeam(idOrCode) {
    return this.request('getTeam', { id: idOrCode, code: idOrCode });
  },
  
  // Баллы
  async addPoints(teamId, points, reason, moderator, comment) {
    return this.request('addPoints', {}, 'POST', {
      teamId,
      points,
      reason,
      moderator,
      comment
    });
  },
  
  async getTransactions(teamId, limit = 20) {
    return this.request('getTransactions', { teamId, limit });
  },
  
  // Рейтинг
  async getRating() {
    const cacheKey = 'rating_cache';
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      console.log('Using cached rating');
      return cached;
    }
    
    const data = await this.request('getRating');
    
    if (data.success) {
      this.setCached(cacheKey, data, 5000); // Короткий кеш для рейтинга
    }
    
    return data;
  },
  
  // Задания
  async getTasks() {
    return this.request('getTasks');
  },
  
  // Ачивки
  async getAchievements() {
    return this.request('getAchievements');
  },
  
  // Уведомления
  async getNotifications(teamId, unreadOnly = false) {
    return this.request('getNotifications', { teamId, unreadOnly });
  },
  
  async markNotificationRead(notificationId) {
    // Реализуйте если нужно
    return { success: true };
  },
  
  // Статистика
  async getStats() {
    return this.request('getStats');
  },
  
  // Системные
  async healthCheck() {
    return this.request('healthCheck');
  },
  
  async getEventInfo() {
    return this.request('getEventInfo');
  },
  
  // === КЕШИРОВАНИЕ ===
  getCached(key) {
    const item = localStorage.getItem(`cache_${key}`);
    
    if (!item) return null;
    
    const { data, expires } = JSON.parse(item);
    
    if (Date.now() > expires) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
    
    return data;
  },
  
  setCached(key, data, duration) {
    const item = {
      data: data,
      expires: Date.now() + duration
    };
    
    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
  },
  
  clearCache() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
};

// === ОБНОВЛЕНИЕ ФУНКЦИЙ ПРИЛОЖЕНИЯ ===

// Замените все вызовы демо-функций на API вызовы:

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
    const result = await API.loginTeam(code);
    
    if (result.success) {
      state.currentTeam = result.team;
      state.authToken = result.token;
      
      localStorage.setItem('currentTeam', JSON.stringify(state.currentTeam));
      localStorage.setItem('playerName', playerName);
      localStorage.setItem('authToken', state.authToken);
      
      // Сохраняем имя игрока в состоянии команды
      state.currentTeam.playerName = playerName;
      
      switchScreen('team-screen');
      loadTeamDashboard();
      
      showNotification(`Добро пожаловать, ${playerName}!`, 'success');
      
      // Запускаем автообновление
      startAutoRefresh();
      
    } else {
      showNotification(result.error || 'Ошибка входа', 'error');
    }
    
  } catch (error) {
    console.error('Login error:', error);
    showNotification('Ошибка соединения с сервером', 'error');
  } finally {
    showLoading(false);
  }
}

async function loginAsAdmin() {
  const username = document.getElementById('admin-login').value.trim();
  const password = document.getElementById('admin-password').value;
  
  if (!username || !password) {
    showNotification('Заполните все поля', 'error');
    return;
  }
  
  showLoading(true);
  
  try {
    const result = await API.loginAdmin(username, password);
    
    if (result.success) {
      state.isAdmin = true;
      state.authToken = result.token;
      
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('authToken', state.authToken);
      localStorage.setItem('adminData', JSON.stringify(result.admin));
      
      switchScreen('admin-screen');
      loadAdminDashboard();
      
      showNotification(`Администратор: ${result.admin.username}`, 'success');
      
      // Запускаем автообновление
      startAutoRefresh();
      
    } else {
      showNotification(result.error || 'Ошибка входа', 'error');
    }
    
  } catch (error) {
    console.error('Admin login error:', error);
    showNotification('Ошибка соединения с сервером', 'error');
  } finally {
    showLoading(false);
  }
}

async function loadTeamDashboard() {
  if (!state.currentTeam) return;
  
  showLoading(true);
  
  try {
    // Параллельно загружаем все данные
    const [teamData, transactionsData, ratingData, notificationsData, statsData] = await Promise.all([
      API.getTeam(state.currentTeam.id || state.currentTeam.code),
      API.getTransactions(state.currentTeam.id, 10),
      API.getRating(),
      API.getNotifications(state.currentTeam.id, true),
      API.getTeamStats ? API.getTeamStats(state.currentTeam.id) : Promise.resolve({ success: true, stats: {} })
    ]);
    
    // Обновляем данные команды
    if (teamData.success && teamData.team) {
      state.currentTeam = { ...state.currentTeam, ...teamData.team };
      updateTeamUI(state.currentTeam);
    }
    
    // Обновляем историю
    if (transactionsData.success) {
      updateTransactionsUI(transactionsData.transactions || []);
    }
    
    // Обновляем рейтинг
    if (ratingData.success) {
      updateRatingUI(ratingData.rating || []);
    }
    
    // Обновляем уведомления
    if (notificationsData.success) {
      updateNotificationsUI(notificationsData.notifications || []);
    }
    
    // Обновляем статистику
    if (statsData.success) {
      updateStatsUI(statsData.stats || {});
    }
    
  } catch (error) {
    console.error('Dashboard load error:', error);
    showNotification('Ошибка загрузки данных', 'warning');
  } finally {
    showLoading(false);
  }
}

async function loadAdminDashboard() {
  showLoading(true);
  
  try {
    const [teamsData, ratingData, statsData, transactionsData] = await Promise.all([
      API.getTeams(),
      API.getRating(),
      API.getStats(),
      API.getAllTransactions ? API.getAllTransactions(20) : Promise.resolve({ success: true, transactions: [] })
    ]);
    
    // Обновляем список команд
    if (teamsData.success) {
      updateTeamsTable(teamsData.teams || []);
      populateTeamSelect(teamsData.teams || []);
    }
    
    // Обновляем рейтинг
    if (ratingData.success) {
      updateAdminRating(ratingData.rating || []);
    }
    
    // Обновляем статистику
    if (statsData.success) {
      updateAdminStats(statsData.stats || {});
    }
    
    // Обновляем последние транзакции
    if (transactionsData.success) {
      updateRecentTransactions(transactionsData.transactions || []);
    }
    
  } catch (error) {
    console.error('Admin dashboard error:', error);
    showNotification('Ошибка загрузки данных администратора', 'error');
  } finally {
    showLoading(false);
  }
}

async function adminAddPoints() {
  const teamId = parseInt(document.getElementById('admin-team-select').value);
  const points = parseInt(document.getElementById('admin-points-input').value);
  let reason = document.getElementById('admin-reason-select').value;
  const comment = document.getElementById('admin-comment').value.trim();
  const moderator = localStorage.getItem('adminData') ? 
    JSON.parse(localStorage.getItem('adminData')).username : 'Администратор';
  
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
  
  showLoading(true);
  
  try {
    const result = await API.addPoints(teamId, points, reason, moderator, comment);
    
    if (result.success) {
      showNotification(`Начислено ${points} баллов`, 'success');
      
      // Обновляем данные
      API.clearCache(); // Сбрасываем кеш
      loadAdminDashboard();
      
      // Сбрасываем форму
      document.getElementById('admin-points-input').value = 10;
      document.getElementById('admin-comment').value = '';
      document.getElementById('admin-reason-select').value = 'Активность';
      document.getElementById('custom-reason').style.display = 'none';
      
      // Если пользователь смотрит эту команду, обновляем его экран
      if (state.currentTeam && state.currentTeam.id === teamId) {
        loadTeamDashboard();
      }
      
    } else {
      showNotification(result.error || 'Ошибка начисления', 'error');
    }
    
  } catch (error) {
    console.error('Add points error:', error);
    showNotification('Ошибка соединения с сервером', 'error');
  } finally {
    showLoading(false);
  }
}

// === ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РЕАЛЬНОГО РЕЖИМА ===

// Проверка состояния сервера
async function checkServerStatus() {
  try {
    const result = await API.healthCheck();
    
    if (result.success) {
      console.log('Server status:', result.status);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Server check failed:', error);
    return false;
  }
}

// Автоматическое восстановление сессии
async function restoreSession() {
  const savedTeam = localStorage.getItem('currentTeam');
  const savedAdmin = localStorage.getItem('isAdmin');
  const savedToken = localStorage.getItem('authToken');
  
  // Проверяем состояние сервера
  const serverOnline = await checkServerStatus();
  
  if (!serverOnline && CONFIG.DEMO_MODE) {
    console.log('Server offline, using demo mode');
    CONFIG.DEMO_MODE = true;
    showNotification('Сервер недоступен. Используется демо-режим', 'warning');
  }
  
  if (savedTeam && serverOnline) {
    try {
      const team = JSON.parse(savedTeam);
      const playerName = localStorage.getItem('playerName');
      
      // Проверяем валидность сессии
      const result = await API.getTeam(team.id || team.code);
      
      if (result.success) {
        state.currentTeam = { ...team, ...result.team, playerName };
        switchScreen('team-screen');
        loadTeamDashboard();
        showNotification(`С возвращением, ${playerName || 'участник'}!`, 'success');
      } else {
        localStorage.removeItem('currentTeam');
      }
    } catch (error) {
      console.error('Session restore error:', error);
    }
  } else if (savedAdmin === 'true' && serverOnline) {
    state.isAdmin = true;
    switchScreen('admin-screen');
    loadAdminDashboard();
    showNotification('Сессия администратора восстановлена', 'info');
  }
}

// WebSocket для реального времени (опционально)
function initWebSocket() {
  if (CONFIG.DEMO_MODE) return;
  
  // Используем long-polling или WebSocket если настроено
  setInterval(async () => {
    if (state.currentTeam) {
      // Проверяем новые уведомления
      const result = await API.getNotifications(state.currentTeam.id, true);
      if (result.success && result.notifications.length > 0) {
        result.notifications.forEach(notif => {
          if (!notif.read) {
            showNotification(notif.message, notif.type || 'info');
          }
        });
      }
      
      // Обновляем данные каждые 30 секунд
      if (Date.now() - (state.lastUpdate || 0) > 30000) {
        loadTeamDashboard();
        state.lastUpdate = Date.now();
      }
    }
  }, 5000);
}

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', async function() {
  // Устанавливаем тему
  document.documentElement.setAttribute('data-theme', state.currentTheme);
  updateThemeButton();
  
  // Показываем статус подключения
  const statusElement = document.createElement('div');
  statusElement.id = 'connection-status';
  statusElement.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 12px;
    z-index: 9999;
    display: none;
  `;
  document.body.appendChild(statusElement);
  
  // Проверяем подключение
  const isOnline = await checkServerStatus();
  
  if (isOnline) {
    statusElement.textContent = '🟢 Онлайн';
    statusElement.style.background = '#10b981';
    statusElement.style.color = 'white';
    statusElement.style.display = 'block';
    
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, 3000);
  } else {
    statusElement.textContent = '🔴 Офлайн (демо)';
    statusElement.style.background = '#ef4444';
    statusElement.style.color = 'white';
    statusElement.style.display = 'block';
    
    CONFIG.DEMO_MODE = true;
    showNotification('Режим офлайн. Используются демо-данные', 'warning');
  }
  
  // Восстанавливаем сессию
  await restoreSession();
  
  // Инициализируем WebSocket/long-polling
  initWebSocket();
  
  // Запускаем автообновление
  startAutoRefresh();
});
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
