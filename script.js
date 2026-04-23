// script.js
// ============================================
// CHIMLA TABDEW - MULTI-TASK BLOCK ASSIGNMENT SYSTEM
// WITH USER AUTHENTICATION & ENHANCED EXCEL EXPORT
// WITH PERSISTENT SAVE & AUTO-SAVE ENTRY
// ============================================

// State Management
let taskList = [];
let currentUser = null;
let filteredHistoryData = [];
let productivityChart = null;
let moodChart = null;
let correlationChart = null;
let blockRatingsChart = null;
let distractionChart = null;
let notificationPermissionGranted = false;
let reminderCheckInterval = null;

// Multi-Task Block Assignment Storage
let blockTasksMap = {};
let blockCompletionMap = {};
let blockRatingMap = {};
let blockAssignmentFinished = false;

// Distraction Tracker State
let distractionLogs = {};

// Permanent backup for CSV download
let permanentHistoryBackup = [];

// Predefined distraction types
const distractionTypes = [
    { value: "📱 Social Media", label: "📱 Social Media" },
    { value: "📧 Email", label: "📧 Email" },
    { value: "📞 Phone Calls", label: "📞 Phone Calls" },
    { value: "💬 Messaging Apps", label: "💬 Messaging Apps" },
    { value: "🔊 Noise", label: "🔊 Noise" },
    { value: "💭 Daydreaming", label: "💭 Daydreaming" },
    { value: "🍽️ Eating/Snacking", label: "🍽️ Eating/Snacking" },
    { value: "📺 Videos/Streaming", label: "📺 Videos/Streaming" },
    { value: "🎮 Gaming", label: "🎮 Gaming" },
    { value: "😴 Fatigue", label: "😴 Fatigue" },
    { value: "✨ Other", label: "✨ Other" }
];

// ============================================
// USER AUTHENTICATION SYSTEM
// ============================================

function getUsers() {
    const users = localStorage.getItem('chimla_users');
    return users ? JSON.parse(users) : {};
}

function saveUsers(users) {
    localStorage.setItem('chimla_users', JSON.stringify(users));
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const tabs = document.querySelectorAll('.auth-tab');
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
        clearLoginError();
    } else {
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
        tabs[1].classList.add('active');
        tabs[0].classList.remove('active');
    }
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

function validateUsername(username) {
    if (!username) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Only letters, numbers, and underscores allowed';
    return null;
}

function validatePassword(password) {
    if (!password) return 'Password is required';
    if (password.length < 4) return 'Password must be at least 4 characters';
    return null;
}

document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('signup-username');
    if (usernameInput) {
        usernameInput.addEventListener('input', function() {
            const username = this.value;
            const hint = document.getElementById('username-hint');
            const users = getUsers();
            
            if (username.length < 3) {
                hint.textContent = '⏳ Min 3 characters';
                hint.className = 'input-hint';
            } else if (users[username]) {
                hint.textContent = '❌ Username already taken';
                hint.className = 'input-hint error';
            } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                hint.textContent = '❌ Only letters, numbers, and underscores';
                hint.className = 'input-hint error';
            } else {
                hint.textContent = '✅ Username available';
                hint.className = 'input-hint success';
            }
        });
    }
});

function signupUser() {
    const fullname = document.getElementById('signup-fullname').value.trim();
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    const termsChecked = document.getElementById('terms-checkbox').checked;
    
    if (!fullname) {
        showAlert('Please enter your full name', 'error');
        addShakeAnimation(document.getElementById('signup-fullname'));
        return;
    }
    
    const usernameError = validateUsername(username);
    if (usernameError) {
        showAlert(usernameError, 'error');
        addShakeAnimation(document.getElementById('signup-username'));
        return;
    }
    
    const passwordError = validatePassword(password);
    if (passwordError) {
        showAlert(passwordError, 'error');
        addShakeAnimation(document.getElementById('signup-password'));
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        addShakeAnimation(document.getElementById('signup-confirm'));
        return;
    }
    
    if (!termsChecked) {
        showAlert('Please agree to the Terms of Service', 'error');
        addShakeAnimation(document.getElementById('terms-checkbox'));
        return;
    }
    
    const users = getUsers();
    
    if (users[username]) {
        showAlert('Username already exists! Please choose another.', 'error');
        addShakeAnimation(document.getElementById('signup-username'));
        return;
    }
    
    const userId = 'user_' + Date.now();
    users[username] = {
        id: userId,
        fullname: fullname,
        username: username,
        password: btoa(password),
        createdAt: new Date().toISOString(),
        avatar: getRandomAvatar(),
        settings: {
            theme: 'auto',
            dailyReminder: false,
            reminderTime: '20:00'
        }
    };
    
    saveUsers(users);
    
    const userHistoryKey = `chimla_history_${username}`;
    if (!localStorage.getItem(userHistoryKey)) {
        localStorage.setItem(userHistoryKey, JSON.stringify([]));
    }
    
    showAlert(`✅ Account created successfully! Welcome ${fullname}!`, 'success');
    triggerConfetti();
    
    setTimeout(() => {
        performLogin(username, password);
    }, 500);
}

function getRandomAvatar() {
    const avatars = ['👨‍💻', '👩‍💻', '🧑‍💻', '🌟', '🎯', '📊', '⚡', '🎨', '🚀', '💪'];
    return avatars[Math.floor(Math.random() * avatars.length)];
}

function loginUser() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me')?.checked || false;
    
    if (!username) {
        showLoginError('Please enter your username');
        addShakeAnimation(document.getElementById('login-username'));
        return;
    }
    
    if (!password) {
        showLoginError('Please enter your password');
        addShakeAnimation(document.getElementById('login-password'));
        return;
    }
    
    performLogin(username, password, rememberMe);
}

function performLogin(username, password, rememberMe = false) {
    const users = getUsers();
    const user = users[username];
    
    if (!user) {
        showLoginError('Username not found. Please create an account first.');
        addShakeAnimation(document.getElementById('login-username'));
        return;
    }
    
    if (user.password !== btoa(password)) {
        showLoginError('Incorrect password. Please try again.');
        addShakeAnimation(document.getElementById('login-password'));
        return;
    }
    
    currentUser = user;
    
    if (rememberMe) {
        localStorage.setItem('chimla_remembered_user', JSON.stringify({
            username: user.username,
            remember: true
        }));
    } else {
        localStorage.removeItem('chimla_remembered_user');
    }
    
    sessionStorage.setItem('chimla_current_user', JSON.stringify(user));
    
    loadUserData(user.username);
    
    showAlert(`🎉 Welcome back, ${user.fullname}!`, 'success');
    
    updateDashboardUserInfo(user);
    
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-screen").classList.remove("hidden");
    
    document.getElementById("greeting-name").textContent = user.fullname.split(' ')[0];
    document.getElementById("current-date").textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' });
    document.getElementById('daily-quote').textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
    
    // Load saved persistent data
    loadPersistentData();
    
    setTimeout(() => { 
        autoGenerateBlocksManual(); 
        renderDistractionTrackerUI(); 
        addBackupButton();
        updateExportButton();
    }, 100);
    
    setupEventListeners();
    
    if (Notification.permission === "granted") { 
        showReminderSettings(); 
        setupLocalNotifications();
    }
    
    addWorkTimeSuggestionCard();
}

function showLoginError(message) {
    clearLoginError();
    
    const loginForm = document.getElementById('login-form');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'login-error';
    errorDiv.textContent = message;
    loginForm.insertBefore(errorDiv, loginForm.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

function clearLoginError() {
    const existingError = document.querySelector('.login-error');
    if (existingError) existingError.remove();
}

function loadUserData(username) {
    window.getHistory = function() {
        const history = localStorage.getItem(`chimla_history_${username}`);
        return history ? JSON.parse(history) : [];
    };
    
    const history = window.getHistory();
    if (history.length > 0) {
        permanentHistoryBackup = [...history];
    }
    
    const users = getUsers();
    const user = users[username];
    if (user && user.settings) {
        if (user.settings.theme) applyTheme(user.settings.theme);
        if (user.settings.dailyReminder) {
            document.getElementById('daily-reminder-toggle').checked = true;
        }
    }
}

function updateDashboardUserInfo(user) {
    const headerContent = document.querySelector('.header-content');
    if (headerContent && !document.querySelector('.user-info')) {
        const userInfoDiv = document.createElement('div');
        userInfoDiv.className = 'user-info';
        userInfoDiv.innerHTML = `
            <div class="user-details">
                <div class="user-name">${escapeHtml(user.fullname)}</div>
                <div class="user-status">@${escapeHtml(user.username)}</div>
            </div>
            <div class="user-avatar">${user.avatar}</div>
        `;
        headerContent.appendChild(userInfoDiv);
    }
}

function checkRememberedUser() {
    const remembered = localStorage.getItem('chimla_remembered_user');
    if (remembered) {
        try {
            const { username } = JSON.parse(remembered);
            if (username) {
                document.getElementById('login-username').value = username;
                document.getElementById('remember-me').checked = true;
            }
        } catch(e) {}
    }
}

function checkExistingSession() {
    const savedSession = sessionStorage.getItem('chimla_current_user');
    if (savedSession) {
        try {
            const user = JSON.parse(savedSession);
            if (user && user.username) {
                performLogin(user.username, atob(user.password), false);
                return true;
            }
        } catch(e) {}
    }
    return false;
}

function showTerms() {
    showAlert('Terms: Use responsibly. Your data stays private on your device.', 'info');
}

// ============================================
// PERSISTENT DATA STORAGE
// ============================================

function savePersistentData() {
    if (!currentUser) return;
    
    const persistentData = {
        taskList: taskList,
        blockTasksMap: blockTasksMap,
        blockCompletionMap: blockCompletionMap,
        blockRatingMap: blockRatingMap,
        distractionLogs: distractionLogs,
        mood: document.getElementById('selected-mood')?.value || '😊',
        totalHours: document.getElementById('total-hours')?.value || '6',
        blocks: document.getElementById('blocks')?.value || '3',
        blockTasksRaw: document.getElementById('block-tasks')?.value || '',
        comments: document.getElementById('comments')?.value || '',
        lastSaved: new Date().toISOString(),
        isCompleted: false
    };
    
    localStorage.setItem(`chimla_persistent_${currentUser.username}`, JSON.stringify(persistentData));
}

function loadPersistentData() {
    if (!currentUser) return false;
    
    const savedData = localStorage.getItem(`chimla_persistent_${currentUser.username}`);
    if (!savedData) return false;
    
    try {
        const data = JSON.parse(savedData);
        
        if (data.isCompleted) {
            return false;
        }
        
        const hasData = (data.taskList && data.taskList.length > 0) || 
                        Object.keys(data.blockTasksMap || {}).length > 0;
        
        if (!hasData) return false;
        
        if (data.taskList && Array.isArray(data.taskList) && data.taskList.length > 0) {
            taskList = data.taskList;
            updateTaskListUI();
            document.getElementById('tasks').value = taskList.join(', ');
        }
        
        if (data.blockTasksMap) blockTasksMap = data.blockTasksMap;
        if (data.blockCompletionMap) blockCompletionMap = data.blockCompletionMap;
        if (data.blockRatingMap) blockRatingMap = data.blockRatingMap;
        if (data.distractionLogs) distractionLogs = data.distractionLogs;
        
        if (data.mood) {
            document.getElementById('selected-mood').value = data.mood;
            document.querySelectorAll('.mood-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-mood') === data.mood) btn.classList.add('active');
            });
        }
        if (data.totalHours) document.getElementById('total-hours').value = data.totalHours;
        if (data.blocks) document.getElementById('blocks').value = data.blocks;
        if (data.blockTasksRaw) document.getElementById('block-tasks').value = data.blockTasksRaw;
        if (data.comments) document.getElementById('comments').value = data.comments;
        
        const restoreMsg = document.createElement('div');
        restoreMsg.style.cssText = `
            position: fixed; top: 100px; right: 20px; background: #10B981; color: white;
            padding: 12px 20px; border-radius: 12px; z-index: 10007;
            animation: slideInDown 0.3s ease-out; font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        restoreMsg.innerHTML = `📋 Restored your pending tasks from ${new Date(data.lastSaved).toLocaleTimeString()}`;
        document.body.appendChild(restoreMsg);
        setTimeout(() => restoreMsg.remove(), 4000);
        
        return true;
    } catch(e) {
        console.error('Error loading persistent data:', e);
        return false;
    }
}

function clearPersistentData() {
    if (!currentUser) return;
    localStorage.removeItem(`chimla_persistent_${currentUser.username}`);
}

// ============================================
// ANIMATION FUNCTIONS
// ============================================

function addPulseAnimation(element) {
    if (!element) return;
    element.classList.add('btn-pulse');
    setTimeout(() => {
        element.classList.remove('btn-pulse');
    }, 300);
}

function addShakeAnimation(element) {
    if (!element) return;
    element.classList.add('shake-animation');
    setTimeout(() => {
        element.classList.remove('shake-animation');
    }, 500);
}

function createRipple(event, element) {
    const button = element || event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'ripple-effect';
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

function triggerConfetti() {
    const colors = ['#1B4D3E', '#2A7F6F', '#D4A574', '#10B981', '#F59E0B'];
    
    for (let i = 0; i < 80; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 8 + 4 + 'px';
        confetti.style.height = Math.random() * 12 + 6 + 'px';
        confetti.style.opacity = Math.random() * 0.7 + 0.3;
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
    
    const celebration = document.createElement('div');
    celebration.className = 'celebration-message';
    celebration.innerHTML = '🎉 Amazing! High Productivity Day! 🎉';
    document.body.appendChild(celebration);
    setTimeout(() => {
        celebration.remove();
    }, 2500);
}

document.addEventListener('click', function(e) {
    const button = e.target.closest('.btn, .btn-primary, .btn-secondary, .btn-icon, .btn-sm, .btn-rate-block, .btn-complete-block');
    if (button && !button.classList.contains('no-ripple')) {
        createRipple(e, button);
    }
});

// ============================================
// TOOL GUIDE MODAL
// ============================================

function showToolGuide() {
    const modal = document.getElementById('tool-guide-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.animation = 'fadeIn 0.3s ease-out';
    }
}

function closeToolGuide() {
    const modal = document.getElementById('tool-guide-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

document.addEventListener('click', function(event) {
    const modal = document.getElementById('tool-guide-modal');
    const infoBox = document.querySelector('.info-box');
    if (modal && !modal.classList.contains('hidden')) {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent && !modalContent.contains(event.target) && event.target !== infoBox) {
            closeToolGuide();
        }
    }
});

// ============================================
// DARK/LIGHT MODE
// ============================================

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateThemeButtons('dark');
    } else if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        updateThemeButtons('light');
    } else {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const newTheme = systemPrefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', 'auto');
        updateThemeButtons(newTheme);
    }
}

function updateThemeButtons(currentTheme) {
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    const isDark = currentTheme === 'dark';
    toggleBtns.forEach(btn => {
        if (isDark) btn.innerHTML = '☀️ Light Mode';
        else btn.innerHTML = '🌙 Dark Mode';
    });
}

function getSavedTheme() { return localStorage.getItem('theme') || 'auto'; }

function initTheme() {
    const savedTheme = getSavedTheme();
    if (savedTheme === 'dark') applyTheme('dark');
    else if (savedTheme === 'light') applyTheme('light');
    else applyTheme('auto');
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (getSavedTheme() === 'auto') applyTheme('auto');
    });
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') { applyTheme('light'); showAlert('☀️ Light mode activated', 'success'); }
    else { applyTheme('dark'); showAlert('🌙 Dark mode activated', 'success'); }
}

// ============================================
// QUOTES & HELPERS
// ============================================
const quotes = [
    "Focus on being productive instead of busy.",
    "The secret of getting ahead is getting started.",
    "Your mind is for having ideas, not holding them.",
    "Done is better than perfect.",
    "Success is the sum of small efforts repeated day in and day out.",
    "The only way to do great work is to love what you do.",
    "Small progress is still progress.",
    "You don't have to see the whole staircase, just take the first step."
];

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setMood(mood, btn) {
    document.getElementById('selected-mood').value = mood;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (navigator.vibrate) navigator.vibrate(50);
    savePersistentData();
}

function showAlert(msg, type = "info") {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; padding: 16px 24px; 
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white; border-radius: 12px; z-index: 9999; animation: slideInUp 0.3s ease-out;
        font-weight: 600; max-width: 400px; box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    `;
    alertDiv.textContent = msg;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}

// ============================================
// AUTO-CALCULATED PRODUCTIVITY SCORE
// ============================================

function calculateAutoProductivityScore() {
    const ratedBlocks = Object.keys(blockRatingMap).filter(idx => blockCompletionMap[idx] === true && blockRatingMap[idx] !== null);
    if (ratedBlocks.length === 0) return null;
    let totalRating = 0;
    for (let idx of ratedBlocks) totalRating += blockRatingMap[idx];
    return Math.round((totalRating / ratedBlocks.length) * 10) / 10;
}

function updateAutoProductivityDisplay() {
    const score = calculateAutoProductivityScore();
    const scoreSpan = document.getElementById('auto-productivity-score');
    const breakdownSpan = document.getElementById('score-breakdown');
    const ratedBlocks = Object.keys(blockRatingMap).filter(idx => blockCompletionMap[idx] === true);
    if (score !== null && ratedBlocks.length > 0) {
        scoreSpan.textContent = score.toFixed(1);
        breakdownSpan.innerHTML = `✨ Based on ${ratedBlocks.length} rated block${ratedBlocks.length !== 1 ? 's' : ''} | Average rating: ${score.toFixed(1)}/10`;
    } else {
        scoreSpan.textContent = '—';
        breakdownSpan.innerHTML = 'Complete and rate blocks to see your productivity score';
    }
}

// ============================================
// AUTO GENERATE BLOCKS
// ============================================

function autoGenerateBlocksManual() {
    const totalHours = parseFloat(document.getElementById("total-hours").value) || 6;
    const blocksCount = parseInt(document.getElementById("blocks").value) || 3;
    if (blocksCount <= 0 || totalHours <= 0) {
        showAlert("Please enter valid number of blocks and hours", "error");
        return;
    }
    const hoursPerBlock = (totalHours / blocksCount).toFixed(1);
    let blockLabels = [];
    for (let i = 1; i <= blocksCount; i++) blockLabels.push(`Block ${i} (${hoursPerBlock}h)`);
    document.getElementById("block-tasks").value = blockLabels.join(", ");
    document.getElementById("block-tasks").style.borderColor = '#10B981';
    setTimeout(() => document.getElementById("block-tasks").style.borderColor = '', 1500);
    
    const hasData = Object.keys(blockTasksMap).length > 0 || taskList.length > 0;
    if (!hasData) {
        blockTasksMap = {};
        blockCompletionMap = {};
        blockRatingMap = {};
        distractionLogs = {};
        blockAssignmentFinished = false;
        document.getElementById('assignmentStatusMsg').innerHTML = '';
    }
    
    renderBlockAssignmentUI();
    renderDistractionTrackerUI();
    updateAutoProductivityDisplay();
    updateDistractionPatterns();
    savePersistentData();
}

function parseAndUpdateBlockTimes() {
    const blockInput = document.getElementById('block-tasks').value.trim();
    if (!blockInput) return;
    const blockParts = blockInput.split(',').map(s => s.trim());
    let updatedBlocks = [];
    blockParts.forEach((part, index) => {
        const timeMatch = part.match(/\(([\d.]+)h?\)/);
        let time = timeMatch ? parseFloat(timeMatch[1]) : null;
        if (time === null || isNaN(time)) {
            const totalHours = parseFloat(document.getElementById("total-hours").value) || 6;
            const blocksCount = parseInt(document.getElementById("blocks").value) || blockParts.length;
            time = parseFloat((totalHours / blocksCount).toFixed(1));
        }
        const blockName = part.replace(/\s*\([\d.]+\s*h?\)/, '').trim() || `Block ${index + 1}`;
        updatedBlocks.push(`${blockName} (${time}h)`);
    });
    document.getElementById('block-tasks').value = updatedBlocks.join(", ");
    savePersistentData();
}

function getBlockNameByIndex(idx) {
    const blockTasksRaw = document.getElementById('block-tasks').value;
    if (!blockTasksRaw) return `Block ${idx + 1}`;
    const parts = blockTasksRaw.split(',').map(s => s.trim());
    if (parts[idx]) return parts[idx].replace(/\s*\([\d.]+\s*h?\)/, '').trim();
    return `Block ${idx + 1}`;
}

// ============================================
// BLOCK ASSIGNMENT & RATING
// ============================================

function addTaskToBlock(blockIdx) {
    const select = document.getElementById(`block-select-${blockIdx}`);
    if (!select) return;
    const selectedTask = select.value;
    if (!selectedTask) { 
        const selectElement = document.getElementById(`block-select-${blockIdx}`);
        addShakeAnimation(selectElement);
        showAlert("Please select a task to add", "warning"); 
        return; 
    }
    if (!blockTasksMap[blockIdx]) blockTasksMap[blockIdx] = [];
    blockTasksMap[blockIdx].push({ taskName: selectedTask, rating: null });
    blockCompletionMap[blockIdx] = false;
    delete blockRatingMap[blockIdx];
    select.value = "";
    renderBlockAssignmentUI();
    updateAutoProductivityDisplay();
    showAlert(`✅ Added "${selectedTask}" to Block ${blockIdx + 1}`, "success");
    savePersistentData();
}

function removeTaskFromBlock(blockIdx, taskIdx) {
    if (blockTasksMap[blockIdx]) {
        const removedTask = blockTasksMap[blockIdx][taskIdx].taskName;
        blockTasksMap[blockIdx].splice(taskIdx, 1);
        if (blockTasksMap[blockIdx].length === 0) {
            blockCompletionMap[blockIdx] = false;
            delete blockRatingMap[blockIdx];
        } else {
            blockCompletionMap[blockIdx] = false;
            delete blockRatingMap[blockIdx];
        }
        renderBlockAssignmentUI();
        updateAutoProductivityDisplay();
        showAlert(`🗑️ Removed "${removedTask}" from Block ${blockIdx + 1}`, "warning");
        savePersistentData();
    }
}

function markBlockCompleted(blockIdx) {
    const tasks = blockTasksMap[blockIdx] || [];
    if (tasks.length === 0) {
        showAlert(`⚠️ Please add at least one task to Block ${blockIdx + 1} before completing.`, "error");
        return;
    }
    blockCompletionMap[blockIdx] = !blockCompletionMap[blockIdx];
    if (!blockCompletionMap[blockIdx]) {
        delete blockRatingMap[blockIdx];
        if (blockTasksMap[blockIdx]) blockTasksMap[blockIdx].forEach(t => t.rating = null);
        showAlert(`⏳ Block ${blockIdx + 1} marked as incomplete. Ratings cleared.`, "warning");
    } else {
        showAlert(`✅ Block ${blockIdx + 1} marked as completed! You can now rate each task.`, "success");
    }
    renderBlockAssignmentUI();
    updateAutoProductivityDisplay();
    savePersistentData();
    checkAndTriggerAutoSave();
}

function showRatingModalForBlock(blockIdx) {
    if (!blockCompletionMap[blockIdx]) {
        showAlert(`⚠️ Please complete Block ${blockIdx + 1} first before rating.`, "error");
        return;
    }
    const tasks = blockTasksMap[blockIdx] || [];
    if (tasks.length === 0) {
        showAlert(`⚠️ No tasks to rate in Block ${blockIdx + 1}.`, "error");
        return;
    }
    let modalHtml = `<div id="rating-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10001; backdrop-filter: blur(4px);"><div style="background: var(--card-bg); padding: 24px; border-radius: 20px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;"><h3 style="margin-bottom: 15px; color: var(--primary);">⭐ Rate Tasks in Block ${blockIdx + 1}</h3>`;
    tasks.forEach((task, tIdx) => {
        const currentRating = task.rating || 5;
        modalHtml += `<div style="margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;"><strong>${escapeHtml(task.taskName)}</strong><br><input type="range" id="rating-slider-${blockIdx}-${tIdx}" min="1" max="10" value="${currentRating}" style="width: 100%; margin-top: 8px;"><span id="rating-val-${blockIdx}-${tIdx}" style="display: inline-block; margin-top: 4px;">${currentRating}/10</span></div>`;
    });
    modalHtml += `<div style="display: flex; gap: 10px; margin-top: 20px;"><button onclick="saveBlockRatings(${blockIdx})" class="btn btn-primary">Save All Ratings</button><button onclick="closeRatingModal()" class="btn btn-secondary">Cancel</button></div></div></div>`;
    closeRatingModal();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    for (let tIdx = 0; tIdx < tasks.length; tIdx++) {
        const slider = document.getElementById(`rating-slider-${blockIdx}-${tIdx}`);
        const span = document.getElementById(`rating-val-${blockIdx}-${tIdx}`);
        if (slider && span) slider.oninput = () => { span.innerText = slider.value + "/10"; };
    }
}

function saveBlockRatings(blockIdx) {
    const tasks = blockTasksMap[blockIdx] || [];
    let totalRating = 0, ratedCount = 0;
    for (let tIdx = 0; tIdx < tasks.length; tIdx++) {
        const slider = document.getElementById(`rating-slider-${blockIdx}-${tIdx}`);
        if (slider) {
            const ratingVal = parseInt(slider.value);
            tasks[tIdx].rating = ratingVal;
            totalRating += ratingVal;
            ratedCount++;
        }
    }
    if (ratedCount > 0) blockRatingMap[blockIdx] = Math.round((totalRating / ratedCount) * 10) / 10;
    else blockRatingMap[blockIdx] = null;
    closeRatingModal();
    renderBlockAssignmentUI();
    updateAutoProductivityDisplay();
    savePersistentData();
    checkAndTriggerAutoSave();
}

function closeRatingModal() { const existingModal = document.getElementById('rating-modal-overlay'); if (existingModal) existingModal.remove(); }

function renderBlockAssignmentUI() {
    const blocksCount = parseInt(document.getElementById('blocks').value) || 1;
    const container = document.getElementById('blockAssignmentContainer');
    if (!container) return;
    if (taskList.length === 0) {
        container.innerHTML = `<div style="padding: 12px; background: var(--bg-light); border-radius: 12px; color: var(--text-muted);"><span>⚠️ Add at least one task above to assign to blocks.</span></div>`;
        document.getElementById('blockRatingSummary').style.display = 'none';
        return;
    }
    let html = '';
    for (let i = 0; i < blocksCount; i++) {
        const blockName = getBlockNameByIndex(i);
        const tasksInBlock = blockTasksMap[i] || [];
        const isCompleted = blockCompletionMap[i] || false;
        const avgRating = blockRatingMap[i] || null;
        html += `<div class="block-assign-row" style="border-left: 4px solid ${isCompleted ? '#10B981' : 'var(--primary)'};">
            <div class="block-header"><span class="block-name">📌 ${escapeHtml(blockName)}</span><button type="button" class="btn-complete-block ${isCompleted ? 'completed' : ''}" onclick="markBlockCompleted(${i})" style="background: ${isCompleted ? '#10B981' : '#D4A574'};">${isCompleted ? '✅ Completed' : '⏳ Mark Block Done'}</button></div>
            <div class="multi-task-container">${tasksInBlock.map((t, tIdx) => `<span class="task-tag">${escapeHtml(t.taskName)} ${t.rating ? `⭐${t.rating}/10` : '📝'}<span class="task-tag-remove" onclick="removeTaskFromBlock(${i}, ${tIdx})">✕</span></span>`).join('')}${tasksInBlock.length === 0 ? '<span style="color: var(--text-muted); font-size: 0.8rem;">No tasks added yet</span>' : ''}</div>
            <div class="add-task-to-block"><select id="block-select-${i}" class="task-selector"><option value="">— Add a task —</option>${taskList.map(task => `<option value="${escapeHtml(task)}">${escapeHtml(task)}</option>`).join('')}</select><button type="button" class="btn-sm btn-secondary" onclick="addTaskToBlock(${i})">➕ Add Task</button></div>
            <div style="margin-top: 12px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">${!isCompleted ? `<button type="button" class="btn-rate-block" disabled style="opacity: 0.5; cursor: not-allowed;">⭐ Rate Block (complete first)</button>` : `<button type="button" class="btn-rate-block" onclick="showRatingModalForBlock(${i})">${avgRating ? `⭐ Rate (${avgRating}/10)` : '⭐ Rate Block'}</button>`}${avgRating ? `<span class="rating-badge ${avgRating >= 8 ? 'rating-high' : avgRating >= 5 ? 'rating-medium' : 'rating-low'}">Avg: ${avgRating}/10</span>` : ''}</div>
        </div>`;
    }
    container.innerHTML = html;
    updateRatingSummary();
    updateAutoProductivityDisplay();
}

function updateRatingSummary() {
    const summaryDiv = document.getElementById('blockRatingSummary');
    const summaryTextDiv = document.getElementById('ratingsSummaryText');
    if (!summaryDiv) return;
    const ratedBlocks = Object.keys(blockRatingMap).filter(idx => blockRatingMap[idx] !== null);
    if (ratedBlocks.length > 0) {
        summaryDiv.style.display = 'block';
        let summary = '';
        for (let idx of ratedBlocks) {
            const rating = blockRatingMap[idx];
            const ratingClass = rating >= 8 ? 'rating-high' : (rating >= 5 ? 'rating-medium' : 'rating-low');
            summary += `<span class="rating-badge ${ratingClass}" style="margin-right: 8px; margin-bottom: 5px; display: inline-block;">Block ${parseInt(idx) + 1}: ${rating}/10</span>`;
        }
        summaryTextDiv.innerHTML = summary;
    } else summaryDiv.style.display = 'none';
}

function showAllRatingsModal() {
    let ratingsHtml = '<div style="max-height: 400px; overflow-y: auto;"><h3 style="margin-bottom: 15px;">⭐ Block Ratings Summary</h3>';
    for (let i = 0; i < Object.keys(blockTasksMap).length; i++) {
        const tasks = blockTasksMap[i];
        if (tasks && tasks.length > 0) {
            const isCompleted = blockCompletionMap[i] || false;
            const avgRating = blockRatingMap[i] || 'Not rated';
            const ratingClass = (avgRating !== 'Not rated' && avgRating >= 8) ? 'rating-high' : (avgRating !== 'Not rated' && avgRating >= 5) ? 'rating-medium' : 'rating-low';
            ratingsHtml += `<div style="padding: 12px; margin-bottom: 10px; background: var(--bg-light); border-radius: 10px; border-left: 4px solid ${isCompleted ? '#10B981' : 'var(--primary)'};"><strong>Block ${i+1}:</strong><br>${tasks.map(t => `• ${escapeHtml(t.taskName)} ${t.rating ? `⭐${t.rating}/10` : '📝 Not rated'}`).join('<br>')}<br><span style="font-size: 0.85rem; color: var(--text-muted);">${isCompleted ? '✅ Completed' : '⏳ Not completed'}</span><br><span class="rating-badge ${ratingClass}" style="margin-top: 5px; display: inline-block;">⭐ ${avgRating === 'Not rated' ? 'Not rated' : avgRating + '/10'}</span></div>`;
        }
    }
    ratingsHtml += '</div><button onclick="closeRatingsModal()" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Close</button>';
    const modalHtml = `<div id="ratings-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10001; backdrop-filter: blur(4px);"><div style="background: var(--card-bg); padding: 30px; border-radius: 20px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">${ratingsHtml}</div></div>`;
    closeRatingsModal();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeRatingsModal() { const existingModal = document.getElementById('ratings-modal-overlay'); if (existingModal) existingModal.remove(); }

function resetAllBlockAssignments() {
    if (confirm('Are you sure you want to reset all block assignments and ratings?')) {
        blockTasksMap = {};
        blockCompletionMap = {};
        blockRatingMap = {};
        blockAssignmentFinished = false;
        document.getElementById('assignmentStatusMsg').innerHTML = '';
        renderBlockAssignmentUI();
        updateAutoProductivityDisplay();
        showAlert('🔄 All block assignments and ratings have been reset', 'success');
        savePersistentData();
    }
}

// ============================================
// DISTRACTION TRACKER FUNCTIONS
// ============================================

function renderDistractionTrackerUI() {
    const blocksCount = parseInt(document.getElementById('blocks').value) || 1;
    const container = document.getElementById('distractionBlocksContainer');
    if (!container) return;
    if (Object.keys(blockTasksMap).length === 0 && taskList.length === 0) {
        container.innerHTML = `<div style="padding: 12px; background: var(--bg-light); border-radius: 12px; color: var(--text-muted); text-align: center;"><span>📝 Add tasks to blocks first, then track distractions here</span></div>`;
        return;
    }
    let html = '';
    for (let i = 0; i < blocksCount; i++) {
        const blockName = getBlockNameByIndex(i);
        const blockDistractions = distractionLogs[i] || [];
        html += `<div class="distraction-block-row">
            <div class="distraction-header"><span>📌 ${escapeHtml(blockName)}</span><span class="distraction-badge">${blockDistractions.length} distraction${blockDistractions.length !== 1 ? 's' : ''}</span></div>
            <div class="distraction-list" id="distraction-list-${i}">${blockDistractions.map((d, dIdx) => `<span class="distraction-tag">${escapeHtml(d.distractionType)}${d.customText ? `: ${escapeHtml(d.customText)}` : ''}<span class="distraction-tag-remove" onclick="removeDistraction(${i}, ${dIdx})">✕</span></span>`).join('')}${blockDistractions.length === 0 ? '<span style="color: var(--text-muted); font-size: 0.75rem;">No distractions logged for this block</span>' : ''}</div>
            <select id="distraction-select-${i}" class="distraction-select" onchange="handleDistractionSelectChange(${i})"><option value="">— What distracted you? —</option>${distractionTypes.map(d => `<option value="${escapeHtml(d.value)}">${escapeHtml(d.label)}</option>`).join('')}</select>
            <div class="distraction-custom-input" id="custom-distraction-${i}" style="display: none;"><input type="text" id="custom-text-${i}" placeholder="Describe the distraction..." class="form-input"><button type="button" class="btn-sm btn-primary" onclick="addCustomDistraction(${i})">Add</button></div>
            <div style="margin-top: 8px; display: flex; gap: 8px;"><button type="button" class="btn-sm btn-secondary" onclick="addSelectedDistraction(${i})">➕ Add Selected</button><button type="button" class="btn-sm btn-secondary" onclick="toggleCustomInput(${i})">✏️ Add Custom</button></div>
        </div>`;
    }
    container.innerHTML = html;
}

function handleDistractionSelectChange(blockIdx) {
    const select = document.getElementById(`distraction-select-${blockIdx}`);
    if (select && select.value === '✨ Other') {
        document.getElementById(`custom-distraction-${blockIdx}`).style.display = 'flex';
    } else if (select) {
        document.getElementById(`custom-distraction-${blockIdx}`).style.display = 'none';
    }
}

function addSelectedDistraction(blockIdx) {
    const select = document.getElementById(`distraction-select-${blockIdx}`);
    if (!select || !select.value) { 
        addShakeAnimation(select);
        showAlert("Please select a distraction type", "warning"); 
        return; 
    }
    if (!distractionLogs[blockIdx]) distractionLogs[blockIdx] = [];
    distractionLogs[blockIdx].push({ distractionType: select.value, customText: null });
    select.value = "";
    document.getElementById(`custom-distraction-${blockIdx}`).style.display = 'none';
    renderDistractionTrackerUI();
    updateDistractionPatterns();
    showAlert(`🚫 Added distraction: ${select.options[select.selectedIndex]?.text || select.value}`, "success");
    savePersistentData();
}

function addCustomDistraction(blockIdx) {
    const input = document.getElementById(`custom-text-${blockIdx}`);
    const customText = input.value.trim();
    if (!customText) { 
        addShakeAnimation(input);
        showAlert("Please describe the distraction", "warning"); 
        return; 
    }
    if (!distractionLogs[blockIdx]) distractionLogs[blockIdx] = [];
    distractionLogs[blockIdx].push({ distractionType: customText, customText: customText });
    input.value = "";
    document.getElementById(`custom-distraction-${blockIdx}`).style.display = 'none';
    renderDistractionTrackerUI();
    updateDistractionPatterns();
    showAlert(`🚫 Added custom distraction: ${customText}`, "success");
    savePersistentData();
}

function removeDistraction(blockIdx, distractionIdx) {
    if (distractionLogs[blockIdx]) {
        distractionLogs[blockIdx].splice(distractionIdx, 1);
        renderDistractionTrackerUI();
        updateDistractionPatterns();
        showAlert(`🗑️ Removed distraction`, "warning");
        savePersistentData();
    }
}

function toggleCustomInput(blockIdx) {
    const customDiv = document.getElementById(`custom-distraction-${blockIdx}`);
    if (customDiv) customDiv.style.display = customDiv.style.display === 'none' ? 'flex' : 'none';
}

function updateDistractionPatterns() {
    const allDistractions = [];
    for (let blockIdx in distractionLogs) if (distractionLogs[blockIdx]) allDistractions.push(...distractionLogs[blockIdx]);
    const patternsCard = document.getElementById('distractionPatternsCard');
    const patternsText = document.getElementById('distractionPatternsText');
    const suggestionsText = document.getElementById('distractionSuggestionsText');
    if (allDistractions.length === 0) { patternsCard.style.display = 'none'; return; }
    patternsCard.style.display = 'block';
    const freq = {};
    allDistractions.forEach(d => freq[d.distractionType] = (freq[d.distractionType] || 0) + 1);
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const topDistractions = sorted.slice(0, 3);
    patternsText.innerHTML = `<strong>Top distractions today:</strong> ${topDistractions.map(d => `${d[0]} (${d[1]}x)`).join(', ')}`;
    let suggestions = [];
    const typesLower = allDistractions.map(d => d.distractionType.toLowerCase());
    if (typesLower.some(d => d.includes('social') || d.includes('media'))) suggestions.push("📱 Use website blockers or schedule specific social media breaks");
    if (typesLower.some(d => d.includes('phone') || d.includes('call'))) suggestions.push("📞 Put your phone on Do Not Disturb mode during work blocks");
    if (typesLower.some(d => d.includes('noise'))) suggestions.push("🔊 Try noise-cancelling headphones or ambient focus music");
    if (typesLower.some(d => d.includes('message') || d.includes('chat'))) suggestions.push("💬 Close messaging apps and set status to 'Focusing'");
    if (typesLower.some(d => d.includes('fatigue') || d.includes('tired'))) suggestions.push("😴 Take a 5-minute break, hydrate, or stretch");
    if (typesLower.some(d => d.includes('email'))) suggestions.push("📧 Schedule specific times for checking emails");
    if (suggestions.length === 0) suggestions.push("🎯 Try the Pomodoro technique: 25 min focus, 5 min break");
    suggestionsText.innerHTML = `<strong>💡 Suggestions to minimize distractions:</strong><br>• ${suggestions.join('<br>• ')}`;
}

function showDistractionInsightsModal() {
    const allDistractions = [];
    for (let blockIdx in distractionLogs) if (distractionLogs[blockIdx]) allDistractions.push(...distractionLogs[blockIdx]);
    if (allDistractions.length === 0) { showAlert("No distractions logged yet", "warning"); return; }
    const blockDistractionCount = {};
    for (let blockIdx in distractionLogs) if (distractionLogs[blockIdx]) blockDistractionCount[`Block ${parseInt(blockIdx) + 1}`] = distractionLogs[blockIdx].length;
    const freq = {};
    allDistractions.forEach(d => freq[d.distractionType] = (freq[d.distractionType] || 0) + 1);
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const recommendations = [];
    const typesLower = allDistractions.map(d => d.distractionType.toLowerCase());
    if (typesLower.some(t => t.includes('social'))) recommendations.push("Use app blockers during work hours (Freedom, Cold Turkey)");
    if (typesLower.some(t => t.includes('phone'))) recommendations.push("Keep phone in another room or use Focus Mode");
    if (typesLower.some(t => t.includes('noise'))) recommendations.push("Create a dedicated quiet workspace or use white noise");
    if (typesLower.some(t => t.includes('message'))) recommendations.push("Set specific 'office hours' for responding to messages");
    if (recommendations.length === 0) recommendations.push("Try the Pomodoro technique (25 min work, 5 min break)");
    const insightsHtml = `<div style="max-height: 400px; overflow-y: auto;"><h3 style="margin-bottom: 15px;">🚫 Distraction Insights</h3><div style="margin-bottom: 20px;"><h4>📊 Distraction Breakdown</h4><ul style="list-style: none; padding-left: 0;">${sorted.map(([type, count]) => `<li style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">${type}: ${count} time${count !== 1 ? 's' : ''}</li>`).join('')}</ul></div><div style="margin-bottom: 20px;"><h4>📌 By Block</h4><ul style="list-style: none; padding-left: 0;">${Object.entries(blockDistractionCount).map(([block, count]) => `<li style="padding: 4px 0;">${block}: ${count} distraction${count !== 1 ? 's' : ''}</li>`).join('')}</ul></div><div style="padding: 12px; background: rgba(245,158,11,0.1); border-radius: 10px;"><h4>💡 Recommendations</h4><ul style="margin-left: 20px;">${recommendations.map(r => `<li>${r}</li>`).join('')}</ul></div><button onclick="closeDistractionInsightsModal()" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Close</button></div>`;
    const modalHtml = `<div id="distraction-insights-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10002; backdrop-filter: blur(4px);"><div style="background: var(--card-bg); padding: 24px; border-radius: 20px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">${insightsHtml}</div></div>`;
    closeDistractionInsightsModal();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeDistractionInsightsModal() { const modal = document.getElementById('distraction-insights-modal'); if (modal) modal.remove(); }

// ============================================
// TASK MANAGEMENT
// ============================================

function addTask() {
    const input = document.getElementById('task-input');
    const val = input.value.trim();
    if (val) {
        if (taskList.includes(val)) { 
            addShakeAnimation(input);
            showAlert("⚠️ Task already exists!", "warning"); 
            return; 
        }
        taskList.push(val);
        updateTaskListUI();
        input.value = '';
        input.focus();
        document.getElementById('tasks').value = taskList.join(', ');
        renderBlockAssignmentUI();
        renderDistractionTrackerUI();
        blockAssignmentFinished = false;
        document.getElementById('assignmentStatusMsg').innerHTML = '';
        const taskListElement = document.getElementById('task-checklist');
        if (taskListElement) {
            taskListElement.classList.add('task-bounce');
            setTimeout(() => taskListElement.classList.remove('task-bounce'), 300);
        }
        savePersistentData();
    } else {
        addShakeAnimation(input);
        showAlert("Please enter a task", "warning");
    }
}

function updateTaskListUI() {
    const list = document.getElementById('task-checklist');
    list.innerHTML = taskList.map((t, i) => `<li><span>${escapeHtml(t)}</span><span class="delete-task" onclick="removeTask(${i})">✕</span></li>`).join('');
}

function removeTask(index) {
    const removedTask = taskList[index];
    taskList.splice(index, 1);
    updateTaskListUI();
    document.getElementById('tasks').value = taskList.join(', ');
    for (let blockIdx in blockTasksMap) {
        blockTasksMap[blockIdx] = blockTasksMap[blockIdx].filter(t => t.taskName !== removedTask);
        if (blockTasksMap[blockIdx].length === 0) {
            blockCompletionMap[blockIdx] = false;
            delete blockRatingMap[blockIdx];
        } else {
            blockCompletionMap[blockIdx] = false;
            delete blockRatingMap[blockIdx];
        }
    }
    renderBlockAssignmentUI();
    updateAutoProductivityDisplay();
    showAlert(`🗑️ Removed "${removedTask}"`, "warning");
    savePersistentData();
}

// ============================================
// AUTO-SAVE ENTRY WHEN ALL BLOCKS COMPLETED AND RATED
// ============================================

function checkAndTriggerAutoSave() {
    if (!currentUser) return;
    
    const blocksCount = parseInt(document.getElementById('blocks')?.value) || 1;
    
    // Check if all blocks have tasks
    let hasMissingTasks = false;
    for (let i = 0; i < blocksCount; i++) {
        if (!blockTasksMap[i] || blockTasksMap[i].length === 0) {
            hasMissingTasks = true;
            break;
        }
    }
    if (hasMissingTasks) return;
    
    // Check if all blocks are completed AND all tasks are rated
    let allCompleted = true;
    let allRated = true;
    for (let i = 0; i < blocksCount; i++) {
        if (!blockCompletionMap[i]) {
            allCompleted = false;
            break;
        }
        if (blockTasksMap[i]) {
            const hasUnratedTask = blockTasksMap[i].some(task => !task.rating);
            if (hasUnratedTask) allRated = false;
        }
    }
    
    console.log("Auto-save check - All completed:", allCompleted, "All rated:", allRated);
    
    // Auto-save when ALL blocks are completed AND all tasks are rated
    if (allCompleted && allRated) {
        // Check if already auto-saved today
        const today = new Date().toLocaleDateString();
        const lastAutoSaveKey = `chimla_autosave_${currentUser.username}_${today}`;
        if (localStorage.getItem(lastAutoSaveKey)) {
            console.log("Already auto-saved today, skipping");
            return;
        }
        
        console.log("TRIGGERING AUTO-SAVE!");
        
        // Show auto-save notification
        const autoSaveMsg = document.createElement('div');
        autoSaveMsg.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: #10B981; color: white;
            padding: 12px 20px; border-radius: 12px; z-index: 10007;
            animation: slideInDown 0.3s ease-out; font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        autoSaveMsg.innerHTML = '✨ All blocks completed and rated! Auto-saving entry... ✨';
        document.body.appendChild(autoSaveMsg);
        setTimeout(() => autoSaveMsg.remove(), 3000);
        
        // Perform auto-save
        performAutoSave();
        
        // Mark that auto-save happened today
        localStorage.setItem(lastAutoSaveKey, new Date().toISOString());
    }
}

function performAutoSave() {
    if (!currentUser) return;
    
    const blocksCount = parseInt(document.getElementById('blocks').value) || 1;
    
    const autoScore = calculateAutoProductivityScore();
    const finalProductivity = autoScore !== null ? autoScore : 5;
    
    if (finalProductivity >= 8) {
        triggerConfetti();
    }
    
    const blockMultiTasksData = {};
    for (let i = 0; i < blocksCount; i++) {
        if (blockTasksMap[i]) {
            blockMultiTasksData[i] = blockTasksMap[i].map(t => ({ 
                taskName: t.taskName, 
                rating: t.rating 
            }));
        }
    }
    
    const distractionData = {};
    for (let i = 0; i < blocksCount; i++) {
        if (distractionLogs[i] && distractionLogs[i].length > 0) {
            distractionData[i] = [...distractionLogs[i]];
        }
    }
    
    const entry = {
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-GB'),
        mood: document.getElementById('selected-mood').value,
        tasks: taskList.join(', '),
        totalHours: parseFloat(document.getElementById('total-hours').value),
        blocks: blocksCount,
        blockMultiTasks: blockMultiTasksData,
        blockCompletionMap: JSON.parse(JSON.stringify(blockCompletionMap)),
        blockRatingMap: JSON.parse(JSON.stringify(blockRatingMap)),
        productivity: finalProductivity,
        comments: document.getElementById('comments').value,
        distractions: distractionData
    };
    
    let history = getHistory();
    history.push(entry);
    localStorage.setItem(`chimla_history_${currentUser.username}`, JSON.stringify(history));
    
    permanentHistoryBackup = [...history];
    
    showAlert(`✅ Auto-saved! Productivity score: ${finalProductivity}/10`, 'success');
    
    // Clear persistent data after successful auto-save
    clearPersistentData();
    
    // Reset form for next entry
    resetFormAfterAutoSave();
}

function resetFormAfterAutoSave() {
    document.getElementById('selected-mood').value = '😊';
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-mood="😊"]').classList.add('active');
    taskList = [];
    updateTaskListUI();
    document.getElementById('tasks').value = '';
    document.getElementById('total-hours').value = '6';
    document.getElementById('blocks').value = '3';
    document.getElementById('comments').value = '';
    blockTasksMap = {};
    blockCompletionMap = {};
    blockRatingMap = {};
    distractionLogs = {};
    blockAssignmentFinished = false;
    document.getElementById('assignmentStatusMsg').innerHTML = '';
    setTimeout(() => { 
        autoGenerateBlocksManual(); 
        renderBlockAssignmentUI();
        renderDistractionTrackerUI(); 
    }, 100);
    updateAutoProductivityDisplay();
    updateDistractionPatterns();
}

// ============================================
// SAVE ENTRY (Manual save)
// ============================================

function saveEntry() {
    if (!currentUser) {
        showAlert('Please login first', 'error');
        return;
    }
    
    const saveButton = document.getElementById('saveEntryBtn');
    addPulseAnimation(saveButton);
    
    const blocksCount = parseInt(document.getElementById('blocks').value) || 1;
    const missingBlocks = [], uncompletedBlocks = [];
    
    for (let i = 0; i < blocksCount; i++) {
        if (!blockTasksMap[i] || blockTasksMap[i].length === 0) missingBlocks.push(i + 1);
        else if (!blockCompletionMap[i]) uncompletedBlocks.push(i + 1);
    }
    
    if (missingBlocks.length > 0) { 
        const missingBlocksElement = document.getElementById('blockAssignmentSection');
        addShakeAnimation(missingBlocksElement);
        showAlert(`⚠️ Please add tasks to Block(s) ${missingBlocks.join(', ')}.`, "error"); 
        return; 
    }
    
    let allRated = true;
    for (let i = 0; i < blocksCount; i++) {
        if (blockTasksMap[i]) {
            const hasUnratedTask = blockTasksMap[i].some(task => !task.rating);
            if (hasUnratedTask) allRated = false;
        }
    }
    
    if (!allRated) {
        showAlert(`⚠️ Please rate all tasks in completed blocks before saving.`, "error");
        return;
    }
    
    if (uncompletedBlocks.length > 0) { 
        showAlert(`⚠️ Please mark Block(s) ${uncompletedBlocks.join(', ')} as completed.`, "error"); 
        return; 
    }
    
    const autoScore = calculateAutoProductivityScore();
    const finalProductivity = autoScore !== null ? autoScore : 5;
    
    if (finalProductivity >= 8) {
        triggerConfetti();
    }
    
    const blockMultiTasksData = {};
    for (let i = 0; i < blocksCount; i++) {
        if (blockTasksMap[i]) {
            blockMultiTasksData[i] = blockTasksMap[i].map(t => ({ 
                taskName: t.taskName, 
                rating: t.rating 
            }));
        }
    }
    
    const distractionData = {};
    for (let i = 0; i < blocksCount; i++) {
        if (distractionLogs[i] && distractionLogs[i].length > 0) {
            distractionData[i] = [...distractionLogs[i]];
        }
    }
    
    const entry = {
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-GB'),
        mood: document.getElementById('selected-mood').value,
        tasks: taskList.join(', '),
        totalHours: parseFloat(document.getElementById('total-hours').value),
        blocks: blocksCount,
        blockMultiTasks: blockMultiTasksData,
        blockCompletionMap: JSON.parse(JSON.stringify(blockCompletionMap)),
        blockRatingMap: JSON.parse(JSON.stringify(blockRatingMap)),
        productivity: finalProductivity,
        comments: document.getElementById('comments').value,
        distractions: distractionData
    };
    
    let history = getHistory();
    history.push(entry);
    localStorage.setItem(`chimla_history_${currentUser.username}`, JSON.stringify(history));
    
    permanentHistoryBackup = [...history];
    
    showAlert(`✅ Entry saved successfully! Productivity score: ${finalProductivity}/10`, 'success');
    
    clearPersistentData();
    resetForm();
}

function resetForm() {
    document.getElementById('selected-mood').value = '😊';
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-mood="😊"]').classList.add('active');
    taskList = [];
    updateTaskListUI();
    document.getElementById('tasks').value = '';
    document.getElementById('total-hours').value = '6';
    document.getElementById('blocks').value = '3';
    document.getElementById('comments').value = '';
    blockTasksMap = {};
    blockCompletionMap = {};
    blockRatingMap = {};
    distractionLogs = {};
    blockAssignmentFinished = false;
    document.getElementById('assignmentStatusMsg').innerHTML = '';
    setTimeout(() => { 
        autoGenerateBlocksManual(); 
        renderBlockAssignmentUI();
        renderDistractionTrackerUI(); 
    }, 100);
    updateAutoProductivityDisplay();
    updateDistractionPatterns();
    savePersistentData();
}

function getHistory() { 
    if (!currentUser) return [];
    const stored = localStorage.getItem(`chimla_history_${currentUser.username}`); 
    if (!stored) return [];
    return JSON.parse(stored); 
}

function setupEventListeners() {
    const blocksInput = document.getElementById('blocks');
    const hoursInput = document.getElementById('total-hours');
    const blockTasksInput = document.getElementById('block-tasks');
    if (blocksInput) blocksInput.addEventListener('change', () => { autoGenerateBlocksManual(); renderDistractionTrackerUI(); });
    if (hoursInput) hoursInput.addEventListener('change', () => { autoGenerateBlocksManual(); renderDistractionTrackerUI(); });
    if (blockTasksInput) {
        blockTasksInput.addEventListener('change', () => { parseAndUpdateBlockTimes(); renderDistractionTrackerUI(); });
        blockTasksInput.addEventListener('blur', () => { parseAndUpdateBlockTimes(); renderDistractionTrackerUI(); });
    }
}

function logout() {
    sessionStorage.removeItem('chimla_current_user');
    currentUser = null;
    document.getElementById("main-screen").classList.add("hidden");
    document.getElementById("history-screen").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("login-username").value = '';
    document.getElementById("login-password").value = '';
    document.getElementById("signup-fullname").value = '';
    document.getElementById("signup-username").value = '';
    document.getElementById("signup-password").value = '';
    document.getElementById("signup-confirm").value = '';
    document.getElementById("terms-checkbox").checked = false;
    taskList = [];
    blockTasksMap = {};
    blockCompletionMap = {};
    blockRatingMap = {};
    distractionLogs = {};
    switchAuthTab('login');
    showAlert('👋 Logged out!', 'success');
}

// ============================================
// HISTORY SCREEN FUNCTIONS
// ============================================

function showHistoryScreen() { 
    document.getElementById('main-screen').classList.add('hidden'); 
    document.getElementById('history-screen').classList.remove('hidden'); 
    loadHistoryData(); 
}

function backToDashboard() { 
    document.getElementById('history-screen').classList.add('hidden'); 
    document.getElementById('main-screen').classList.remove('hidden'); 
}

function loadHistoryData() {
    const history = getHistory();
    filteredHistoryData = history;
    if (history.length > 0) permanentHistoryBackup = [...history];
    displayStats();
    displayHistory();
    loadProductivityTrendChart();
    loadMoodDistributionChart();
    loadHeatmapChart();
    loadCorrelationChart();
    loadBlockRatingsChart();
    loadDistractionChart();
}

function displayStats() {
    const history = filteredHistoryData;
    if (history.length === 0) { 
        document.getElementById('statsGrid').innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No data yet. Start logging your productivity!</p></div>'; 
        return; 
    }
    const totalEntries = history.length;
    const avgProductivity = (history.reduce((sum, h) => sum + (parseInt(h.productivity) || 0), 0) / totalEntries).toFixed(1);
    const totalHours = history.reduce((sum, h) => sum + (parseFloat(h.totalHours) || 0), 0).toFixed(1);
    const mostFrequentMood = getMostFrequent(history.map(h => h.mood));
    let totalDistractions = 0;
    history.forEach(entry => { if (entry.distractions) Object.values(entry.distractions).forEach(distList => totalDistractions += distList.length); });
    document.getElementById('statsGrid').innerHTML = `<div class="stat-card"><div class="stat-label">📊 Total Entries</div><div class="stat-value">${totalEntries}</div></div><div class="stat-card"><div class="stat-label">⭐ Avg Productivity</div><div class="stat-value">${avgProductivity}/10</div></div><div class="stat-card"><div class="stat-label">⏱️ Total Hours</div><div class="stat-value">${totalHours}h</div></div><div class="stat-card"><div class="stat-label">😊 Mood</div><div class="stat-value">${mostFrequentMood}</div></div><div class="stat-card"><div class="stat-label">🚫 Distractions</div><div class="stat-value">${totalDistractions}</div></div>`;
}

function getMostFrequent(arr) { 
    const counts = {}; 
    arr.forEach(item => counts[item] = (counts[item] || 0) + 1); 
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b); 
}

function displayHistory() {
    const history = filteredHistoryData;
    const list = document.getElementById('history-list');
    if (history.length === 0) { 
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No entries found. Start tracking your productivity!</p></div>'; 
        return; 
    }
    list.innerHTML = history.slice().reverse().map((entry, idx) => {
        let distractionCount = 0;
        if (entry.distractions) Object.values(entry.distractions).forEach(distList => distractionCount += distList.length);
        let completedBlocks = 0, totalBlocks = 0;
        if (entry.blockCompletionMap) {
            totalBlocks = Object.keys(entry.blockCompletionMap).length;
            completedBlocks = Object.values(entry.blockCompletionMap).filter(v => v === true).length;
        }
        let blockRatingSummary = '';
        if (entry.blockRatingMap && Object.keys(entry.blockRatingMap).length > 0) {
            const ratings = Object.values(entry.blockRatingMap);
            const avgRating = (ratings.reduce((a,b) => a + b, 0) / ratings.length).toFixed(1);
            blockRatingSummary = `<div class="quick-stat">⭐ Avg: ${avgRating}/10</div>`;
        }
        return `<div class="history-item" onclick="showEntryDetail(${history.length - idx - 1})">
            <div class="history-item-header">
                <div class="history-date"><span class="date-full">${entry.date}</span><span class="date-time">${new Date(entry.timestamp).toLocaleTimeString()}</span></div>
                <div class="history-mood">${entry.mood}</div>
            </div>
            <div class="history-quick-stats">
                <div class="quick-stat"><span class="stat-text ${entry.productivity >= 8 ? 'productivity-high' : entry.productivity >= 5 ? 'productivity-medium' : 'productivity-low'}">⭐ ${entry.productivity}/10</span></div>
                <div class="quick-stat">⏱️ ${entry.totalHours}h</div>
                <div class="quick-stat">📦 ${entry.blocks} blocks</div>
                ${totalBlocks > 0 ? `<div class="quick-stat">✅ ${completedBlocks}/${totalBlocks} done</div>` : ''}
                ${blockRatingSummary}
                ${distractionCount > 0 ? `<div class="quick-stat">🚫 ${distractionCount} distractions</div>` : ''}
            </div>
            <p class="history-tasks">${entry.tasks.substring(0, 60)}${entry.tasks.length > 60 ? '...' : ''}</p>
            <div class="history-item-action">View Details →</div>
        </div>`;
    }).join('');
}

function showEntryDetail(idx) {
    const history = getHistory();
    const entry = history[idx];
    const detailContent = document.getElementById('detail-content');
    
    let blockDetails = '';
    if (entry.blockMultiTasks) {
        for (let i = 0; i < Object.keys(entry.blockMultiTasks).length; i++) {
            const tasks = entry.blockMultiTasks[i];
            if (tasks && tasks.length > 0) {
                const completed = entry.blockCompletionMap && entry.blockCompletionMap[i] ? '✅ Completed' : '⏳ Not Completed';
                const avgRating = entry.blockRatingMap && entry.blockRatingMap[i] ? `⭐ ${entry.blockRatingMap[i]}/10` : '📝 Not rated';
                blockDetails += `<div style="padding: 12px; background: var(--bg-light); border-radius: 10px; margin-bottom: 12px; border-left: 4px solid ${entry.blockCompletionMap && entry.blockCompletionMap[i] ? '#10B981' : 'var(--primary)'};">
                    <strong style="color: var(--primary);">Block ${parseInt(i) + 1}:</strong><br>
                    ${tasks.map(t => `• ${escapeHtml(t.taskName)} ${t.rating ? `<span style="color: #10B981;">⭐${t.rating}/10</span>` : '<span style="color: #F59E0B;">📝 Not rated</span>'}`).join('<br>')}
                    <div style="margin-top: 8px; font-size: 0.85rem;"><span style="color: var(--text-muted);">${completed}</span> | <span style="color: var(--text-muted);">${avgRating}</span></div>
                </div>`;
            }
        }
    }
    
    let distractionDetails = '';
    if (entry.distractions && Object.keys(entry.distractions).length > 0) {
        distractionDetails = '<div class="detail-section" style="border-left-color: #F59E0B;"><h3>🚫 Distractions Logged</h3>';
        for (let blockIdx in entry.distractions) {
            const distractions = entry.distractions[blockIdx];
            if (distractions && distractions.length > 0) {
                distractionDetails += `<div style="margin-bottom: 12px; padding: 8px; background: rgba(245,158,11,0.1); border-radius: 8px;">
                    <strong style="color: #F59E0B;">Block ${parseInt(blockIdx) + 1}:</strong><br>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
                        ${distractions.map(d => `<span class="distraction-tag" style="background: #FEE2E2; color: #991B1B; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem;">${escapeHtml(d.distractionType)}</span>`).join('')}
                    </div>
                </div>`;
            }
        }
        distractionDetails += '</div>';
    }
    
    let completedBlocks = 0, totalBlocks = 0;
    if (entry.blockCompletionMap) {
        totalBlocks = Object.keys(entry.blockCompletionMap).length;
        completedBlocks = Object.values(entry.blockCompletionMap).filter(v => v === true).length;
    }
    
    detailContent.innerHTML = `
        <div class="detail-header"><h2 class="detail-title">${entry.date}</h2><p class="detail-time">${new Date(entry.timestamp).toLocaleTimeString()}</p></div>
        <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Mood</span><div class="detail-value">${entry.mood}</div></div>
            <div class="detail-item"><span class="detail-label">Productivity</span><div class="detail-value" style="color: ${entry.productivity >= 8 ? '#10B981' : entry.productivity >= 5 ? '#F59E0B' : '#EF4444'};">${entry.productivity}/10</div></div>
            <div class="detail-item"><span class="detail-label">Hours</span><div class="detail-value">${entry.totalHours}h</div></div>
            <div class="detail-item"><span class="detail-label">Blocks</span><div class="detail-value">${entry.blocks}</div></div>
        </div>
        ${totalBlocks > 0 ? `<div class="detail-section"><h3>📊 Block Completion</h3><div style="font-size: 1.2rem; font-weight: 700;">${completedBlocks}/${totalBlocks} Blocks Completed</div><div style="margin-top: 8px; background: var(--border-color); border-radius: 10px; overflow: hidden;"><div style="width: ${totalBlocks > 0 ? (completedBlocks/totalBlocks)*100 : 0}%; height: 8px; background: #10B981;"></div></div></div>` : ''}
        <div class="detail-section"><h3>📋 All Tasks</h3><div style="display: flex; flex-wrap: wrap; gap: 8px;">${entry.tasks.split(',').map(t => `<span style="background: var(--bg-light); padding: 6px 12px; border-radius: 20px;">${escapeHtml(t.trim())}</span>`).join('')}</div></div>
        ${blockDetails ? `<div class="detail-section"><h3>🎯 Block Details</h3>${blockDetails}</div>` : ''}
        ${distractionDetails}
        ${entry.comments ? `<div class="detail-section"><h3>💭 Notes</h3><p>${escapeHtml(entry.comments)}</p></div>` : ''}
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--border-color); font-size: 0.8rem; text-align: center;">Logged on ${new Date(entry.timestamp).toLocaleString()}</div>
    `;
    document.getElementById('detail-modal').classList.remove('hidden');
}

function closeDetailModal() { document.getElementById('detail-modal').classList.add('hidden'); }

function filterHistory() {
    const moodFilter = document.getElementById('mood-filter').value;
    const productivityFilter = document.getElementById('productivity-filter').value;
    const history = getHistory();
    filteredHistoryData = history.filter(entry => {
        const moodMatch = !moodFilter || entry.mood === moodFilter;
        let productivityMatch = !productivityFilter;
        if (productivityFilter === 'high') productivityMatch = parseInt(entry.productivity) >= 8;
        else if (productivityFilter === 'medium') productivityMatch = parseInt(entry.productivity) >= 5 && parseInt(entry.productivity) < 8;
        else if (productivityFilter === 'low') productivityMatch = parseInt(entry.productivity) < 5;
        return moodMatch && productivityMatch;
    });
    displayHistory();
}

function resetFilters() { 
    document.getElementById('mood-filter').value = ''; 
    document.getElementById('productivity-filter').value = ''; 
    filteredHistoryData = getHistory(); 
    displayHistory(); 
}

function clearAllHistory() {
    if (confirm('⚠️ Are you sure? This will clear history from the app.')) {
        if (currentUser) localStorage.setItem(`chimla_history_${currentUser.username}`, JSON.stringify([]));
        filteredHistoryData = [];
        showAlert('🗑️ History cleared.', 'success');
        loadHistoryData();
    }
}

// ============================================
// CHART FUNCTIONS
// ============================================

function switchChartTab(tab, event) { 
    document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active')); 
    document.querySelectorAll('.chart-container').forEach(c => c.classList.remove('active')); 
    event.target.classList.add('active'); 
    document.getElementById(`${tab}-chart-container`).classList.add('active'); 
}

function loadProductivityTrendChart() {
    const history = getHistory();
    const ctx = document.getElementById('productivityTrendChart').getContext('2d');
    if (history.length === 0) { 
        document.getElementById('trend-insight').innerHTML = '📭 No data available.'; 
        if (productivityChart) productivityChart.destroy(); 
        return; 
    }
    const labels = history.map(h => h.date);
    const data = history.map(h => parseInt(h.productivity));
    const avgProductivity = (data.reduce((a, b) => a + b, 0) / data.length).toFixed(1);
    if (productivityChart) productivityChart.destroy();
    productivityChart = new Chart(ctx, { 
        type: 'line', 
        data: { labels, datasets: [{ label: 'Productivity Rating', data, borderColor: '#1B4D3E', backgroundColor: 'rgba(27, 77, 62, 0.1)', tension: 0.4, pointRadius: 6, pointBackgroundColor: '#1B4D3E', pointBorderColor: '#fff', pointBorderWidth: 2 }] }, 
        options: { responsive: true, maintainAspectRatio: true, scales: { y: { min: 0, max: 10, ticks: { stepSize: 1 } } } } 
    });
    document.getElementById('trend-insight').innerHTML = `📈 <strong>Your Trend:</strong> Average productivity is <strong>${avgProductivity}/10</strong>.`;
}

function loadMoodDistributionChart() {
    const history = getHistory();
    const ctx = document.getElementById('moodDistributionChart').getContext('2d');
    if (history.length === 0) { 
        document.getElementById('mood-insight').innerHTML = '📭 No data available.'; 
        if (moodChart) moodChart.destroy(); 
        return; 
    }
    const moodCounts = {};
    history.forEach(h => moodCounts[h.mood] = (moodCounts[h.mood] || 0) + 1);
    if (moodChart) moodChart.destroy();
    moodChart = new Chart(ctx, { type: 'doughnut', data: { labels: Object.keys(moodCounts), datasets: [{ data: Object.values(moodCounts), backgroundColor: ['#1B4D3E', '#2A7F6F', '#D4A574'], borderRadius: 8 }] }, options: { responsive: true } });
    document.getElementById('mood-insight').innerHTML = `😊 <strong>Mood Insight:</strong> Your dominant mood is <strong>${getMostFrequent(history.map(h => h.mood))}</strong>.`;
}

function loadHeatmapChart() {
    const history = getHistory();
    const container = document.getElementById('heatmap-calendar');
    if (history.length === 0) { 
        document.getElementById('heatmap-insight').innerHTML = '📭 No data available.'; 
        return; 
    }
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const entryMap = {};
    history.forEach(entry => { const date = new Date(entry.date + ' 00:00:00').toLocaleDateString('en-GB'); entryMap[date] = parseInt(entry.productivity); });
    let html = '<div class="heatmap-calendar">';
    let currentDate = new Date(thirtyDaysAgo);
    while (currentDate <= today) {
        const dateStr = currentDate.toLocaleDateString('en-GB');
        const productivity = entryMap[dateStr] || 0;
        html += `<div class="heatmap-day productivity-${productivity}" title="${dateStr}: ${productivity > 0 ? productivity + '/10' : 'No entry'}">${currentDate.getDate()}</div>`;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    html += '</div>';
    container.innerHTML = html;
    document.getElementById('heatmap-insight').innerHTML = `🔥 <strong>Consistency Tracker:</strong> Keep building your streak!`;
}

function loadCorrelationChart() {
    const history = getHistory();
    const ctx = document.getElementById('correlationChart').getContext('2d');
    if (history.length === 0) { 
        document.getElementById('correlation-insight').innerHTML = '📭 No data available.'; 
        if (correlationChart) correlationChart.destroy(); 
        return; 
    }
    const scatterData = history.map(entry => ({ x: parseFloat(entry.totalHours), y: parseInt(entry.productivity) }));
    if (correlationChart) correlationChart.destroy();
    correlationChart = new Chart(ctx, { type: 'scatter', data: { datasets: [{ label: 'Entries', data: scatterData, backgroundColor: '#1B4D3E', pointRadius: 8 }] }, options: { responsive: true, scales: { x: { title: { display: true, text: 'Hours Worked' }, min: 0, max: 12 }, y: { title: { display: true, text: 'Productivity (/10)' }, min: 0, max: 10 } } } });
    document.getElementById('correlation-insight').innerHTML = `📈 <strong>Correlation Analysis:</strong> Track hours vs productivity.`;
}

function loadBlockRatingsChart() {
    const history = getHistory();
    const ctx = document.getElementById('blockRatingsChart').getContext('2d');
    if (history.length === 0 || !history.some(h => h.blockRatingMap && Object.keys(h.blockRatingMap).length > 0)) { 
        document.getElementById('blockratings-insight').innerHTML = '📭 No block rating data.'; 
        if (blockRatingsChart) blockRatingsChart.destroy(); 
        return; 
    }
    const blockRatingsAggregate = {};
    history.forEach(entry => { if (entry.blockRatingMap) { Object.entries(entry.blockRatingMap).forEach(([blockIdx, rating]) => { if (!blockRatingsAggregate[blockIdx]) blockRatingsAggregate[blockIdx] = { sum: 0, count: 0 }; blockRatingsAggregate[blockIdx].sum += rating; blockRatingsAggregate[blockIdx].count++; }); } });
    const blockLabels = Object.keys(blockRatingsAggregate).sort((a, b) => a - b).map(idx => `Block ${parseInt(idx) + 1}`);
    const avgRatings = Object.keys(blockRatingsAggregate).sort((a, b) => a - b).map(idx => (blockRatingsAggregate[idx].sum / blockRatingsAggregate[idx].count).toFixed(1));
    if (blockRatingsChart) blockRatingsChart.destroy();
    blockRatingsChart = new Chart(ctx, { type: 'bar', data: { labels: blockLabels, datasets: [{ label: 'Average Rating', data: avgRatings, backgroundColor: '#1B4D3E', borderRadius: 8 }] }, options: { responsive: true, scales: { y: { min: 0, max: 10 } } } });
    document.getElementById('blockratings-insight').innerHTML = `⭐ <strong>Block Analysis:</strong> See which blocks are most productive.`;
}

function loadDistractionChart() {
    const history = getHistory();
    const ctx = document.getElementById('distractionChart').getContext('2d');
    if (history.length === 0) { 
        document.getElementById('distraction-insight').innerHTML = '📭 No distraction data.'; 
        if (distractionChart) distractionChart.destroy(); 
        return; 
    }
    const distractionFreq = {};
    let totalDistractions = 0;
    history.forEach(entry => { if (entry.distractions) { Object.values(entry.distractions).forEach(distList => { distList.forEach(d => { distractionFreq[d.distractionType] = (distractionFreq[d.distractionType] || 0) + 1; totalDistractions++; }); }); } });
    if (totalDistractions === 0) { 
        document.getElementById('distraction-insight').innerHTML = '📭 No distractions logged.'; 
        if (distractionChart) distractionChart.destroy(); 
        return; 
    }
    const sorted = Object.entries(distractionFreq).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([type]) => type.length > 20 ? type.substring(0, 18) + '...' : type);
    const data = sorted.map(([, count]) => count);
    if (distractionChart) distractionChart.destroy();
    distractionChart = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Frequency', data, backgroundColor: '#F59E0B', borderRadius: 8 }] }, options: { responsive: true, scales: { y: { ticks: { stepSize: 1 } } } } });
    document.getElementById('distraction-insight').innerHTML = `🚫 <strong>Top Distraction:</strong> ${sorted[0][0]} (${sorted[0][1]} times). Total: ${totalDistractions}.`;
}

// ============================================
// NOTIFICATIONS, BACKUP, PWA
// ============================================

async function requestNotificationPermission() {
    if (!("Notification" in window)) { showAlert("Notifications not supported", "error"); return; }
    if (Notification.permission === "granted") { notificationPermissionGranted = true; showAlert("Notifications enabled!", "success"); showReminderSettings(); return; }
    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") { notificationPermissionGranted = true; showAlert("Notifications enabled!", "success"); showReminderSettings(); setupLocalNotifications(); }
        else showAlert("Please allow notifications", "error");
    } else showAlert("Notifications blocked", "error");
}

function setupLocalNotifications() {
    if (window.notificationInterval) clearInterval(window.notificationInterval);
    window.notificationInterval = setInterval(() => {
        const now = new Date();
        const reminderTime = localStorage.getItem('reminderTime') || '20:00';
        const [hours, minutes] = reminderTime.split(':');
        if (now.getHours() === parseInt(hours) && now.getMinutes() === parseInt(minutes)) {
            const history = getHistory();
            const today = new Date().toLocaleDateString('en-GB');
            const loggedToday = history.some(entry => entry.date === today);
            if (!loggedToday && Notification.permission === 'granted') {
                new Notification("⏰ Chimla Tabdew Reminder", { body: "Don't forget to log your productivity today!", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%231B4D3E'/%3E%3Ctext x='50' y='67' font-size='50' text-anchor='middle' fill='%23D4A574'%3E📊%3C/text%3E%3C/svg%3E", vibrate: [200, 100, 200] });
            }
        }
    }, 60000);
}

function showReminderSettings() { const card = document.getElementById("reminder-settings"); if(card) card.style.display = "block"; loadReminderSettings(); }
function toggleReminderSettings() { const ctrl = document.querySelector('.reminder-controls'); if(ctrl) ctrl.style.display = ctrl.style.display === 'none' ? 'flex' : 'none'; }
function loadReminderSettings() {
    document.getElementById("daily-reminder-toggle").checked = localStorage.getItem("dailyReminderEnabled") === "true";
    document.getElementById("weekly-report-toggle").checked = localStorage.getItem("weeklyReportEnabled") === "true";
    document.getElementById("nudge-toggle").checked = localStorage.getItem("nudgeEnabled") === "true";
    document.getElementById("reminder-time").value = localStorage.getItem("reminderTime") || "20:00";
}
function toggleDailyReminder() { localStorage.setItem("dailyReminderEnabled", document.getElementById("daily-reminder-toggle").checked); if (document.getElementById("daily-reminder-toggle").checked) setupLocalNotifications(); }
function saveReminderTime() { localStorage.setItem("reminderTime", document.getElementById("reminder-time").value); showAlert(`Reminder time set`, 'success'); }
function toggleWeeklyReport() { localStorage.setItem("weeklyReportEnabled", document.getElementById("weekly-report-toggle").checked); }
function toggleNudge() { localStorage.setItem("nudgeEnabled", document.getElementById("nudge-toggle").checked); }
function getBestWorkTimeSuggestions() { const history = getHistory(); if (history.length < 5) return "Log at least 5 entries to get suggestions!"; return "Based on your data, optimal work hours vary. Keep tracking!"; }
function displayWorkTimeSuggestion() { const container = document.getElementById("work-time-suggestion"); if (container) { container.innerHTML = `<h4>⏰ Personalized Work Suggestion</h4><p>${getBestWorkTimeSuggestions()}</p>`; container.style.display = "block"; } }
function addWorkTimeSuggestionCard() { displayWorkTimeSuggestion(); }

function addBackupButton() {
    const headerButtons = document.querySelector('.header-buttons');
    if (headerButtons && !document.querySelector('#backup-btn')) {
        const backupBtn = document.createElement('button');
        backupBtn.id = 'backup-btn';
        backupBtn.className = 'btn btn-secondary';
        backupBtn.innerHTML = '💾 Backup/Restore';
        backupBtn.onclick = showBackupModal;
        headerButtons.appendChild(backupBtn);
    }
}

function showBackupModal() {
    const modalHtml = `<div id="backup-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10005;"><div style="background:var(--card-bg);padding:24px;border-radius:20px;max-width:400px;width:90%;"><h3>💾 Backup & Restore</h3><p style="margin-bottom:15px;">Move your data between devices</p><button onclick="exportUserData()" class="btn btn-primary" style="width:100%;margin-bottom:10px;">📤 Export Data</button><label class="btn btn-secondary" style="width:100%;text-align:center;cursor:pointer;display:block;">📥 Import Data<input type="file" id="import-file" accept=".json" style="display:none;" onchange="importUserData(this.files[0])"></label><button onclick="closeBackupModal()" class="btn btn-secondary" style="width:100%;margin-top:10px;">Cancel</button></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeBackupModal() { document.getElementById('backup-modal')?.remove(); }

function exportUserData() {
    if (!currentUser) { showAlert('Please login first', 'error'); return; }
    const userData = { username: currentUser.username, fullname: currentUser.fullname, history: getHistory(), settings: { theme: localStorage.getItem('theme'), dailyReminder: localStorage.getItem('dailyReminderEnabled'), reminderTime: localStorage.getItem('reminderTime') }, exportDate: new Date().toISOString() };
    const dataStr = JSON.stringify(userData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chimla_backup_${currentUser.username}_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showAlert('📦 Data exported!', 'success');
    closeBackupModal();
}

function importUserData(file) {
    if (!currentUser) { showAlert('Please login first', 'error'); return; }
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.history && Array.isArray(importedData.history)) {
                const existingHistory = getHistory();
                const mergedHistory = [...existingHistory, ...importedData.history];
                const uniqueHistory = mergedHistory.filter((entry, index, self) => index === self.findIndex(e => e.timestamp === entry.timestamp));
                localStorage.setItem(`chimla_history_${currentUser.username}`, JSON.stringify(uniqueHistory));
                permanentHistoryBackup = [...uniqueHistory];
                showAlert(`✅ Imported ${importedData.history.length} entries!`, 'success');
                loadHistoryData();
            } else showAlert('Invalid backup file', 'error');
        } catch(err) { showAlert('Error reading backup file', 'error'); }
    };
    reader.readAsText(file);
    closeBackupModal();
}

function downloadHistoryCSV() {
    const historyToDownload = permanentHistoryBackup.length > 0 ? permanentHistoryBackup : getHistory();
    if (historyToDownload.length === 0) { showAlert("No history data", "warning"); return; }
    let csvRows = [["Date", "Time", "Mood", "Productivity", "Total Hours", "Blocks", "Tasks", "Block Details", "Distractions", "Comments"]];
    historyToDownload.forEach(entry => {
        let moodText = entry.mood === "🔥" ? "Focused" : entry.mood === "😊" ? "Happy" : "Tired";
        let blockDetailsText = "";
        if (entry.blockMultiTasks) {
            const blockList = [];
            for (let i = 0; i < Object.keys(entry.blockMultiTasks).length; i++) {
                const tasks = entry.blockMultiTasks[i];
                if (tasks && tasks.length > 0) blockList.push(`Block ${i+1}: ${tasks.map(t => `${t.taskName}[${t.rating || 'NR'}/10]`).join(', ')}`);
            }
            blockDetailsText = blockList.join('; ');
        }
        let distractionText = "None";
        if (entry.distractions && Object.keys(entry.distractions).length > 0) {
            let allDist = [];
            for (let blockIdx in entry.distractions) entry.distractions[blockIdx].forEach(d => allDist.push(d.distractionType));
            distractionText = allDist.join(' | ');
        }
        csvRows.push([`"${entry.date}"`, `"${new Date(entry.timestamp).toLocaleTimeString()}"`, `"${moodText}"`, entry.productivity, entry.totalHours, entry.blocks, `"${entry.tasks.replace(/"/g, '""')}"`, `"${blockDetailsText.replace(/"/g, '""')}"`, `"${distractionText.replace(/"/g, '""')}"`, `"${(entry.comments || "").replace(/"/g, '""')}"`]);
    });
    const csvContent = "\uFEFF" + csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Chimla_Tabdew_Export_${currentUser ? currentUser.username : 'User'}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
    link.click();
    URL.revokeObjectURL(url);
    showAlert(`✅ Exported ${historyToDownload.length} entries!`, 'success');
}

function updateExportButton() {
    const historyBtn = document.querySelector('.header-buttons .btn-primary');
    if (historyBtn && historyBtn.innerHTML.includes('📥 Download CSV')) {
        historyBtn.innerHTML = '📊 Export to Excel';
        historyBtn.onclick = downloadHistoryCSV;
    }
}

// ============================================
// MOBILE & PWA INIT
// ============================================

function initTouchGestures() {
    const container = document.querySelector('.container');
    if (!container) return;
    let touchStartX = 0, touchEndX = 0;
    container.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const deltaX = touchEndX - touchStartX;
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0 && document.getElementById('history-screen') && !document.getElementById('history-screen').classList.contains('hidden')) backToDashboard();
            else if (deltaX < 0 && document.getElementById('main-screen') && !document.getElementById('main-screen').classList.contains('hidden')) showHistoryScreen();
        }
    });
}

function initOfflineIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#F59E0B;color:white;text-align:center;padding:10px;font-size:0.8rem;z-index:10002;';
    indicator.innerHTML = '📡 Offline. Changes save locally.';
    indicator.classList.add('hidden');
    document.body.appendChild(indicator);
    window.addEventListener('online', () => { indicator.classList.add('hidden'); showAlert('🟢 Back online!', 'success'); });
    window.addEventListener('offline', () => { indicator.classList.remove('hidden'); showAlert('🔴 Offline mode', 'warning'); });
}

function checkMobileCompatibility() {
    try { localStorage.setItem('test', 'test'); localStorage.removeItem('test'); } catch(e) { showAlert('⚠️ Private browsing mode detected', 'warning'); }
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) console.log('🎉 Running as PWA');
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
        if (deferredPrompt && !localStorage.getItem('installDismissed') && !window.matchMedia('(display-mode: standalone)').matches) {
            const banner = document.createElement('div');
            banner.id = 'pwa-install-banner';
            banner.style.cssText = 'position:fixed;bottom:20px;left:20px;right:20px;background:var(--card-bg);border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:10000;border:2px solid var(--primary);animation:slideInUp 0.3s ease-out;';
            banner.innerHTML = `<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;"><div style="font-size:2rem;">📱</div><div style="flex:1;"><strong>Install Chimla Tabdew</strong><small style="font-size:0.7rem;display:block;">Get app-like experience</small></div><button onclick="installPWA()" class="btn btn-primary btn-sm">Install</button><button onclick="dismissInstallBanner()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;">✕</button></div>`;
            document.body.appendChild(banner);
        }
    }, 3000);
});

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') showAlert('🎉 Thanks for installing!', 'success');
            deferredPrompt = null;
            document.getElementById('pwa-install-banner')?.remove();
        });
    }
}

function dismissInstallBanner() {
    document.getElementById('pwa-install-banner')?.remove();
    localStorage.setItem('installDismissed', true);
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    checkMobileCompatibility();
    initOfflineIndicator();
    initTouchGestures();
    checkRememberedUser();
    const hasSession = checkExistingSession();
    if (!hasSession) {
        document.getElementById("login-screen").classList.remove("hidden");
        document.getElementById("main-screen").classList.add("hidden");
        document.getElementById("history-screen").classList.add("hidden");
    }
    const defaultMoodBtn = document.querySelector('[data-mood="😊"]');
    if (defaultMoodBtn) defaultMoodBtn.classList.add('active');
    if (Notification.permission === "granted") { notificationPermissionGranted = true; setupLocalNotifications(); }
    updateAutoProductivityDisplay();
});

// ============================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ============================================

window.addTaskToBlock = addTaskToBlock;
window.removeTaskFromBlock = removeTaskFromBlock;
window.markBlockCompleted = markBlockCompleted;
window.showRatingModalForBlock = showRatingModalForBlock;
window.saveBlockRatings = saveBlockRatings;
window.closeRatingModal = closeRatingModal;
window.closeRatingsModal = closeRatingsModal;
window.showAllRatingsModal = showAllRatingsModal;
window.resetAllBlockAssignments = resetAllBlockAssignments;
window.toggleTheme = toggleTheme;
window.setMood = setMood;
window.addTask = addTask;
window.removeTask = removeTask;
window.loginUser = loginUser;
window.signupUser = signupUser;
window.logout = logout;
window.switchAuthTab = switchAuthTab;
window.togglePassword = togglePassword;
window.showHistoryScreen = showHistoryScreen;
window.backToDashboard = backToDashboard;
window.saveEntry = saveEntry;
window.filterHistory = filterHistory;
window.resetFilters = resetFilters;
window.clearAllHistory = clearAllHistory;
window.switchChartTab = switchChartTab;
window.showEntryDetail = showEntryDetail;
window.closeDetailModal = closeDetailModal;
window.requestNotificationPermission = requestNotificationPermission;
window.toggleReminderSettings = toggleReminderSettings;
window.toggleDailyReminder = toggleDailyReminder;
window.saveReminderTime = saveReminderTime;
window.toggleWeeklyReport = toggleWeeklyReport;
window.toggleNudge = toggleNudge;
window.addSelectedDistraction = addSelectedDistraction;
window.addCustomDistraction = addCustomDistraction;
window.removeDistraction = removeDistraction;
window.toggleCustomInput = toggleCustomInput;
window.showDistractionInsightsModal = showDistractionInsightsModal;
window.closeDistractionInsightsModal = closeDistractionInsightsModal;
window.handleDistractionSelectChange = handleDistractionSelectChange;
window.downloadHistoryCSV = downloadHistoryCSV;
window.showToolGuide = showToolGuide;
window.closeToolGuide = closeToolGuide;
window.showTerms = showTerms;
window.installPWA = installPWA;
window.dismissInstallBanner = dismissInstallBanner;
window.exportUserData = exportUserData;
window.importUserData = importUserData;
window.closeBackupModal = closeBackupModal;
window.updateExportButton = updateExportButton;
window.savePersistentData = savePersistentData;
window.loadPersistentData = loadPersistentData;
window.clearPersistentData = clearPersistentData;
window.checkAndTriggerAutoSave = checkAndTriggerAutoSave;