// ============================================
// COMPLETE JAVASCRIPT - ALL FEATURES
// INCLUDING DARK/LIGHT MODE TOGGLE
// ============================================

// State Management
let taskList = [];
let currentUser = "Penjor";
let filteredHistoryData = [];
let productivityChart = null;
let moodChart = null;
let correlationChart = null;
let notificationPermissionGranted = false;
let reminderCheckInterval = null;

// ============================================
// DARK/LIGHT MODE TOGGLE IMPLEMENTATION
// ============================================

// Function to apply theme based on preference
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
        // Auto - detect system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const newTheme = systemPrefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', 'auto');
        updateThemeButtons(newTheme);
    }
}

// Update theme toggle button text and icon
function updateThemeButtons(currentTheme) {
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    const isDark = currentTheme === 'dark';
    toggleBtns.forEach(btn => {
        if (isDark) {
            btn.innerHTML = '☀️ Light Mode';
        } else {
            btn.innerHTML = '🌙 Dark Mode';
        }
    });
}

// Get saved theme preference or default to 'auto'
function getSavedTheme() {
    return localStorage.getItem('theme') || 'auto';
}

// Initialize theme on page load
function initTheme() {
    const savedTheme = getSavedTheme();
    if (savedTheme === 'dark') {
        applyTheme('dark');
    } else if (savedTheme === 'light') {
        applyTheme('light');
    } else {
        applyTheme('auto');
    }
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const savedTheme = getSavedTheme();
        if (savedTheme === 'auto') {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme('auto');
        }
    });
}

// Toggle between light and dark modes (explicit user choice)
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        applyTheme('light');
        showAlert('☀️ Light mode activated', 'success');
    } else {
        applyTheme('dark');
        showAlert('🌙 Dark mode activated', 'success');
    }
}

// ============================================
// EXISTING FUNCTIONS (preserved)
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

// Helper Functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mood Management
function setMood(mood, btn) {
    document.getElementById('selected-mood').value = mood;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (navigator.vibrate) navigator.vibrate(50);
}

// Task Management
function addTask() {
    const input = document.getElementById('task-input');
    const val = input.value.trim();
    if (val) {
        taskList.push(val);
        updateTaskListUI();
        input.value = '';
        input.focus();
        document.getElementById('tasks').value = taskList.join(', ');
    }
}

function updateTaskListUI() {
    const list = document.getElementById('task-checklist');
    list.innerHTML = taskList.map((t, i) => `<li><span>${escapeHtml(t)}</span><span class="delete-task" onclick="removeTask(${i})">✕</span></li>`).join('');
}

function removeTask(index) {
    taskList.splice(index, 1);
    updateTaskListUI();
    document.getElementById('tasks').value = taskList.join(', ');
}

// Time Block Management
function autoGenerateBlocksManual() {
    const total = parseFloat(document.getElementById("total-hours").value) || 0;
    const blocks = parseInt(document.getElementById("blocks").value) || 1;
    const hoursPerBlock = (total / blocks).toFixed(1);
    let blockLabels = [];
    for (let i = 1; i <= blocks; i++) blockLabels.push(`Block ${i} (${hoursPerBlock}h)`);
    const blockTasksInput = document.getElementById("block-tasks");
    blockTasksInput.value = blockLabels.join(", ");
    blockTasksInput.style.borderColor = '#10B981';
    setTimeout(() => blockTasksInput.style.borderColor = '', 2000);
}

// Login/Logout
function login() {
    const name = document.getElementById("username").value.trim();
    if (name) currentUser = name;
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-screen").classList.remove("hidden");
    document.getElementById("greeting-name").textContent = currentUser;
    document.getElementById("current-date").textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' });
    document.getElementById('daily-quote').textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
    setTimeout(() => autoGenerateBlocksManual(), 100);
    setupEventListeners();
    if (Notification.permission === "granted") {
        showReminderSettings();
        setupReminderSystem();
    }
    addWorkTimeSuggestionCard();
}

function logout() {
    document.getElementById("main-screen").classList.add("hidden");
    document.getElementById("history-screen").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("summary").classList.add("hidden");
    taskList = [];
}

function setupEventListeners() {
    const totalHoursInput = document.getElementById("total-hours");
    const blocksInput = document.getElementById("blocks");
    const blockTasksInput = document.getElementById("block-tasks");
    const ratingSlider = document.getElementById("productivity");
    const ratingValue = document.getElementById("rating-value");
    const taskInput = document.getElementById("task-input");
    
    function autoGenerateBlocks() {
        const total = parseFloat(totalHoursInput.value) || 0;
        const blocks = parseInt(blocksInput.value) || 1;
        const hoursPerBlock = (total / blocks).toFixed(1);
        let blockLabels = [];
        for (let i = 1; i <= blocks; i++) blockLabels.push(`Block ${i} (${hoursPerBlock}h)`);
        blockTasksInput.value = blockLabels.join(", ");
    }
    
    totalHoursInput.addEventListener("input", autoGenerateBlocks);
    blocksInput.addEventListener("input", autoGenerateBlocks);
    ratingSlider.addEventListener("input", () => ratingValue.textContent = ratingSlider.value);
    if (taskInput) taskInput.addEventListener("keypress", e => { if (e.key === "Enter") { e.preventDefault(); addTask(); } });
}

// Save Entry
function saveEntry() {
    const tasks = document.getElementById("tasks").value.trim();
    const totalHours = document.getElementById("total-hours").value;
    const blockTasks = document.getElementById("block-tasks").value.trim();
    const blocks = document.getElementById("blocks").value;
    const productivity = document.getElementById("productivity").value;
    const comments = document.getElementById("comments").value.trim();
    const mood = document.getElementById("selected-mood").value;

    if (!tasks) { showAlert("❌ Please add at least one task today.", "error"); return; }
    if (!blockTasks) { showAlert("❌ Please divide your work into blocks.", "error"); return; }

    const hoursPerBlock = (parseFloat(totalHours) / parseInt(blocks)).toFixed(1);
    displaySummary({ tasks, blockTasks, totalHours, blocks, hoursPerBlock, productivity, comments, mood });
    generateLessons(mood, tasks, productivity, comments);

    const entryData = {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        tasks, mood, blockTasks, totalHours, blocks, hoursPerBlock, productivity, comments,
        timestamp: new Date().toISOString(),
        id: Date.now()
    };
    
    saveToHistory(entryData);
    localStorage.setItem("lastLogDate", new Date().toLocaleDateString());
    showAlert("✅ Today's entry saved successfully!", "success");
    setTimeout(() => { displayWorkTimeSuggestion(); }, 500);
    setTimeout(() => document.getElementById("summary").scrollIntoView({ behavior: "smooth" }), 300);
}

function displaySummary(data) {
    document.getElementById("sum-tasks").textContent = data.tasks;
    document.getElementById("sum-block-tasks").textContent = data.blockTasks;
    document.getElementById("sum-hours").textContent = `${data.totalHours} hours`;
    document.getElementById("sum-blocks").textContent = data.blocks;
    document.getElementById("sum-per-block").textContent = data.hoursPerBlock;
    document.getElementById("sum-rating").textContent = `${data.productivity}/10`;
    document.getElementById("sum-comments").textContent = data.comments || "No notes added.";
    document.getElementById("summary").classList.remove("hidden");
}

function generateLessons(mood, tasks, productivity, comments) {
    let feedback = "", icon = "📌";
    if (productivity >= 9) { feedback = "Excellent! You were highly focused and productive today."; icon = "🚀"; }
    else if (productivity >= 6) { feedback = "Good job! Small improvements can make it even better next time."; icon = "⭐"; }
    else if (productivity >= 4) { feedback = "Fair effort. Try reducing distractions and planning better tomorrow."; icon = "🎯"; }
    else { feedback = "Room for improvement. Focus on planning and minimizing interruptions."; icon = "💪"; }
    
    let moodEmoji = mood, moodText = "focused";
    if (mood === "😊") moodText = "happy and positive";
    if (mood === "😴") moodText = "tired";

    document.getElementById("lessons-list").innerHTML = `
        <li><strong>🌅 Morning Mood:</strong> You started the day feeling ${moodEmoji} (${moodText})</li>
        <li><strong>📋 Plan Execution:</strong> You worked on: ${escapeHtml(tasks)}</li>
        <li><strong>📊 Progress:</strong> ${feedback}</li>
        <li><strong>${icon} Key Takeaway:</strong> ${escapeHtml(comments) || "Every day is a chance to improve your productivity."}</li>
    `;
}

// History Management
function saveToHistory(entry) {
    let history = JSON.parse(localStorage.getItem("productivityHistory") || "[]");
    history.push(entry);
    localStorage.setItem("productivityHistory", JSON.stringify(history));
}

function getHistory() { return JSON.parse(localStorage.getItem("productivityHistory") || "[]"); }

function showHistoryScreen() {
    document.getElementById("main-screen").classList.add("hidden");
    document.getElementById("history-screen").classList.remove("hidden");
    loadHistoryData();
    setTimeout(() => {
        loadProductivityTrendChart();
        loadMoodDistributionChart();
        loadHeatmapCalendar();
        loadCorrelationChart();
    }, 100);
}

function backToDashboard() {
    document.getElementById("history-screen").classList.add("hidden");
    document.getElementById("main-screen").classList.remove("hidden");
    resetFilters();
}

function loadHistoryData() {
    const history = getHistory();
    filteredHistoryData = [...history].reverse();
    calculateStatistics(history);
    displayHistoryList(filteredHistoryData);
}

function calculateStatistics(history) {
    if (history.length === 0) {
        document.getElementById("stat-entries").textContent = "0";
        document.getElementById("stat-avg-productivity").textContent = "0";
        document.getElementById("stat-avg-hours").textContent = "0";
        document.getElementById("stat-mood").textContent = "-";
        return;
    }
    document.getElementById("stat-entries").textContent = history.length;
    const avgProductivity = (history.reduce((sum, h) => sum + parseInt(h.productivity), 0) / history.length).toFixed(1);
    document.getElementById("stat-avg-productivity").textContent = avgProductivity;
    const avgHours = (history.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) / history.length).toFixed(1);
    document.getElementById("stat-avg-hours").textContent = avgHours;
    const moodCounts = {};
    history.forEach(h => moodCounts[h.mood] = (moodCounts[h.mood] || 0) + 1);
    const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b);
    document.getElementById("stat-mood").textContent = mostCommonMood;
}

function displayHistoryList(historyData) {
    const historyList = document.getElementById("history-list");
    if (historyData.length === 0) {
        historyList.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No entries found. Start tracking your productivity!</p></div>`;
        return;
    }
    historyList.innerHTML = historyData.map(entry => {
        const productivityClass = entry.productivity >= 8 ? 'high' : entry.productivity >= 5 ? 'medium' : 'low';
        return `<div class="history-item" onclick="showDetailModal('${entry.id}')">
            <div class="history-item-header"><div class="history-date"><span class="date-day">${new Date(entry.timestamp).toLocaleDateString('en-GB', {weekday: 'short'})}</span><span class="date-full">${entry.date}</span><span class="date-time">${entry.time}</span></div><div class="history-mood">${entry.mood}</div></div>
            <div class="history-item-content"><div class="history-quick-stats"><div class="quick-stat"><span class="stat-icon">⏱️</span><span class="stat-text">${entry.totalHours}h</span></div><div class="quick-stat"><span class="stat-icon">📊</span><span class="stat-text productivity-${productivityClass}">${entry.productivity}/10</span></div><div class="quick-stat"><span class="stat-icon">📦</span><span class="stat-text">${entry.blocks} blocks</span></div></div><p class="history-tasks"><strong>Tasks:</strong> ${escapeHtml(entry.tasks.substring(0, 60))}${entry.tasks.length > 60 ? '...' : ''}</p></div>
            <div class="history-item-action"><span class="view-details">View Details →</span></div></div>`;
    }).join('');
}

function filterHistory() {
    const moodFilter = document.getElementById("mood-filter").value;
    const productivityFilter = document.getElementById("productivity-filter").value;
    let history = getHistory().reverse();
    if (moodFilter) history = history.filter(h => h.mood === moodFilter);
    if (productivityFilter === 'high') history = history.filter(h => parseInt(h.productivity) >= 8);
    else if (productivityFilter === 'medium') history = history.filter(h => parseInt(h.productivity) >= 5 && parseInt(h.productivity) < 8);
    else if (productivityFilter === 'low') history = history.filter(h => parseInt(h.productivity) < 5);
    filteredHistoryData = history;
    displayHistoryList(filteredHistoryData);
}

function resetFilters() {
    document.getElementById("mood-filter").value = "";
    document.getElementById("productivity-filter").value = "";
    loadHistoryData();
}

function showDetailModal(entryId) {
    const history = getHistory();
    const entry = history.find(h => h.id == entryId);
    if (!entry) return;
    const productivityClass = entry.productivity >= 8 ? 'high' : entry.productivity >= 5 ? 'medium' : 'low';
    document.getElementById("detail-content").innerHTML = `
        <div class="detail-header"><h2 class="detail-title">${entry.date}</h2><p class="detail-time">${entry.time}</p></div>
        <div class="detail-grid"><div class="detail-item"><span class="detail-label">Mood</span><span class="detail-value">${entry.mood}</span></div><div class="detail-item"><span class="detail-label">Productivity</span><span class="detail-value productivity-${productivityClass}">${entry.productivity}/10</span></div><div class="detail-item"><span class="detail-label">Work Hours</span><span class="detail-value">${entry.totalHours}h</span></div><div class="detail-item"><span class="detail-label">Blocks</span><span class="detail-value">${entry.blocks}</span></div></div>
        <div class="detail-section"><h3>📋 Tasks</h3><p>${escapeHtml(entry.tasks)}</p></div>
        <div class="detail-section"><h3>⏱️ Work Blocks</h3><p>${escapeHtml(entry.blockTasks)}</p></div>
        <div class="detail-section"><h3>📝 Notes</h3><p>${escapeHtml(entry.comments) || 'No notes added.'}</p></div>
        <div class="detail-actions"><button onclick="deleteHistoryEntry(${entryId})" class="btn btn-secondary btn-danger">🗑️ Delete Entry</button></div>`;
    document.getElementById("detail-modal").classList.remove("hidden");
}

function closeDetailModal() { document.getElementById("detail-modal").classList.add("hidden"); }

function deleteHistoryEntry(entryId) {
    if (confirm("Are you sure you want to delete this entry?")) {
        let history = getHistory();
        history = history.filter(h => h.id != entryId);
        localStorage.setItem("productivityHistory", JSON.stringify(history));
        closeDetailModal();
        loadHistoryData();
        showAlert("✅ Entry deleted successfully!", "success");
    }
}

function clearAllHistory() {
    if (confirm("⚠️ This will delete ALL your entries. Are you sure?")) {
        if (confirm("Really? This cannot be undone!")) {
            localStorage.removeItem("productivityHistory");
            loadHistoryData();
            showAlert("✅ All entries cleared!", "success");
        }
    }
}

function showAlert(message, type = "info") {
    const alert = document.createElement('div');
    alert.style.cssText = `position: fixed; top: 20px; right: 20px; background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'}; color: white; padding: 16px 24px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 9999; animation: slideInDown 0.4s ease-out; font-weight: 600;`;
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => { alert.style.animation = 'slideInUp 0.4s ease-out reverse'; setTimeout(() => alert.remove(), 400); }, 2500);
}

// ===== CHARTS ===== (preserved - shortened for brevity, but fully functional)
function switchChartTab(tabName, event) {
    document.querySelectorAll('.chart-tab').forEach(tab => tab.classList.remove('active'));
    if (event) event.target.classList.add('active');
    document.querySelectorAll('.chart-container').forEach(container => container.classList.remove('active'));
    document.getElementById(`${tabName}-chart-container`).classList.add('active');
    if (tabName === 'productivity') loadProductivityTrendChart();
    else if (tabName === 'mood') loadMoodDistributionChart();
    else if (tabName === 'heatmap') loadHeatmapCalendar();
    else if (tabName === 'correlation') loadCorrelationChart();
}

function loadProductivityTrendChart() {
    const history = getHistory();
    if (history.length === 0) { document.getElementById('trend-insight').innerHTML = '📭 No data available. Start logging your productivity to see trends!'; return; }
    const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const recentData = sorted.slice(-30);
    const labels = recentData.map(entry => { const d = new Date(entry.timestamp); return `${d.getMonth()+1}/${d.getDate()}`; });
    const productivityData = recentData.map(entry => parseInt(entry.productivity));
    const hoursData = recentData.map(entry => parseFloat(entry.totalHours));
    const ctx = document.getElementById('productivityTrendChart').getContext('2d');
    if (productivityChart) productivityChart.destroy();
    productivityChart = new Chart(ctx, {
        type: 'line', data: { labels, datasets: [
            { label: 'Productivity Rating', data: productivityData, borderColor: '#1B4D3E', backgroundColor: 'rgba(27, 77, 62, 0.1)', borderWidth: 3, tension: 0.4, fill: true, pointRadius: 5, pointBackgroundColor: '#1B4D3E', pointBorderColor: '#fff', yAxisID: 'y' },
            { label: 'Hours Worked', data: hoursData, borderColor: '#D4A574', backgroundColor: 'rgba(212, 165, 116, 0.1)', borderWidth: 2, tension: 0.4, fill: false, pointRadius: 4, pointBackgroundColor: '#D4A574', pointBorderColor: '#fff', yAxisID: 'y1' }
        ] }, options: { responsive: true, maintainAspectRatio: true, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'top', labels: { font: { family: 'Sora', size: 12 } } }, tooltip: { callbacks: { label: function(ctx) { return `${ctx.dataset.label}: ${ctx.raw}${ctx.dataset.label.includes('Productivity') ? '/10' : ' hours'}`; } } } }, scales: { y: { title: { display: true, text: 'Productivity Rating (/10)' }, min: 0, max: 10, ticks: { stepSize: 1 } }, y1: { position: 'right', title: { display: true, text: 'Hours Worked' }, grid: { drawOnChartArea: false } }, x: { title: { display: true, text: 'Date' }, ticks: { maxRotation: 45, minRotation: 45 } } } }
    });
    const avgProductivity = (productivityData.reduce((a,b) => a+b, 0) / productivityData.length).toFixed(1);
    const trend = productivityData[productivityData.length-1] - productivityData[0];
    const trendText = trend > 0 ? '↑ increasing' : trend < 0 ? '↓ decreasing' : '→ stable';
    document.getElementById('trend-insight').innerHTML = `📊 <strong>Productivity Insight:</strong> Your average productivity is <strong>${avgProductivity}/10</strong> with a ${trendText} trend. ${trend > 0 ? 'Great job improving!' : trend < 0 ? 'Focus on consistency to boost your scores.' : 'Keep maintaining your steady performance!'}`;
}

function loadMoodDistributionChart() {
    const history = getHistory();
    if (history.length === 0) { document.getElementById('mood-insight').innerHTML = '📭 No data available. Log your moods to see distribution!'; return; }
    const moodMap = { '🔥': { count: 0, label: '🔥 Focused' }, '😊': { count: 0, label: '😊 Happy' }, '😴': { count: 0, label: '😴 Tired' } };
    history.forEach(entry => { if (moodMap[entry.mood]) moodMap[entry.mood].count++; });
    const labels = Object.values(moodMap).map(m => m.label);
    const counts = Object.values(moodMap).map(m => m.count);
    const moodProductivity = { '🔥': { sum: 0, count: 0 }, '😊': { sum: 0, count: 0 }, '😴': { sum: 0, count: 0 } };
    history.forEach(entry => { if (moodProductivity[entry.mood]) { moodProductivity[entry.mood].sum += parseInt(entry.productivity); moodProductivity[entry.mood].count++; } });
    const avgByMood = Object.keys(moodProductivity).map(mood => { const d = moodProductivity[mood]; return d.count > 0 ? (d.sum / d.count).toFixed(1) : 0; });
    const ctx = document.getElementById('moodDistributionChart').getContext('2d');
    if (moodChart) moodChart.destroy();
    moodChart = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Number of Days', data: counts, backgroundColor: ['#1B4D3E', '#2A7F6F', '#D4A574'], borderRadius: 8, yAxisID: 'y' }, { label: 'Avg Productivity (when in this mood)', data: avgByMood, type: 'line', borderColor: '#EF4444', borderWidth: 2, fill: false, tension: 0.3, pointRadius: 6, pointBackgroundColor: '#EF4444', pointBorderColor: '#fff', yAxisID: 'y1' }] }, options: { responsive: true, maintainAspectRatio: true, scales: { y: { title: { display: true, text: 'Number of Days' }, ticks: { stepSize: 1 } }, y1: { position: 'right', title: { display: true, text: 'Average Productivity (/10)' }, min: 0, max: 10, grid: { drawOnChartArea: false } } } } });
    let bestMood = '', bestAvg = 0;
    Object.keys(moodProductivity).forEach(mood => { const avg = moodProductivity[mood].count > 0 ? moodProductivity[mood].sum / moodProductivity[mood].count : 0; if (avg > bestAvg) { bestAvg = avg; bestMood = mood === '🔥' ? 'Focused' : mood === '😊' ? 'Happy' : 'Tired'; } });
    document.getElementById('mood-insight').innerHTML = `😊 <strong>Mood Analysis:</strong> You feel ${bestMood} most productive (${bestAvg.toFixed(1)}/10). ${bestMood === 'Focused' ? 'Keep maintaining that focused state!' : bestMood === 'Happy' ? 'Happiness boosts your productivity!' : 'Try to get more rest for better results.'}`;
}

function loadHeatmapCalendar() {
    const history = getHistory();
    if (history.length === 0) { document.getElementById('heatmap-insight').innerHTML = '📭 No data available. Start logging to see your productivity heatmap!'; return; }
    const productivityMap = new Map();
    history.forEach(entry => { const dateKey = new Date(entry.timestamp).toLocaleDateString(); productivityMap.set(dateKey, parseInt(entry.productivity)); });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = [];
    for (let i = 89; i >= 0; i--) { const date = new Date(today); date.setDate(today.getDate() - i); dates.push(date); }
    const heatmapHTML = dates.map(date => {
        const dateKey = date.toLocaleDateString();
        const productivity = productivityMap.get(dateKey);
        const dayNum = date.getDate();
        if (productivity) return `<div class="heatmap-day productivity-${productivity}" title="${date.toLocaleDateString()}: ${productivity}/10"><div>${dayNum}</div><div class="day-date">${date.toLocaleDateString('en', { weekday: 'short' })}</div></div>`;
        else return `<div class="heatmap-day" style="background: #F3F4F6; color: #9CA3AF;" title="${date.toLocaleDateString()}: No data"><div>${dayNum}</div><div class="day-date">${date.toLocaleDateString('en', { weekday: 'short' })}</div></div>`;
    }).join('');
    const legendHTML = `<div class="heatmap-legend"><div class="legend-item"><div class="legend-color productivity-1"></div><span>Low (1-3)</span></div><div class="legend-item"><div class="legend-color productivity-4"></div><span>Below Avg (4-5)</span></div><div class="legend-item"><div class="legend-color productivity-6"></div><span>Average (6-7)</span></div><div class="legend-item"><div class="legend-color productivity-8"></div><span>Good (8-9)</span></div><div class="legend-item"><div class="legend-color productivity-10"></div><span>Excellent (10)</span></div></div>`;
    document.getElementById('heatmap-calendar').innerHTML = heatmapHTML + legendHTML;
    let currentStreak = 0, bestStreak = 0, tempStreak = 0;
    for (let i = 0; i <= 90; i++) { const date = new Date(today); date.setDate(today.getDate() - i); const dateKey = date.toLocaleDateString(); if (productivityMap.has(dateKey)) { tempStreak++; bestStreak = Math.max(bestStreak, tempStreak); if (i === 0) currentStreak = tempStreak; } else tempStreak = 0; }
    document.getElementById('heatmap-insight').innerHTML = `🔥 <strong>Consistency Tracker:</strong> Current streak: <strong>${currentStreak}</strong> days | Best streak: <strong>${bestStreak}</strong> days. ${currentStreak >= 7 ? 'Amazing consistency! 🎉' : currentStreak >= 3 ? 'Great momentum! Keep going!' : 'Start building your streak today!'}`;
}

function loadCorrelationChart() {
    const history = getHistory();
    if (history.length === 0) { document.getElementById('correlation-insight').innerHTML = '📭 No data available. Log entries to see correlation between hours and productivity!'; return; }
    const scatterData = history.map(entry => ({ x: parseFloat(entry.totalHours), y: parseInt(entry.productivity), mood: entry.mood }));
    const focusedData = scatterData.filter(d => d.mood === '🔥');
    const happyData = scatterData.filter(d => d.mood === '😊');
    const tiredData = scatterData.filter(d => d.mood === '😴');
    const hours = scatterData.map(d => d.x);
    const productivity = scatterData.map(d => d.y);
    const correlation = (() => { const n = hours.length; if (n < 2) return 0; const sumX = hours.reduce((a, b) => a + b, 0); const sumY = productivity.reduce((a, b) => a + b, 0); const sumXY = hours.reduce((sum, xi, i) => sum + xi * productivity[i], 0); const sumX2 = hours.reduce((sum, xi) => sum + xi * xi, 0); const sumY2 = productivity.reduce((sum, yi) => sum + yi * yi, 0); const numerator = n * sumXY - sumX * sumY; const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)); return denominator === 0 ? 0 : numerator / denominator; })();
    const ctx = document.getElementById('correlationChart').getContext('2d');
    if (correlationChart) correlationChart.destroy();
    correlationChart = new Chart(ctx, { type: 'scatter', data: { datasets: [{ label: '🔥 Focused', data: focusedData, backgroundColor: '#1B4D3E', pointRadius: 8 }, { label: '😊 Happy', data: happyData, backgroundColor: '#2A7F6F', pointRadius: 8 }, { label: '😴 Tired', data: tiredData, backgroundColor: '#D4A574', pointRadius: 8 }] }, options: { responsive: true, maintainAspectRatio: true, scales: { x: { title: { display: true, text: 'Hours Worked' }, min: 0, max: 12, ticks: { stepSize: 1 } }, y: { title: { display: true, text: 'Productivity Rating (/10)' }, min: 0, max: 10, ticks: { stepSize: 1 } } }, plugins: { tooltip: { callbacks: { label: (ctx) => { const p = ctx.raw; return [`Hours: ${p.x}h`, `Productivity: ${p.y}/10`, `Mood: ${p.mood}`]; } } } } } });
    let correlationText = '', recommendation = '';
    if (Math.abs(correlation) < 0.3) { correlationText = 'weak'; recommendation = 'Hours worked doesn\'t strongly predict your productivity. Focus on quality over quantity!'; }
    else if (Math.abs(correlation) < 0.7) { correlationText = 'moderate'; recommendation = correlation > 0 ? 'More hours generally means higher productivity, but find your sweet spot.' : 'Working fewer hours might actually boost your productivity!'; }
    else { correlationText = 'strong'; recommendation = correlation > 0 ? 'There\'s a strong positive relationship. Consider optimizing your workflow during peak hours.' : 'Strong inverse relationship - you\'re most productive with fewer hours. Take more breaks!'; }
    const direction = correlation > 0 ? 'positive' : 'negative';
    document.getElementById('correlation-insight').innerHTML = `📈 <strong>Correlation Analysis:</strong> ${correlationText} ${direction} correlation (r = ${correlation.toFixed(2)}) between hours worked and productivity.<br><br>💡 <strong>Recommendation:</strong> ${recommendation}`;
}

// ===== NOTIFICATIONS & REMINDERS ===== (preserved)
function requestNotificationPermission() {
    if (!("Notification" in window)) { showAlert("❌ Your browser doesn't support desktop notifications", "error"); return; }
    if (Notification.permission === "granted") { notificationPermissionGranted = true; showAlert("✅ Notifications already enabled!", "success"); showReminderSettings(); checkMissedDays(); return; }
    if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") { notificationPermissionGranted = true; showAlert("✅ Notifications enabled! You'll receive daily reminders.", "success"); showReminderSettings(); sendTestNotification(); setupReminderSystem(); checkMissedDays(); }
            else showAlert("⚠️ Notification permission denied.", "error");
        });
    } else showAlert("🔕 Notifications are blocked. Please check your browser settings.", "error");
}

function showReminderSettings() {
    const settingsCard = document.getElementById("reminder-settings");
    if (settingsCard) { settingsCard.style.display = "block"; loadReminderSettings(); }
}

function toggleReminderSettings() {
    const controls = document.querySelector('.reminder-controls');
    if (controls) controls.style.display = controls.style.display === 'none' ? 'flex' : 'none';
}

function loadReminderSettings() {
    const dailyReminder = localStorage.getItem("dailyReminderEnabled") === "true";
    const weeklyReport = localStorage.getItem("weeklyReportEnabled") === "true";
    const nudgeEnabled = localStorage.getItem("nudgeEnabled") === "true";
    const reminderTime = localStorage.getItem("reminderTime") || "20:00";
    document.getElementById("daily-reminder-toggle").checked = dailyReminder;
    document.getElementById("weekly-report-toggle").checked = weeklyReport;
    document.getElementById("nudge-toggle").checked = nudgeEnabled;
    document.getElementById("reminder-time").value = reminderTime;
    if (dailyReminder) { document.getElementById("reminder-time-group").style.display = "flex"; scheduleDailyReminder(reminderTime); }
    if (weeklyReport) scheduleWeeklyReport();
    if (nudgeEnabled) startNudgeChecker();
}

function toggleDailyReminder() {
    const enabled = document.getElementById("daily-reminder-toggle").checked;
    localStorage.setItem("dailyReminderEnabled", enabled);
    if (enabled) {
        document.getElementById("reminder-time-group").style.display = "flex";
        const time = document.getElementById("reminder-time").value;
        scheduleDailyReminder(time);
        showAlert("✅ Daily reminder enabled!", "success");
        sendTestNotification();
    } else {
        document.getElementById("reminder-time-group").style.display = "none";
        if (reminderCheckInterval) { clearInterval(reminderCheckInterval); reminderCheckInterval = null; }
        showAlert("🔕 Daily reminder disabled", "info");
    }
}

function saveReminderTime() {
    const time = document.getElementById("reminder-time").value;
    localStorage.setItem("reminderTime", time);
    if (localStorage.getItem("dailyReminderEnabled") === "true") { scheduleDailyReminder(time); showAlert(`⏰ Reminder time set to ${time}`, "success"); }
}

function scheduleDailyReminder(time) {
    if (reminderCheckInterval) clearInterval(reminderCheckInterval);
    function checkReminder() {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        if (currentTime === time) {
            const lastLogDate = localStorage.getItem("lastLogDate");
            const today = new Date().toLocaleDateString();
            if (lastLogDate !== today) sendNotification("📝 Daily Productivity Reminder", "Don't forget to log your productivity for today! Click here to open the app.", "daily");
        }
    }
    reminderCheckInterval = setInterval(checkReminder, 60000);
    checkReminder();
}

function toggleWeeklyReport() {
    const enabled = document.getElementById("weekly-report-toggle").checked;
    localStorage.setItem("weeklyReportEnabled", enabled);
    if (enabled) { scheduleWeeklyReport(); showAlert("📊 Weekly report enabled! You'll receive summaries on Sundays.", "success"); }
    else showAlert("📊 Weekly report disabled", "info");
}

function scheduleWeeklyReport() {
    function checkWeeklyReport() {
        const now = new Date();
        if (now.getDay() === 0 && now.getHours() === 9 && now.getMinutes() === 0) generateAndSendWeeklyReport();
    }
    setInterval(checkWeeklyReport, 3600000);
    setTimeout(() => generateAndSendWeeklyReport(), 1000);
}

function generateAndSendWeeklyReport() {
    const history = getHistory();
    const lastReportDate = localStorage.getItem("lastWeeklyReport");
    const today = new Date().toLocaleDateString();
    if (lastReportDate === today) return;
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekEntries = history.filter(h => new Date(h.timestamp) >= oneWeekAgo);
    if (weekEntries.length === 0) { sendNotification("📊 Weekly Productivity Report", "No entries logged this week. Start tracking to see insights!", "weekly"); localStorage.setItem("lastWeeklyReport", today); return; }
    const avgProductivity = (weekEntries.reduce((sum, h) => sum + parseInt(h.productivity), 0) / weekEntries.length).toFixed(1);
    const totalHours = weekEntries.reduce((sum, h) => sum + parseFloat(h.totalHours), 0).toFixed(1);
    const bestDay = weekEntries.reduce((best, current) => parseInt(current.productivity) > parseInt(best.productivity) ? current : best, weekEntries[0]);
    sendNotification("📊 Your Weekly Productivity Report", `Avg: ${avgProductivity}/10 | Hours: ${totalHours}h | Best day: ${bestDay.date}`, "weekly");
    localStorage.setItem("lastWeeklyReport", today);
}

function toggleNudge() {
    const enabled = document.getElementById("nudge-toggle").checked;
    localStorage.setItem("nudgeEnabled", enabled);
    if (enabled) { startNudgeChecker(); showAlert("🔔 Gentle nudges enabled - you'll be reminded if you miss logging for 3 days", "success"); }
    else showAlert("🔕 Gentle nudges disabled", "info");
}

function startNudgeChecker() {
    function checkMissedDays() {
        const history = getHistory();
        if (history.length === 0) return;
        const lastEntry = history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        const lastLogDate = new Date(lastEntry.timestamp);
        const today = new Date();
        const daysDiff = Math.floor((today - lastLogDate) / (1000 * 60 * 60 * 24));
        const lastNudgeSent = localStorage.getItem("lastNudgeSent");
        const todayStr = today.toLocaleDateString();
        if (daysDiff >= 3 && lastNudgeSent !== todayStr) { sendNotification("👋 Haven't seen you in a while!", `It's been ${daysDiff} days since your last log. Your productivity journey misses you!`, "nudge"); localStorage.setItem("lastNudgeSent", todayStr); }
    }
    checkMissedDays();
    setInterval(checkMissedDays, 86400000);
}

function checkMissedDays() {
    const nudgeEnabled = localStorage.getItem("nudgeEnabled") === "true";
    if (!nudgeEnabled) return;
    const history = getHistory();
    if (history.length === 0) return;
    const lastEntry = history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    const lastLogDate = new Date(lastEntry.timestamp);
    const today = new Date();
    const daysDiff = Math.floor((today - lastLogDate) / (1000 * 60 * 60 * 24));
    if (daysDiff >= 3) { const lastNudgeSent = localStorage.getItem("lastNudgeSent"); const todayStr = today.toLocaleDateString(); if (lastNudgeSent !== todayStr) { setTimeout(() => { sendNotification("👋 Time to check in!", `It's been ${daysDiff} days since your last productivity log. Small steps every day lead to big results!`, "nudge"); localStorage.setItem("lastNudgeSent", todayStr); }, 5000); } }
}

function sendNotification(title, body, type) {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const options = { body, icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%231B4D3E'/%3E%3Ctext x='50' y='67' font-size='50' text-anchor='middle' fill='white'%3E📊%3C/text%3E%3C/svg%3E", tag: type, requireInteraction: type === "nudge" || type === "weekly" };
    const notification = new Notification(title, options);
    notification.onclick = function() { window.focus(); const mainScreen = document.getElementById("main-screen"); const historyScreen = document.getElementById("history-screen"); if (historyScreen && !historyScreen.classList.contains("hidden")) backToDashboard(); if (mainScreen && mainScreen.classList.contains("hidden")) { document.getElementById("login-screen").classList.add("hidden"); mainScreen.classList.remove("hidden"); } document.getElementById("planning-form").scrollIntoView({ behavior: "smooth" }); notification.close(); };
    setTimeout(() => notification.close(), 10000);
    return notification;
}

function sendTestNotification() { setTimeout(() => sendNotification("🔔 Reminders Active!", "You'll receive daily reminders at your chosen time. Stay productive! 💪", "test"), 1000); }

function setupReminderSystem() { if (Notification.permission === "granted") loadReminderSettings(); }

function getBestWorkTimeSuggestions() {
    const history = getHistory();
    if (history.length < 5) return "Log at least 5 entries to get personalized work time suggestions!";
    const highProdDays = history.filter(h => h.productivity >= 8);
    const lowProdDays = history.filter(h => h.productivity <= 4);
    let suggestion = "";
    if (highProdDays.length > 0) {
        const avgHoursHigh = (highProdDays.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) / highProdDays.length).toFixed(1);
        const avgBlocksHigh = (highProdDays.reduce((sum, h) => sum + parseInt(h.blocks), 0) / highProdDays.length).toFixed(0);
        suggestion = `🎯 Based on your best days (${highProdDays.length} days with 8+ productivity):\n• Optimal work duration: ${avgHoursHigh} hours\n• Best block count: ${avgBlocksHigh} blocks\n• ${avgHoursHigh <= 6 ? "Shorter focused sessions work better for you!" : "You can handle longer work sessions effectively!"}`;
    }
    if (lowProdDays.length > 0) {
        const avgHoursLow = (lowProdDays.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) / lowProdDays.length).toFixed(1);
        suggestion += `\n\n⚠️ On low productivity days (${lowProdDays.length} days), you worked ${avgHoursLow} hours on average. Consider taking more breaks!`;
    }
    const moodProductivity = { "🔥": 0, "😊": 0, "😴": 0 };
    const moodCounts = { "🔥": 0, "😊": 0, "😴": 0 };
    history.forEach(h => { moodProductivity[h.mood] += parseInt(h.productivity); moodCounts[h.mood]++; });
    let bestMood = "", bestScore = 0;
    for (const mood in moodProductivity) { if (moodCounts[mood] > 0) { const avg = moodProductivity[mood] / moodCounts[mood]; if (avg > bestScore) { bestScore = avg; bestMood = mood === "🔥" ? "Focused" : mood === "😊" ? "Happy" : "Tired"; } } }
    suggestion += `\n\n😊 Your peak productivity mood: ${bestMood} (${bestScore.toFixed(1)}/10). Try to cultivate this state before work!`;
    return suggestion;
}

function displayWorkTimeSuggestion() {
    const suggestion = getBestWorkTimeSuggestions();
    const suggestionContainer = document.getElementById("work-time-suggestion");
    if (suggestionContainer) { suggestionContainer.innerHTML = `<h4>⏰ Personalized Work Suggestion</h4><p>${suggestion.replace(/\n/g, '<br>')}</p>`; suggestionContainer.style.display = "block"; }
}

function addWorkTimeSuggestionCard() { displayWorkTimeSuggestion(); }

// Initialize everything including theme
document.addEventListener('DOMContentLoaded', function() {
    initTheme(); // Initialize dark/light mode
    const defaultMoodBtn = document.querySelector('[data-mood="😊"]');
    if (defaultMoodBtn) defaultMoodBtn.classList.add('active');
    if (Notification.permission === "granted") { notificationPermissionGranted = true; setupReminderSystem(); }
});

document.addEventListener('click', function(e) { const modal = document.getElementById('detail-modal'); if (e.target === modal) closeDetailModal(); });