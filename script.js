// ============================================
// COMPLETE JAVASCRIPT - FULLY FUNCTIONAL ANALYTICS DASHBOARD
// INCLUDING DARK/LIGHT MODE TOGGLE & BLOCK ASSIGNMENT
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

// NEW: Store block-specific assignment
let blockAssignmentMap = {};
let blockAssignmentFinished = false;

// ============================================
// DARK/LIGHT MODE TOGGLE IMPLEMENTATION
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
        renderBlockAssignmentUI();
        blockAssignmentFinished = false;
        document.getElementById('assignmentStatusMsg').innerHTML = '';
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
    renderBlockAssignmentUI();
    blockAssignmentFinished = false;
    document.getElementById('assignmentStatusMsg').innerHTML = '';
}

// Block Assignment UI
function renderBlockAssignmentUI() {
    const blocksCount = parseInt(document.getElementById('blocks').value) || 1;
    const container = document.getElementById('blockAssignmentContainer');
    if (!container) return;
    if (taskList.length === 0) {
        container.innerHTML = `<div style="padding: 12px; background: var(--bg-light); border-radius: 12px; color: var(--text-muted);"><span>⚠️ Add at least one task above to assign to blocks.</span></div>`;
        return;
    }
    let html = `<div style="display: flex; flex-direction: column; gap: 14px;">`;
    for (let i = 0; i < blocksCount; i++) {
        const currentBlockName = getBlockNameByIndex(i);
        const selectedVal = blockAssignmentMap[i] || '';
        html += `<div class="block-assign-row" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; background: var(--card-bg); padding: 8px 12px; border-radius: 12px; border: 1px solid var(--border-color);">
                    <strong style="min-width: 110px;">📌 ${escapeHtml(currentBlockName)}</strong>
                    <select data-block-index="${i}" class="block-task-select" style="flex:1; padding: 10px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-dark);">
                        <option value="">— Select a task —</option>
                        ${taskList.map(task => `<option value="${escapeHtml(task)}" ${selectedVal === task ? 'selected' : ''}>${escapeHtml(task)}</option>`).join('')}
                    </select>
                </div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
    document.querySelectorAll('.block-task-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const blockIdx = parseInt(select.getAttribute('data-block-index'));
            const selectedTask = select.value;
            if (selectedTask) blockAssignmentMap[blockIdx] = selectedTask;
            else delete blockAssignmentMap[blockIdx];
            blockAssignmentFinished = false;
            document.getElementById('assignmentStatusMsg').innerHTML = '';
        });
    });
}

function getBlockNameByIndex(idx) {
    const blockTasksRaw = document.getElementById('block-tasks').value;
    if (!blockTasksRaw) return `Block ${idx+1}`;
    const parts = blockTasksRaw.split(',').map(s => s.trim());
    if (parts[idx]) return parts[idx];
    return `Block ${idx+1}`;
}

function finalizeBlockAssignments() {
    const blocksCount = parseInt(document.getElementById('blocks').value) || 1;
    const missingBlocks = [];
    for (let i = 0; i < blocksCount; i++) {
        if (!blockAssignmentMap[i]) missingBlocks.push(i+1);
    }
    if (missingBlocks.length > 0) {
        showAlert(`⚠️ Please assign a task to Block(s) ${missingBlocks.join(', ')} before finishing.`, "error");
        return false;
    }
    if (taskList.length === 0) {
        showAlert("❌ Please add at least one task before assigning.", "error");
        return false;
    }
    blockAssignmentFinished = true;
    document.getElementById('assignmentStatusMsg').innerHTML = '✅ Block assignments finalized! You can now rate productivity.';
    showAlert("✅ Great! Block tasks assigned. You can now rate your expected productivity.", "success");
    return true;
}

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
    blockAssignmentMap = {};
    blockAssignmentFinished = false;
    document.getElementById('assignmentStatusMsg').innerHTML = '';
    renderBlockAssignmentUI();
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
    if (Notification.permission === "granted") { showReminderSettings(); setupReminderSystem(); }
    addWorkTimeSuggestionCard();
    renderBlockAssignmentUI();
}

function logout() {
    document.getElementById("main-screen").classList.add("hidden");
    document.getElementById("history-screen").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("summary").classList.add("hidden");
    taskList = [];
    blockAssignmentMap = {};
    blockAssignmentFinished = false;
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
        renderBlockAssignmentUI();
        blockAssignmentFinished = false;
        document.getElementById('assignmentStatusMsg').innerHTML = '';
    }
    totalHoursInput.addEventListener("input", autoGenerateBlocks);
    blocksInput.addEventListener("input", autoGenerateBlocks);
    ratingSlider.addEventListener("input", () => ratingValue.textContent = ratingSlider.value);
    if (taskInput) taskInput.addEventListener("keypress", e => { if (e.key === "Enter") { e.preventDefault(); addTask(); } });
    const finalizeBtn = document.getElementById("finalizeBlockTasksBtn");
    if (finalizeBtn) finalizeBtn.onclick = () => finalizeBlockAssignments();
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
    if (!blockAssignmentFinished) {
        showAlert("📋 Before rating productivity, please click 'Mark Block Tasks as Finished' to confirm which task you'll work on in each block.", "error");
        return;
    }
    const blocksCount = parseInt(blocks);
    let assignmentText = "";
    for (let i=0; i<blocksCount; i++) {
        const blockLabel = getBlockNameByIndex(i);
        const assignedTask = blockAssignmentMap[i] || "Not assigned";
        assignmentText += `${blockLabel} → ${assignedTask}; `;
    }
    const hoursPerBlock = (parseFloat(totalHours) / parseInt(blocks)).toFixed(1);
    displaySummary({ tasks, blockTasks, totalHours, blocks, hoursPerBlock, productivity, comments, mood, assignmentText });
    generateLessons(mood, tasks, productivity, comments, assignmentText);
    const entryData = {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        tasks, mood, blockTasks, totalHours, blocks, hoursPerBlock, productivity, comments,
        blockAssignment: assignmentText,
        timestamp: new Date().toISOString(),
        id: Date.now()
    };
    saveToHistory(entryData);
    localStorage.setItem("lastLogDate", new Date().toLocaleDateString());
    showAlert("✅ Today's entry saved successfully!", "success");
    setTimeout(() => { displayWorkTimeSuggestion(); }, 500);
    setTimeout(() => document.getElementById("summary").scrollIntoView({ behavior: "smooth" }), 300);
    blockAssignmentFinished = false;
    document.getElementById('assignmentStatusMsg').innerHTML = '';
    renderBlockAssignmentUI();
}

function displaySummary(data) {
    document.getElementById("sum-tasks").textContent = data.tasks;
    document.getElementById("sum-block-tasks").textContent = data.blockTasks;
    document.getElementById("sum-hours").textContent = `${data.totalHours} hours`;
    document.getElementById("sum-blocks").textContent = data.blocks;
    document.getElementById("sum-per-block").textContent = data.hoursPerBlock;
    document.getElementById("sum-rating").textContent = `${data.productivity}/10`;
    document.getElementById("sum-comments").textContent = data.comments || "No notes added.";
    document.getElementById("sum-block-assignment").textContent = data.assignmentText || "No assignment recorded";
    document.getElementById("summary").classList.remove("hidden");
}

function generateLessons(mood, tasks, productivity, comments, assignmentText) {
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
        <li><strong>🎯 Block Plan:</strong> ${escapeHtml(assignmentText)}</li>
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
    const statsGrid = document.getElementById("statsGrid");
    if (!statsGrid) return;
    if (history.length === 0) {
        statsGrid.innerHTML = `<div class="stat-card"><div class="stat-icon">📋</div><div class="stat-content"><span class="stat-label">Total Entries</span><span class="stat-number">0</span></div></div><div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-content"><span class="stat-label">Avg Productivity</span><span class="stat-number">0</span><span class="stat-unit">/10</span></div></div><div class="stat-card"><div class="stat-icon">⏱️</div><div class="stat-content"><span class="stat-label">Avg Work Hours</span><span class="stat-number">0</span><span class="stat-unit">h</span></div></div><div class="stat-card"><div class="stat-icon">🔥</div><div class="stat-content"><span class="stat-label">Most Common Mood</span><span class="stat-number">-</span></div></div>`;
        return;
    }
    const avgProductivity = (history.reduce((sum, h) => sum + parseInt(h.productivity), 0) / history.length).toFixed(1);
    const avgHours = (history.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) / history.length).toFixed(1);
    const moodCounts = {};
    history.forEach(h => moodCounts[h.mood] = (moodCounts[h.mood] || 0) + 1);
    const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b, "🔥");
    statsGrid.innerHTML = `<div class="stat-card"><div class="stat-icon">📋</div><div class="stat-content"><span class="stat-label">Total Entries</span><span class="stat-number">${history.length}</span></div></div><div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-content"><span class="stat-label">Avg Productivity</span><span class="stat-number">${avgProductivity}</span><span class="stat-unit">/10</span></div></div><div class="stat-card"><div class="stat-icon">⏱️</div><div class="stat-content"><span class="stat-label">Avg Work Hours</span><span class="stat-number">${avgHours}</span><span class="stat-unit">h</span></div></div><div class="stat-card"><div class="stat-icon">🔥</div><div class="stat-content"><span class="stat-label">Most Common Mood</span><span class="stat-number">${mostCommonMood}</span></div></div>`;
}

function displayHistoryList(historyData) {
    const historyList = document.getElementById("history-list");
    if (historyData.length === 0) {
        historyList.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No entries found. Start tracking your productivity!</p></div>`;
        return;
    }
    historyList.innerHTML = historyData.map(entry => `<div class="history-item" onclick="showDetailModal('${entry.id}')"><div class="history-item-header"><div class="history-date"><span class="date-day">${new Date(entry.timestamp).toLocaleDateString('en-GB', {weekday: 'short'})}</span><span class="date-full">${entry.date}</span><span class="date-time">${entry.time}</span></div><div class="history-mood">${entry.mood}</div></div><div class="history-item-content"><div class="history-quick-stats"><div class="quick-stat"><span class="stat-icon">⏱️</span><span class="stat-text">${entry.totalHours}h</span></div><div class="quick-stat"><span class="stat-icon">📊</span><span class="stat-text">${entry.productivity}/10</span></div><div class="quick-stat"><span class="stat-icon">📦</span><span class="stat-text">${entry.blocks} blocks</span></div></div><p class="history-tasks"><strong>Tasks:</strong> ${escapeHtml(entry.tasks.substring(0, 60))}${entry.tasks.length > 60 ? '...' : ''}</p></div><div class="history-item-action"><span class="view-details">View Details →</span></div></div>`).join('');
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

function resetFilters() { document.getElementById("mood-filter").value = ""; document.getElementById("productivity-filter").value = ""; loadHistoryData(); }

function showDetailModal(entryId) {
    const history = getHistory();
    const entry = history.find(h => h.id == entryId);
    if (!entry) return;
    document.getElementById("detail-content").innerHTML = `<div class="detail-header"><h2 class="detail-title">${entry.date}</h2><p class="detail-time">${entry.time}</p></div><div class="detail-grid"><div class="detail-item"><span class="detail-label">Mood</span><span class="detail-value">${entry.mood}</span></div><div class="detail-item"><span class="detail-label">Productivity</span><span class="detail-value">${entry.productivity}/10</span></div><div class="detail-item"><span class="detail-label">Work Hours</span><span class="detail-value">${entry.totalHours}h</span></div><div class="detail-item"><span class="detail-label">Blocks</span><span class="detail-value">${entry.blocks}</span></div></div><div class="detail-section"><h3>📋 Tasks</h3><p>${escapeHtml(entry.tasks)}</p></div><div class="detail-section"><h3>⏱️ Block Assignment</h3><p>${escapeHtml(entry.blockAssignment || "No details")}</p></div><div class="detail-section"><h3>📝 Notes</h3><p>${escapeHtml(entry.comments) || 'No notes added.'}</p></div><div class="detail-actions"><button onclick="deleteHistoryEntry(${entry.id})" class="btn btn-secondary btn-danger">🗑️ Delete Entry</button></div>`;
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
    if(confirm("⚠️ This will delete ALL your entries. Are you sure?")) {
        if(confirm("Really? This cannot be undone!")) {
            localStorage.removeItem("productivityHistory");
            loadHistoryData();
            showAlert("✅ All entries cleared!", "success");
        }
    }
}

function showAlert(message, type = "info") {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `position: fixed; top: 20px; right: 20px; background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'}; color: white; padding: 16px 24px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 9999; animation: slideInDown 0.4s ease-out; font-weight: 600;`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => { alertDiv.style.animation = 'slideInUp 0.4s ease-out reverse'; setTimeout(() => alertDiv.remove(), 400); }, 2500);
}

// ============================================
// ANALYTICS DASHBOARD - FULLY FUNCTIONAL CHARTS
// ============================================

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
    const ctx = document.getElementById('productivityTrendChart').getContext('2d');
    if (history.length === 0) {
        document.getElementById('trend-insight').innerHTML = '📭 No data available. Start logging your productivity to see trends!';
        if (productivityChart) productivityChart.destroy();
        return;
    }
    const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const recentData = sorted.slice(-30);
    const labels = recentData.map(entry => { const d = new Date(entry.timestamp); return `${d.getMonth()+1}/${d.getDate()}`; });
    const productivityData = recentData.map(entry => parseInt(entry.productivity));
    const hoursData = recentData.map(entry => parseFloat(entry.totalHours));
    if (productivityChart) productivityChart.destroy();
    productivityChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [
            { label: 'Productivity Rating', data: productivityData, borderColor: '#1B4D3E', backgroundColor: 'rgba(27, 77, 62, 0.1)', borderWidth: 3, tension: 0.4, fill: true, pointRadius: 5, pointBackgroundColor: '#1B4D3E', pointBorderColor: '#fff', yAxisID: 'y' },
            { label: 'Hours Worked', data: hoursData, borderColor: '#D4A574', backgroundColor: 'rgba(212, 165, 116, 0.1)', borderWidth: 2, tension: 0.4, fill: false, pointRadius: 4, pointBackgroundColor: '#D4A574', pointBorderColor: '#fff', yAxisID: 'y1' }
        ] },
        options: { responsive: true, maintainAspectRatio: true, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'top', labels: { font: { family: 'Sora', size: 12 } } }, tooltip: { callbacks: { label: function(ctx) { return `${ctx.dataset.label}: ${ctx.raw}${ctx.dataset.label.includes('Productivity') ? '/10' : ' hours'}`; } } } }, scales: { y: { title: { display: true, text: 'Productivity Rating (/10)' }, min: 0, max: 10, ticks: { stepSize: 1 } }, y1: { position: 'right', title: { display: true, text: 'Hours Worked' }, grid: { drawOnChartArea: false } }, x: { title: { display: true, text: 'Date' }, ticks: { maxRotation: 45, minRotation: 45 } } } }
    });
    const avgProductivity = (productivityData.reduce((a,b) => a+b, 0) / productivityData.length).toFixed(1);
    const trend = productivityData[productivityData.length-1] - productivityData[0];
    const trendText = trend > 0 ? '↑ increasing' : trend < 0 ? '↓ decreasing' : '→ stable';
    document.getElementById('trend-insight').innerHTML = `📊 <strong>Productivity Insight:</strong> Your average productivity is <strong>${avgProductivity}/10</strong> with a ${trendText} trend. ${trend > 0 ? 'Great job improving!' : trend < 0 ? 'Focus on consistency to boost your scores.' : 'Keep maintaining your steady performance!'}`;
}

function loadMoodDistributionChart() {
    const history = getHistory();
    const ctx = document.getElementById('moodDistributionChart').getContext('2d');
    if (history.length === 0) {
        document.getElementById('mood-insight').innerHTML = '📭 No data available. Log your moods to see distribution!';
        if (moodChart) moodChart.destroy();
        return;
    }
    const moodMap = { '🔥': { count: 0, label: '🔥 Focused' }, '😊': { count: 0, label: '😊 Happy' }, '😴': { count: 0, label: '😴 Tired' } };
    history.forEach(entry => { if (moodMap[entry.mood]) moodMap[entry.mood].count++; });
    const labels = Object.values(moodMap).map(m => m.label);
    const counts = Object.values(moodMap).map(m => m.count);
    const moodProductivity = { '🔥': { sum: 0, count: 0 }, '😊': { sum: 0, count: 0 }, '😴': { sum: 0, count: 0 } };
    history.forEach(entry => { if (moodProductivity[entry.mood]) { moodProductivity[entry.mood].sum += parseInt(entry.productivity); moodProductivity[entry.mood].count++; } });
    const avgByMood = Object.keys(moodProductivity).map(mood => { const d = moodProductivity[mood]; return d.count > 0 ? (d.sum / d.count).toFixed(1) : 0; });
    if (moodChart) moodChart.destroy();
    moodChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Number of Days', data: counts, backgroundColor: ['#1B4D3E', '#2A7F6F', '#D4A574'], borderRadius: 8, yAxisID: 'y' }, { label: 'Avg Productivity (when in this mood)', data: avgByMood, type: 'line', borderColor: '#EF4444', borderWidth: 2, fill: false, tension: 0.3, pointRadius: 6, pointBackgroundColor: '#EF4444', pointBorderColor: '#fff', yAxisID: 'y1' }] },
        options: { responsive: true, maintainAspectRatio: true, scales: { y: { title: { display: true, text: 'Number of Days' }, ticks: { stepSize: 1 } }, y1: { position: 'right', title: { display: true, text: 'Average Productivity (/10)' }, min: 0, max: 10, grid: { drawOnChartArea: false } } } }
    });
    let bestMood = '', bestAvg = 0;
    Object.keys(moodProductivity).forEach(mood => { const avg = moodProductivity[mood].count > 0 ? moodProductivity[mood].sum / moodProductivity[mood].count : 0; if (avg > bestAvg) { bestAvg = avg; bestMood = mood === '🔥' ? 'Focused' : mood === '😊' ? 'Happy' : 'Tired'; } });
    document.getElementById('mood-insight').innerHTML = `😊 <strong>Mood Analysis:</strong> You feel ${bestMood} most productive (${bestAvg.toFixed(1)}/10). ${bestMood === 'Focused' ? 'Keep maintaining that focused state!' : bestMood === 'Happy' ? 'Happiness boosts your productivity!' : 'Try to get more rest for better results.'}`;
}

function loadHeatmapCalendar() {
    const history = getHistory();
    if (history.length === 0) {
        document.getElementById('heatmap-calendar').innerHTML = '<div class="chart-insight">📭 No data available. Start logging to see your productivity heatmap!</div>';
        document.getElementById('heatmap-insight').innerHTML = '📭 No data available yet.';
        return;
    }
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
        const month = date.getMonth() + 1;
        if (productivity) {
            let colorClass = '';
            if (productivity <= 3) colorClass = 'productivity-1';
            else if (productivity <= 5) colorClass = 'productivity-4';
            else if (productivity <= 7) colorClass = 'productivity-6';
            else if (productivity <= 9) colorClass = 'productivity-8';
            else colorClass = 'productivity-10';
            return `<div class="heatmap-day ${colorClass}" style="background: var(--${colorClass === 'productivity-1' ? 'danger' : 'primary'}-light); padding: 8px; border-radius: 8px; text-align: center;" title="${date.toLocaleDateString()}: ${productivity}/10"><div><strong>${dayNum}/${month}</strong></div><div style="font-size: 0.7rem;">${productivity}/10</div></div>`;
        } else {
            return `<div class="heatmap-day" style="background: var(--bg-light); color: var(--text-muted); padding: 8px; border-radius: 8px; text-align: center;" title="${date.toLocaleDateString()}: No data"><div>${dayNum}/${month}</div><div style="font-size: 0.7rem;">—</div></div>`;
        }
    }).join('');
    const legendHTML = `<div class="heatmap-legend" style="display: flex; gap: 10px; justify-content: center; margin-top: 15px; flex-wrap: wrap;"><div class="legend-item"><div style="width: 20px; height: 20px; background: #FEE2E2; border-radius: 4px;"></div><span>Low (1-3)</span></div><div class="legend-item"><div style="width: 20px; height: 20px; background: #FED7AA; border-radius: 4px;"></div><span>Below Avg (4-5)</span></div><div class="legend-item"><div style="width: 20px; height: 20px; background: #FEF3C7; border-radius: 4px;"></div><span>Average (6-7)</span></div><div class="legend-item"><div style="width: 20px; height: 20px; background: #A7F3D0; border-radius: 4px;"></div><span>Good (8-9)</span></div><div class="legend-item"><div style="width: 20px; height: 20px; background: #34D399; border-radius: 4px;"></div><span>Excellent (10)</span></div></div>`;
    document.getElementById('heatmap-calendar').innerHTML = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;">${heatmapHTML}</div>${legendHTML}`;
    let currentStreak = 0, bestStreak = 0, tempStreak = 0;
    for (let i = 0; i <= 90; i++) { const date = new Date(today); date.setDate(today.getDate() - i); const dateKey = date.toLocaleDateString(); if (productivityMap.has(dateKey)) { tempStreak++; bestStreak = Math.max(bestStreak, tempStreak); if (i === 0) currentStreak = tempStreak; } else tempStreak = 0; }
    document.getElementById('heatmap-insight').innerHTML = `🔥 <strong>Consistency Tracker:</strong> Current streak: <strong>${currentStreak}</strong> days | Best streak: <strong>${bestStreak}</strong> days. ${currentStreak >= 7 ? 'Amazing consistency! 🎉' : currentStreak >= 3 ? 'Great momentum! Keep going!' : 'Start building your streak today!'}`;
}

function loadCorrelationChart() {
    const history = getHistory();
    const ctx = document.getElementById('correlationChart').getContext('2d');
    if (history.length === 0) {
        document.getElementById('correlation-insight').innerHTML = '📭 No data available. Log entries to see correlation between hours and productivity!';
        if (correlationChart) correlationChart.destroy();
        return;
    }
    const scatterData = history.map(entry => ({ x: parseFloat(entry.totalHours), y: parseInt(entry.productivity), mood: entry.mood }));
    const focusedData = scatterData.filter(d => d.mood === '🔥');
    const happyData = scatterData.filter(d => d.mood === '😊');
    const tiredData = scatterData.filter(d => d.mood === '😴');
    const hours = scatterData.map(d => d.x);
    const productivity = scatterData.map(d => d.y);
    const n = hours.length;
    const sumX = hours.reduce((a, b) => a + b, 0);
    const sumY = productivity.reduce((a, b) => a + b, 0);
    const sumXY = hours.reduce((sum, xi, i) => sum + xi * productivity[i], 0);
    const sumX2 = hours.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = productivity.reduce((sum, yi) => sum + yi * yi, 0);
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const correlation = denominator === 0 ? 0 : numerator / denominator;
    if (correlationChart) correlationChart.destroy();
    correlationChart = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: [{ label: '🔥 Focused', data: focusedData, backgroundColor: '#1B4D3E', pointRadius: 8 }, { label: '😊 Happy', data: happyData, backgroundColor: '#2A7F6F', pointRadius: 8 }, { label: '😴 Tired', data: tiredData, backgroundColor: '#D4A574', pointRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: true, scales: { x: { title: { display: true, text: 'Hours Worked' }, min: 0, max: 12, ticks: { stepSize: 1 } }, y: { title: { display: true, text: 'Productivity Rating (/10)' }, min: 0, max: 10, ticks: { stepSize: 1 } } }, plugins: { tooltip: { callbacks: { label: (ctx) => { const p = ctx.raw; return [`Hours: ${p.x}h`, `Productivity: ${p.y}/10`, `Mood: ${p.mood}`]; } } } } }
    });
    let correlationText = '', recommendation = '';
    if (Math.abs(correlation) < 0.3) { correlationText = 'weak'; recommendation = 'Hours worked doesn\'t strongly predict your productivity. Focus on quality over quantity!'; }
    else if (Math.abs(correlation) < 0.7) { correlationText = 'moderate'; recommendation = correlation > 0 ? 'More hours generally means higher productivity, but find your sweet spot.' : 'Working fewer hours might actually boost your productivity!'; }
    else { correlationText = 'strong'; recommendation = correlation > 0 ? 'There\'s a strong positive relationship. Consider optimizing your workflow during peak hours.' : 'Strong inverse relationship - you\'re most productive with fewer hours. Take more breaks!'; }
    const direction = correlation > 0 ? 'positive' : 'negative';
    document.getElementById('correlation-insight').innerHTML = `📈 <strong>Correlation Analysis:</strong> ${correlationText} ${direction} correlation (r = ${correlation.toFixed(2)}) between hours worked and productivity.<br><br>💡 <strong>Recommendation:</strong> ${recommendation}`;
}

// ============================================
// NOTIFICATIONS & REMINDERS
// ============================================

function requestNotificationPermission() {
    if (!("Notification" in window)) { showAlert("❌ Your browser doesn't support desktop notifications", "error"); return; }
    if (Notification.permission === "granted") { notificationPermissionGranted = true; showAlert("✅ Notifications already enabled!", "success"); showReminderSettings(); return; }
    if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") { notificationPermissionGranted = true; showAlert("✅ Notifications enabled!", "success"); showReminderSettings(); setupReminderSystem(); }
            else showAlert("⚠️ Notification permission denied.", "error");
        });
    } else showAlert("🔕 Notifications are blocked.", "error");
}

function showReminderSettings() { const card = document.getElementById("reminder-settings"); if(card) card.style.display = "block"; loadReminderSettings(); }
function toggleReminderSettings() { const ctrl = document.querySelector('.reminder-controls'); if(ctrl) ctrl.style.display = ctrl.style.display === 'none' ? 'flex' : 'none'; }
function loadReminderSettings() {
    const daily = localStorage.getItem("dailyReminderEnabled")==="true";
    document.getElementById("daily-reminder-toggle").checked = daily;
    document.getElementById("weekly-report-toggle").checked = localStorage.getItem("weeklyReportEnabled")==="true";
    document.getElementById("nudge-toggle").checked = localStorage.getItem("nudgeEnabled")==="true";
    document.getElementById("reminder-time").value = localStorage.getItem("reminderTime")||"20:00";
    if(daily) scheduleDailyReminder(document.getElementById("reminder-time").value);
}
function toggleDailyReminder() { localStorage.setItem("dailyReminderEnabled", document.getElementById("daily-reminder-toggle").checked); }
function saveReminderTime() { localStorage.setItem("reminderTime", document.getElementById("reminder-time").value); }
function scheduleDailyReminder(time) { if(reminderCheckInterval) clearInterval(reminderCheckInterval); }
function toggleWeeklyReport() { localStorage.setItem("weeklyReportEnabled", document.getElementById("weekly-report-toggle").checked); }
function toggleNudge() { localStorage.setItem("nudgeEnabled", document.getElementById("nudge-toggle").checked); }
function setupReminderSystem() {}
function getBestWorkTimeSuggestions() { const history = getHistory(); if(history.length<5) return "Log at least 5 entries to get suggestions!"; return "Based on your data, optimal work hours vary. Keep tracking!"; }
function displayWorkTimeSuggestion() { const container = document.getElementById("work-time-suggestion"); if(container) { container.innerHTML = `<h4>⏰ Personalized Work Suggestion</h4><p>${getBestWorkTimeSuggestions()}</p>`; container.style.display = "block"; } }
function addWorkTimeSuggestionCard() { displayWorkTimeSuggestion(); }

// Final initialization
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    const defaultMoodBtn = document.querySelector('[data-mood="😊"]');
    if (defaultMoodBtn) defaultMoodBtn.classList.add('active');
    if (Notification.permission === "granted") { notificationPermissionGranted = true; setupReminderSystem(); }
    window.renderBlockAssignmentUI = renderBlockAssignmentUI;
    window.finalizeBlockAssignments = finalizeBlockAssignments;
});