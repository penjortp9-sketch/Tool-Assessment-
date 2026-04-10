// ============================================
// ENHANCED PRODUCTIVITY TOOL - JAVASCRIPT
// Auto-Recording & History Management
// ============================================

// State Management
let taskList = [];
let currentUser = "Penjor";
let filteredHistoryData = [];

// Chart instances
let productivityChart = null;
let moodChart = null;
let correlationChart = null;

// Inspirational Quotes
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

// ===== MOOD MANAGEMENT =====
function setMood(mood, btn) {
    document.getElementById('selected-mood').value = mood;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// ===== TASK MANAGEMENT =====
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
    list.innerHTML = taskList.map((t, i) => `
        <li>
            <span>${escapeHtml(t)}</span>
            <span class="delete-task" onclick="removeTask(${i})">✕</span>
        </li>
    `).join('');
}

function removeTask(index) {
    taskList.splice(index, 1);
    updateTaskListUI();
    document.getElementById('tasks').value = taskList.join(', ');
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== TIME BLOCK MANAGEMENT =====
function autoGenerateBlocksManual() {
    const total = parseFloat(document.getElementById("total-hours").value) || 0;
    const blocks = parseInt(document.getElementById("blocks").value) || 1;
    const hoursPerBlock = (total / blocks).toFixed(1);
    
    let blockLabels = [];
    for (let i = 1; i <= blocks; i++) {
        blockLabels.push(`Block ${i} (${hoursPerBlock}h)`);
    }
    
    const blockTasksInput = document.getElementById("block-tasks");
    blockTasksInput.value = blockLabels.join(", ");
    
    blockTasksInput.style.borderColor = '#10B981';
    setTimeout(() => {
        blockTasksInput.style.borderColor = '';
    }, 2000);
}

// ===== LOGIN FUNCTION =====
function login() {
    const name = document.getElementById("username").value.trim();
    if (name) {
        currentUser = name;
    }
    
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-screen").classList.remove("hidden");
    
    document.getElementById("greeting-name").textContent = currentUser;
    document.getElementById("current-date").textContent = new Date().toLocaleDateString('en-GB', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    });
    
    document.getElementById('daily-quote').textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
    
    setTimeout(() => {
        autoGenerateBlocksManual();
    }, 100);
    
    setupEventListeners();
}

// ===== EVENT LISTENERS SETUP =====
function setupEventListeners() {
    const totalHoursInput = document.getElementById("total-hours");
    const blocksInput = document.getElementById("blocks");
    const blockTasksInput = document.getElementById("block-tasks");
    const ratingSlider = document.getElementById("productivity");
    const ratingValue = document.getElementById("rating-value");
    const passwordInput = document.getElementById("password");
    const taskInput = document.getElementById("task-input");
    
    function autoGenerateBlocks() {
        const total = parseFloat(totalHoursInput.value) || 0;
        const blocks = parseInt(blocksInput.value) || 1;
        const hoursPerBlock = (total / blocks).toFixed(1);
        
        let blockLabels = [];
        for (let i = 1; i <= blocks; i++) {
            blockLabels.push(`Block ${i} (${hoursPerBlock}h)`);
        }
        blockTasksInput.value = blockLabels.join(", ");
    }
    
    totalHoursInput.addEventListener("input", autoGenerateBlocks);
    blocksInput.addEventListener("input", autoGenerateBlocks);
    
    ratingSlider.addEventListener("input", () => {
        ratingValue.textContent = ratingSlider.value;
    });
    
    if (passwordInput) {
        passwordInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") login();
        });
    }
    
    if (taskInput) {
        taskInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                addTask();
            }
        });
    }
}

// ===== LOGOUT FUNCTION =====
function logout() {
    document.getElementById("main-screen").classList.add("hidden");
    document.getElementById("history-screen").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("summary").classList.add("hidden");
    taskList = [];
}

// ===== SAVE ENTRY FUNCTION =====
function saveEntry() {
    // Get form values
    const tasks = document.getElementById("tasks").value.trim();
    const totalHours = document.getElementById("total-hours").value;
    const blockTasks = document.getElementById("block-tasks").value.trim();
    const blocks = document.getElementById("blocks").value;
    const productivity = document.getElementById("productivity").value;
    const comments = document.getElementById("comments").value.trim();
    const mood = document.getElementById("selected-mood").value;

    // Validation
    if (!tasks) {
        showAlert("❌ Please add at least one task today.", "error");
        return;
    }
    if (!blockTasks) {
        showAlert("❌ Please divide your work into blocks.", "error");
        return;
    }

    // Calculate hours per block
    const hoursPerBlock = (parseFloat(totalHours) / parseInt(blocks)).toFixed(1);

    // Update summary display
    displaySummary({
        tasks,
        blockTasks,
        totalHours,
        blocks,
        hoursPerBlock,
        productivity,
        comments,
        mood
    });

    // Generate and display lessons
    generateLessons(mood, tasks, productivity, comments);

    // AUTO-SAVE to history with timestamp
    const entryData = {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        tasks,
        mood,
        blockTasks,
        totalHours,
        blocks,
        hoursPerBlock,
        productivity,
        comments,
        timestamp: new Date().toISOString(),
        id: Date.now() // Unique ID for each entry
    };
    
    saveToHistory(entryData);

    // Visual feedback
    showAlert("✅ Today's entry saved successfully!", "success");
    
    // Scroll to summary
    setTimeout(() => {
        document.getElementById("summary").scrollIntoView({ behavior: "smooth" });
    }, 300);
}

// ===== DISPLAY SUMMARY =====
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

// ===== GENERATE LESSONS =====
function generateLessons(mood, tasks, productivity, comments) {
    let feedback = "";
    let icon = "📌";
    
    if (productivity >= 9) {
        feedback = "Excellent! You were highly focused and productive today.";
        icon = "🚀";
    } else if (productivity >= 6) {
        feedback = "Good job! Small improvements can make it even better next time.";
        icon = "⭐";
    } else if (productivity >= 4) {
        feedback = "Fair effort. Try reducing distractions and planning better tomorrow.";
        icon = "🎯";
    } else {
        feedback = "Room for improvement. Focus on planning and minimizing interruptions.";
        icon = "💪";
    }

    let moodEmoji = mood;
    let moodText = "focused";
    if (mood === "😊") moodText = "happy and positive";
    if (mood === "😴") moodText = "tired";

    const lessonsHTML = `
        <li><strong>🌅 Morning Mood:</strong> You started the day feeling ${moodEmoji} (${moodText})</li>
        <li><strong>📋 Plan Execution:</strong> You worked on: ${escapeHtml(tasks)}</li>
        <li><strong>📊 Progress:</strong> ${feedback}</li>
        <li><strong>${icon} Key Takeaway:</strong> ${escapeHtml(comments) || "Every day is a chance to improve your productivity."}</li>
    `;
    
    document.getElementById("lessons-list").innerHTML = lessonsHTML;
}

// ===== SAVE TO HISTORY =====
function saveToHistory(entry) {
    let history = JSON.parse(localStorage.getItem("productivityHistory") || "[]");
    history.push(entry);
    localStorage.setItem("productivityHistory", JSON.stringify(history));
}

// ===== RETRIEVE HISTORY =====
function getHistory() {
    return JSON.parse(localStorage.getItem("productivityHistory") || "[]");
}

// ===== SHOW HISTORY SCREEN =====
function showHistoryScreen() {
    document.getElementById("main-screen").classList.add("hidden");
    document.getElementById("history-screen").classList.remove("hidden");
    
    // Load and display history
    loadHistoryData();
    
    // Load charts after a short delay to ensure DOM is ready
    setTimeout(() => {
        loadProductivityTrendChart();
        loadMoodDistributionChart();
        loadHeatmapCalendar();
        loadCorrelationChart();
    }, 100);
}

// ===== BACK TO DASHBOARD =====
function backToDashboard() {
    document.getElementById("history-screen").classList.add("hidden");
    document.getElementById("main-screen").classList.remove("hidden");
    
    // Reset filters
    resetFilters();
}

// ===== LOAD HISTORY DATA =====
function loadHistoryData() {
    const history = getHistory();
    filteredHistoryData = [...history].reverse(); // Newest first
    
    // Calculate and display statistics
    calculateStatistics(history);
    
    // Display history
    displayHistoryList(filteredHistoryData);
}

// ===== CALCULATE STATISTICS =====
function calculateStatistics(history) {
    if (history.length === 0) {
        document.getElementById("stat-entries").textContent = "0";
        document.getElementById("stat-avg-productivity").textContent = "0";
        document.getElementById("stat-avg-hours").textContent = "0";
        document.getElementById("stat-mood").textContent = "-";
        return;
    }

    // Total entries
    document.getElementById("stat-entries").textContent = history.length;

    // Average productivity
    const avgProductivity = (history.reduce((sum, h) => sum + parseInt(h.productivity), 0) / history.length).toFixed(1);
    document.getElementById("stat-avg-productivity").textContent = avgProductivity;

    // Average work hours
    const avgHours = (history.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) / history.length).toFixed(1);
    document.getElementById("stat-avg-hours").textContent = avgHours;

    // Most common mood
    const moodCounts = {};
    history.forEach(h => {
        moodCounts[h.mood] = (moodCounts[h.mood] || 0) + 1;
    });
    const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b);
    document.getElementById("stat-mood").textContent = mostCommonMood;
}

// ===== DISPLAY HISTORY LIST =====
function displayHistoryList(historyData) {
    const historyList = document.getElementById("history-list");

    if (historyData.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>No entries found. Start tracking your productivity!</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = historyData.map(entry => {
        const productivityClass = entry.productivity >= 8 ? 'high' : entry.productivity >= 5 ? 'medium' : 'low';
        return `
            <div class="history-item" onclick="showDetailModal('${entry.id}')">
                <div class="history-item-header">
                    <div class="history-date">
                        <span class="date-day">${new Date(entry.timestamp).toLocaleDateString('en-GB', {weekday: 'short'})}</span>
                        <span class="date-full">${entry.date}</span>
                        <span class="date-time">${entry.time}</span>
                    </div>
                    <div class="history-mood">${entry.mood}</div>
                </div>
                
                <div class="history-item-content">
                    <div class="history-quick-stats">
                        <div class="quick-stat">
                            <span class="stat-icon">⏱️</span>
                            <span class="stat-text">${entry.totalHours}h</span>
                        </div>
                        <div class="quick-stat">
                            <span class="stat-icon">📊</span>
                            <span class="stat-text productivity-${productivityClass}">${entry.productivity}/10</span>
                        </div>
                        <div class="quick-stat">
                            <span class="stat-icon">📦</span>
                            <span class="stat-text">${entry.blocks} blocks</span>
                        </div>
                    </div>
                    <p class="history-tasks"><strong>Tasks:</strong> ${escapeHtml(entry.tasks.substring(0, 60))}${entry.tasks.length > 60 ? '...' : ''}</p>
                </div>
                
                <div class="history-item-action">
                    <span class="view-details">View Details →</span>
                </div>
            </div>
        `;
    }).join('');
}

// ===== FILTER HISTORY =====
function filterHistory() {
    const moodFilter = document.getElementById("mood-filter").value;
    const productivityFilter = document.getElementById("productivity-filter").value;
    
    let history = getHistory().reverse();
    
    if (moodFilter) {
        history = history.filter(h => h.mood === moodFilter);
    }
    
    if (productivityFilter === 'high') {
        history = history.filter(h => parseInt(h.productivity) >= 8);
    } else if (productivityFilter === 'medium') {
        history = history.filter(h => parseInt(h.productivity) >= 5 && parseInt(h.productivity) < 8);
    } else if (productivityFilter === 'low') {
        history = history.filter(h => parseInt(h.productivity) < 5);
    }
    
    filteredHistoryData = history;
    displayHistoryList(filteredHistoryData);
}

// ===== RESET FILTERS =====
function resetFilters() {
    document.getElementById("mood-filter").value = "";
    document.getElementById("productivity-filter").value = "";
    loadHistoryData();
}

// ===== SHOW DETAIL MODAL =====
function showDetailModal(entryId) {
    const history = getHistory();
    const entry = history.find(h => h.id == entryId);
    
    if (!entry) return;
    
    const productivityClass = entry.productivity >= 8 ? 'high' : entry.productivity >= 5 ? 'medium' : 'low';
    
    const detailHTML = `
        <div class="detail-header">
            <h2 class="detail-title">${entry.date}</h2>
            <p class="detail-time">${entry.time}</p>
        </div>
        
        <div class="detail-grid">
            <div class="detail-item">
                <span class="detail-label">Mood</span>
                <span class="detail-value">${entry.mood}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Productivity</span>
                <span class="detail-value productivity-${productivityClass}">${entry.productivity}/10</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Work Hours</span>
                <span class="detail-value">${entry.totalHours}h</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Blocks</span>
                <span class="detail-value">${entry.blocks}</span>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>📋 Tasks</h3>
            <p>${escapeHtml(entry.tasks)}</p>
        </div>
        
        <div class="detail-section">
            <h3>⏱️ Work Blocks</h3>
            <p>${escapeHtml(entry.blockTasks)}</p>
        </div>
        
        <div class="detail-section">
            <h3>📝 Notes</h3>
            <p>${escapeHtml(entry.comments) || 'No notes added.'}</p>
        </div>
        
        <div class="detail-actions">
            <button onclick="deleteHistoryEntry(${entryId})" class="btn btn-secondary btn-danger">🗑️ Delete Entry</button>
        </div>
    `;
    
    document.getElementById("detail-content").innerHTML = detailHTML;
    document.getElementById("detail-modal").classList.remove("hidden");
}

// ===== CLOSE DETAIL MODAL =====
function closeDetailModal() {
    document.getElementById("detail-modal").classList.add("hidden");
}

// ===== DELETE HISTORY ENTRY =====
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

// ===== CLEAR ALL HISTORY =====
function clearAllHistory() {
    if (confirm("⚠️ This will delete ALL your entries. Are you sure?")) {
        if (confirm("Really? This cannot be undone!")) {
            localStorage.removeItem("productivityHistory");
            loadHistoryData();
            showAlert("✅ All entries cleared!", "success");
        }
    }
}

// ===== ALERT FUNCTION =====
function showAlert(message, type = "info") {
    const alert = document.createElement('div');
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        padding: 16px 24px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideInDown 0.4s ease-out;
        font-weight: 600;
    `;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'slideInUp 0.4s ease-out reverse';
        setTimeout(() => alert.remove(), 400);
    }, 2500);
}

// ============================================
// CHARTS AND VISUALIZATIONS
// ============================================

// Chart Tab Switching
function switchChartTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Hide all chart containers
    document.querySelectorAll('.chart-container').forEach(container => {
        container.classList.remove('active');
    });
    
    // Show selected chart container
    document.getElementById(`${tabName}-chart-container`).classList.add('active');
    
    // Refresh chart if needed
    if (tabName === 'productivity') {
        loadProductivityTrendChart();
    } else if (tabName === 'mood') {
        loadMoodDistributionChart();
    } else if (tabName === 'heatmap') {
        loadHeatmapCalendar();
    } else if (tabName === 'correlation') {
        loadCorrelationChart();
    }
}

// 1. Productivity Trend Line Chart
function loadProductivityTrendChart() {
    const history = getHistory();
    if (history.length === 0) {
        document.getElementById('trend-insight').innerHTML = '📭 No data available. Start logging your productivity to see trends!';
        return;
    }
    
    // Sort by date (oldest to newest)
    const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Get last 30 days maximum for better visibility
    const recentData = sorted.slice(-30);
    
    const labels = recentData.map(entry => {
        const date = new Date(entry.timestamp);
        return `${date.getMonth()+1}/${date.getDate()}`;
    });
    
    const productivityData = recentData.map(entry => parseInt(entry.productivity));
    const hoursData = recentData.map(entry => parseFloat(entry.totalHours));
    
    const ctx = document.getElementById('productivityTrendChart').getContext('2d');
    
    if (productivityChart) {
        productivityChart.destroy();
    }
    
    productivityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Productivity Rating',
                    data: productivityData,
                    borderColor: '#1B4D3E',
                    backgroundColor: 'rgba(27, 77, 62, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#1B4D3E',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Hours Worked',
                    data: hoursData,
                    borderColor: '#D4A574',
                    backgroundColor: 'rgba(212, 165, 116, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#D4A574',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { family: 'Sora', size: 12 },
                        usePointStyle: true,
                        boxWidth: 10
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    titleFont: { family: 'Sora', size: 13 },
                    bodyFont: { family: 'Sora', size: 12 },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            let value = context.raw;
                            if (context.dataset.label.includes('Productivity')) {
                                return `${label}: ${value}/10`;
                            }
                            return `${label}: ${value} hours`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Productivity Rating (/10)',
                        font: { family: 'Sora', size: 12 }
                    },
                    min: 0,
                    max: 10,
                    ticks: { stepSize: 1 }
                },
                y1: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Hours Worked',
                        font: { family: 'Sora', size: 12 }
                    },
                    grid: { drawOnChartArea: false }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date',
                        font: { family: 'Sora', size: 12 }
                    },
                    ticks: { maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
    
    // Generate insight
    const avgProductivity = (productivityData.reduce((a,b) => a+b, 0) / productivityData.length).toFixed(1);
    const trend = productivityData[productivityData.length-1] - productivityData[0];
    const trendText = trend > 0 ? '↑ increasing' : trend < 0 ? '↓ decreasing' : '→ stable';
    
    document.getElementById('trend-insight').innerHTML = `
        📊 <strong>Productivity Insight:</strong> Your average productivity is <strong>${avgProductivity}/10</strong> 
        with a ${trendText} trend. ${trend > 0 ? 'Great job improving!' : trend < 0 ? 'Focus on consistency to boost your scores.' : 'Keep maintaining your steady performance!'}
    `;
}

// 2. Mood Distribution Bar Chart
function loadMoodDistributionChart() {
    const history = getHistory();
    if (history.length === 0) {
        document.getElementById('mood-insight').innerHTML = '📭 No data available. Log your moods to see distribution!';
        return;
    }
    
    const moodMap = {
        '🔥': { count: 0, label: '🔥 Focused' },
        '😊': { count: 0, label: '😊 Happy' },
        '😴': { count: 0, label: '😴 Tired' }
    };
    
    history.forEach(entry => {
        if (moodMap[entry.mood]) {
            moodMap[entry.mood].count++;
        }
    });
    
    const labels = Object.values(moodMap).map(m => m.label);
    const counts = Object.values(moodMap).map(m => m.count);
    
    // Calculate productivity by mood
    const moodProductivity = {
        '🔥': { sum: 0, count: 0 },
        '😊': { sum: 0, count: 0 },
        '😴': { sum: 0, count: 0 }
    };
    
    history.forEach(entry => {
        if (moodProductivity[entry.mood]) {
            moodProductivity[entry.mood].sum += parseInt(entry.productivity);
            moodProductivity[entry.mood].count++;
        }
    });
    
    const avgByMood = Object.keys(moodProductivity).map(mood => {
        const data = moodProductivity[mood];
        return data.count > 0 ? (data.sum / data.count).toFixed(1) : 0;
    });
    
    const ctx = document.getElementById('moodDistributionChart').getContext('2d');
    
    if (moodChart) {
        moodChart.destroy();
    }
    
    moodChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Number of Days',
                    data: counts,
                    backgroundColor: ['#1B4D3E', '#2A7F6F', '#D4A574'],
                    borderColor: ['#1B4D3E', '#2A7F6F', '#D4A574'],
                    borderWidth: 1,
                    borderRadius: 8,
                    yAxisID: 'y'
                },
                {
                    label: 'Avg Productivity (when in this mood)',
                    data: avgByMood,
                    type: 'line',
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.3,
                    pointRadius: 6,
                    pointBackgroundColor: '#EF4444',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { family: 'Sora', size: 12 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.label.includes('Number')) {
                                return `${context.dataset.label}: ${context.raw} days`;
                            }
                            return `${context.dataset.label}: ${context.raw}/10`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Number of Days',
                        font: { family: 'Sora', size: 12 }
                    },
                    ticks: { stepSize: 1 }
                },
                y1: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Average Productivity (/10)',
                        font: { family: 'Sora', size: 12 }
                    },
                    min: 0,
                    max: 10,
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
    
    // Find best mood
    let bestMood = '';
    let bestAvg = 0;
    Object.keys(moodProductivity).forEach(mood => {
        const avg = moodProductivity[mood].count > 0 ? moodProductivity[mood].sum / moodProductivity[mood].count : 0;
        if (avg > bestAvg) {
            bestAvg = avg;
            bestMood = mood === '🔥' ? 'Focused' : mood === '😊' ? 'Happy' : 'Tired';
        }
    });
    
    document.getElementById('mood-insight').innerHTML = `
        😊 <strong>Mood Analysis:</strong> You feel ${bestMood} most productive (${bestAvg.toFixed(1)}/10). 
        ${bestMood === 'Focused' ? 'Keep maintaining that focused state!' : bestMood === 'Happy' ? 'Happiness boosts your productivity!' : 'Try to get more rest for better results.'}
    `;
}

// 3. Heatmap Calendar
function loadHeatmapCalendar() {
    const history = getHistory();
    if (history.length === 0) {
        document.getElementById('heatmap-insight').innerHTML = '📭 No data available. Start logging to see your productivity heatmap!';
        return;
    }
    
    // Create a map of dates to productivity
    const productivityMap = new Map();
    history.forEach(entry => {
        const dateKey = new Date(entry.timestamp).toLocaleDateString();
        productivityMap.set(dateKey, parseInt(entry.productivity));
    });
    
    // Get last 90 days
    const today = new Date();
    const dates = [];
    for (let i = 90; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date);
    }
    
    const heatmapHTML = dates.map(date => {
        const dateKey = date.toLocaleDateString();
        const productivity = productivityMap.get(dateKey);
        const dayNum = date.getDate();
        const month = date.getMonth() + 1;
        
        if (productivity) {
            const productivityClass = `productivity-${productivity}`;
            return `
                <div class="heatmap-day ${productivityClass}" title="${date.toLocaleDateString()}: ${productivity}/10">
                    <div>${dayNum}/${month}</div>
                    <div class="day-date">${date.toLocaleDateString('en', { weekday: 'short' })}</div>
                </div>
            `;
        } else {
            return `
                <div class="heatmap-day" style="background: #F3F4F6; color: #9CA3AF;" title="${date.toLocaleDateString()}: No data">
                    <div>${dayNum}/${month}</div>
                    <div class="day-date">${date.toLocaleDateString('en', { weekday: 'short' })}</div>
                </div>
            `;
        }
    }).join('');
    
    const legendHTML = `
        <div class="heatmap-legend">
            <div class="legend-item"><div class="legend-color productivity-1"></div><span>Low (1-3)</span></div>
            <div class="legend-item"><div class="legend-color productivity-4"></div><span>Below Avg (4-5)</span></div>
            <div class="legend-item"><div class="legend-color productivity-6"></div><span>Average (6-7)</span></div>
            <div class="legend-item"><div class="legend-color productivity-8"></div><span>Good (8-9)</span></div>
            <div class="legend-item"><div class="legend-color productivity-10"></div><span>Excellent (10)</span></div>
        </div>
    `;
    
    document.getElementById('heatmap-calendar').innerHTML = heatmapHTML + legendHTML;
    
    // Calculate streak
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i <= 90; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateKey = date.toLocaleDateString();
        
        if (productivityMap.has(dateKey)) {
            tempStreak++;
            bestStreak = Math.max(bestStreak, tempStreak);
            if (i === 0) currentStreak = tempStreak;
        } else {
            tempStreak = 0;
        }
    }
    
    document.getElementById('heatmap-insight').innerHTML = `
        🔥 <strong>Consistency Tracker:</strong> Current streak: <strong>${currentStreak}</strong> days | Best streak: <strong>${bestStreak}</strong> days.
        ${currentStreak >= 7 ? 'Amazing consistency! 🎉' : currentStreak >= 3 ? 'Great momentum! Keep going!' : 'Start building your streak today!'}
    `;
}

// 4. Hours vs Productivity Correlation Chart (Scatter Plot)
function loadCorrelationChart() {
    const history = getHistory();
    if (history.length === 0) {
        document.getElementById('correlation-insight').innerHTML = '📭 No data available. Log entries to see correlation between hours and productivity!';
        return;
    }
    
    // Prepare scatter data
    const scatterData = history.map(entry => ({
        x: parseFloat(entry.totalHours),
        y: parseInt(entry.productivity),
        mood: entry.mood
    }));
    
    // Group by mood for different colors
    const focusedData = scatterData.filter(d => d.mood === '🔥');
    const happyData = scatterData.filter(d => d.mood === '😊');
    const tiredData = scatterData.filter(d => d.mood === '😴');
    
    // Calculate correlation coefficient
    const hours = scatterData.map(d => d.x);
    const productivity = scatterData.map(d => d.y);
    const correlation = calculateCorrelation(hours, productivity);
    
    const ctx = document.getElementById('correlationChart').getContext('2d');
    
    if (correlationChart) {
        correlationChart.destroy();
    }
    
    correlationChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: '🔥 Focused',
                    data: focusedData,
                    backgroundColor: '#1B4D3E',
                    borderColor: '#1B4D3E',
                    borderWidth: 1,
                    pointRadius: 8,
                    pointHoverRadius: 12
                },
                {
                    label: '😊 Happy',
                    data: happyData,
                    backgroundColor: '#2A7F6F',
                    borderColor: '#2A7F6F',
                    borderWidth: 1,
                    pointRadius: 8,
                    pointHoverRadius: 12
                },
                {
                    label: '😴 Tired',
                    data: tiredData,
                    backgroundColor: '#D4A574',
                    borderColor: '#D4A574',
                    borderWidth: 1,
                    pointRadius: 8,
                    pointHoverRadius: 12
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { family: 'Sora', size: 12 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            return [`Hours: ${point.x}h`, `Productivity: ${point.y}/10`, `Mood: ${point.mood}`];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Hours Worked',
                        font: { family: 'Sora', size: 12 }
                    },
                    min: 0,
                    max: 12,
                    ticks: { stepSize: 1 }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Productivity Rating (/10)',
                        font: { family: 'Sora', size: 12 }
                    },
                    min: 0,
                    max: 10,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
    
    // Generate correlation insight
    let correlationText = '';
    let recommendation = '';
    
    if (Math.abs(correlation) < 0.3) {
        correlationText = 'weak';
        recommendation = 'Hours worked doesn\'t strongly predict your productivity. Focus on quality over quantity!';
    } else if (Math.abs(correlation) < 0.7) {
        correlationText = 'moderate';
        recommendation = correlation > 0 ? 'More hours generally means higher productivity, but find your sweet spot.' : 'Working fewer hours might actually boost your productivity!';
    } else {
        correlationText = 'strong';
        recommendation = correlation > 0 ? 'There\'s a strong positive relationship. Consider optimizing your workflow during peak hours.' : 'Strong inverse relationship - you\'re most productive with fewer hours. Take more breaks!';
    }
    
    const direction = correlation > 0 ? 'positive' : 'negative';
    
    document.getElementById('correlation-insight').innerHTML = `
        📈 <strong>Correlation Analysis:</strong> ${correlationText} ${direction} correlation (r = ${correlation.toFixed(2)}) between hours worked and productivity.
        <br><br>💡 <strong>Recommendation:</strong> ${recommendation}
    `;
}

// Helper function to calculate correlation coefficient
function calculateCorrelation(x, y) {
    const n = x.length;
    if (n < 2) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    if (denominator === 0) return 0;
    return numerator / denominator;
}

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    const defaultMoodBtn = document.querySelector('[data-mood="😊"]');
    if (defaultMoodBtn) {
        defaultMoodBtn.classList.add('active');
    }
});

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('detail-modal');
    if (e.target === modal) {
        closeDetailModal();
    }
});