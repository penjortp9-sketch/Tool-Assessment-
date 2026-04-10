// ============================================
// ENHANCED PRODUCTIVITY TOOL - JAVASCRIPT
// Auto-Recording & History Management
// ============================================

// State Management
let taskList = [];
let currentUser = "Penjor";
let filteredHistoryData = [];

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
            <span>${t}</span>
            <span class="delete-task" onclick="removeTask(${i})">✕</span>
        </li>
    `).join('');
}

function removeTask(index) {
    taskList.splice(index, 1);
    updateTaskListUI();
    document.getElementById('tasks').value = taskList.join(', ');
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
        <li><strong>📋 Plan Execution:</strong> You worked on: ${tasks}</li>
        <li><strong>📊 Progress:</strong> ${feedback}</li>
        <li><strong>${icon} Key Takeaway:</strong> ${comments || "Every day is a chance to improve your productivity."}</li>
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
                    <p class="history-tasks"><strong>Tasks:</strong> ${entry.tasks.substring(0, 60)}${entry.tasks.length > 60 ? '...' : ''}</p>
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
    
    // Apply filters
    if (moodFilter) {
        history = history.filter(h => h.mood === moodFilter);
    }
    
    if (productivityFilter) {
        const prod = parseInt(history[0]?.productivity) || 7;
        if (productivityFilter === 'high') {
            history = history.filter(h => parseInt(h.productivity) >= 8);
        } else if (productivityFilter === 'medium') {
            history = history.filter(h => parseInt(h.productivity) >= 5 && parseInt(h.productivity) < 8);
        } else if (productivityFilter === 'low') {
            history = history.filter(h => parseInt(h.productivity) < 5);
        }
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
            <p>${entry.tasks}</p>
        </div>
        
        <div class="detail-section">
            <h3>⏱️ Work Blocks</h3>
            <p>${entry.blockTasks}</p>
        </div>
        
        <div class="detail-section">
            <h3>📝 Notes</h3>
            <p>${entry.comments || 'No notes added.'}</p>
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

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    const defaultMoodBtn = document.querySelector('[data-mood="😊"]');
    if (defaultMoodBtn) {
        defaultMoodBtn.classList.add('active');
    }
});

// ===== KEYBOARD SHORTCUTS =====
if (document.getElementById("password")) {
    document.getElementById("password").addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            login();
        }
    });
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('detail-modal');
    if (e.target === modal) {
        closeDetailModal();
    }
});
