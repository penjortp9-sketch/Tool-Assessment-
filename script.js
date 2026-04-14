// ============================================
// COMPLETE JAVASCRIPT - WITH BLOCK RATINGS SYSTEM
// INCLUDING DARK/LIGHT MODE TOGGLE & BLOCK ASSIGNMENT WITH RATINGS
// UPDATED: Ratings only available AFTER block completion
// UPDATED: Auto-generate blocks with editable time per block
// ============================================

// State Management
let taskList = [];
let currentUser = "Penjor";
let filteredHistoryData = [];
let productivityChart = null;
let moodChart = null;
let correlationChart = null;
let blockRatingsChart = null;
let notificationPermissionGranted = false;
let reminderCheckInterval = null;

// Block Assignment & Rating Storage
let blockAssignmentMap = {};
let blockRatingMap = {};
let blockCompletionStatus = {}; 
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

// Get block name by index (removes time part for display)
function getBlockNameByIndex(idx) {
    const blockTasksRaw = document.getElementById('block-tasks').value;
    if (!blockTasksRaw) return `Block ${idx+1}`;
    const parts = blockTasksRaw.split(',').map(s => s.trim());
    if (parts[idx]) {
        return parts[idx].replace(/\s*\([\d.]+\s*h?\)/, '').trim();
    }
    return `Block ${idx+1}`;
}

// ============================================
// IMPROVED AUTO GENERATE BLOCKS WITH EDITABLE TIME  ← NEW FEATURE
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
    for (let i = 1; i <= blocksCount; i++) {
        blockLabels.push(`Block ${i} (${hoursPerBlock}h)`);
    }
    
    const blockTasksInput = document.getElementById("block-tasks");
    blockTasksInput.value = blockLabels.join(", ");
   
    blockTasksInput.style.borderColor = '#10B981';
    setTimeout(() => blockTasksInput.style.borderColor = '', 1500);

    // Reset previous block data
    blockAssignmentMap = {};
    blockRatingMap = {};
    blockCompletionStatus = {};
    blockAssignmentFinished = false;
    document.getElementById('assignmentStatusMsg').innerHTML = '';
    renderBlockAssignmentUI();
}

// NEW: Allow manual editing of time in block input and normalize
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
}

// ============================================
// BLOCK ASSIGNMENT & RATING SYSTEM (Unchanged)
// ============================================

function markBlockCompleted(blockIdx) {
    const assignedTask = blockAssignmentMap[blockIdx] || '';
    
    if (!assignedTask) {
        showAlert(`⚠️ Please assign a task to this block first!`, "error");
        return;
    }
    
    blockCompletionStatus[blockIdx] = !blockCompletionStatus[blockIdx];
    
    if (blockCompletionStatus[blockIdx]) {
        showAlert(`✅ Block ${blockIdx + 1} marked as completed! You can now rate it.`, "success");
    } else {
        delete blockRatingMap[blockIdx];
        showAlert(`⏳ Block ${blockIdx + 1} marked as incomplete. Rating cleared.`, "warning");
    }
    
    renderBlockAssignmentUI();
    updateRatingSummary();
}

function renderBlockAssignmentUI() {
    const blocksCount = parseInt(document.getElementById('blocks').value) || 1;
    const container = document.getElementById('blockAssignmentContainer');
    if (!container) return;
    
    if (taskList.length === 0) {
        container.innerHTML = `<div style="padding: 12px; background: var(--bg-light); border-radius: 12px; color: var(--text-muted);"><span>⚠️ Add at least one task above to assign to blocks.</span></div>`;
        document.getElementById('blockRatingSummary').style.display = 'none';
        return;
    }
    
    let html = `<div style="display: flex; flex-direction: column; gap: 14px;">`;
    for (let i = 0; i < blocksCount; i++) {
        const currentBlockName = getBlockNameByIndex(i);
        const selectedVal = blockAssignmentMap[i] || '';
        const currentRating = blockRatingMap[i] || '';
        const isCompleted = blockCompletionStatus[i] || false;
        
        html += `<div class="block-assign-row" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; background: var(--card-bg); padding: 8px 12px; border-radius: 12px; border: 1px solid var(--border-color); ${isCompleted ? 'border-left: 4px solid #10B981;' : ''}">
                    <strong style="min-width: 110px;">📌 ${escapeHtml(currentBlockName)}</strong>
                    <select data-block-index="${i}" class="block-task-select" style="flex:1; padding: 10px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-dark);">
                        <option value="">— Select a task —</option>
                        ${taskList.map(task => `<option value="${escapeHtml(task)}" ${selectedVal === task ? 'selected' : ''}>${escapeHtml(task)}</option>`).join('')}
                    </select>
                    <button type="button" class="btn-complete-block" data-block="${i}" style="padding: 8px 16px; background: ${isCompleted ? '#10B981' : '#D4A574'}; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: all 0.3s ease; font-weight: 600;">
                        ${isCompleted ? '✅ Completed' : '⏳ Mark Done'}
                    </button>
                    <button type="button" class="btn-rate-block" data-block="${i}" style="padding: 8px 16px; background: ${isCompleted ? 'var(--primary)' : '#CCCCCC'}; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: all 0.3s ease; ${!isCompleted ? 'opacity: 0.6; cursor: not-allowed;' : ''}" ${!isCompleted ? 'disabled' : ''}>
                        ${currentRating ? `⭐ ${currentRating}/10` : 'Rate →'}
                    </button>
                </div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
    
    // Add event listeners for selects
    document.querySelectorAll('.block-task-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const blockIdx = parseInt(select.getAttribute('data-block-index'));
            const selectedTask = select.value;
            if (selectedTask) blockAssignmentMap[blockIdx] = selectedTask;
            else delete blockAssignmentMap[blockIdx];
            blockAssignmentFinished = false;
            document.getElementById('assignmentStatusMsg').innerHTML = '';
            blockCompletionStatus[blockIdx] = false;
            delete blockRatingMap[blockIdx];
            updateRatingSummary();
            renderBlockAssignmentUI();
        });
    });
    
    // Add event listeners for completion buttons
    document.querySelectorAll('.btn-complete-block').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const blockIdx = parseInt(btn.getAttribute('data-block'));
            markBlockCompleted(blockIdx);
        });
    });
    
    // Add event listeners for rate buttons
    document.querySelectorAll('.btn-rate-block').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const blockIdx = parseInt(btn.getAttribute('data-block'));
            if (blockCompletionStatus[blockIdx]) {
                showRatingModal(blockIdx);
            } else {
                showAlert(`⚠️ Please mark Block ${blockIdx + 1} as completed first!`, "error");
            }
        });
    });
    
    updateRatingSummary();
}

function showRatingModal(blockIdx) {
    const blockName = getBlockNameByIndex(blockIdx);
    const currentRating = blockRatingMap[blockIdx] || '';
    const assignedTask = blockAssignmentMap[blockIdx] || '';
    
    if (!assignedTask) {
        showAlert(`⚠️ Please select a task for ${blockName} first!`, "error");
        return;
    }
    
    if (!blockCompletionStatus[blockIdx]) {
        showAlert(`⚠️ Please mark ${blockName} as completed before rating!`, "error");
        return;
    }
    
    const modalHtml = `
        <div id="rating-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10001; backdrop-filter: blur(4px);">
            <div style="background: var(--card-bg); padding: 30px; border-radius: 20px; max-width: 400px; width: 90%; animation: slideInUp 0.3s ease-out;">
                <h3 style="margin-bottom: 15px; color: var(--primary);">⭐ Rate ${escapeHtml(blockName)}</h3>
                <p style="margin-bottom: 20px; color: var(--text-muted);">Task: <strong>${escapeHtml(assignedTask)}</strong></p>
                <div style="margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 600;">Productivity (1-10):</label>
                    <input type="range" id="block-rating-slider" min="1" max="10" value="${currentRating || 5}" style="width: 100%; margin: 10px 0;">
                    <div style="text-align: center; font-size: 1.5rem; font-weight: bold; color: var(--primary);">
                        <span id="rating-value-display">${currentRating || 5}</span>/10
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 10px; justify-content: center; font-size: 0.85rem;">
                        <span>📉 Low</span>
                        <span style="flex:1; text-align: center;">⚖️ Medium</span>
                        <span>📈 High</span>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="saveBlockRating(${blockIdx})" class="btn btn-primary" style="flex:1;">Save Rating</button>
                    <button onclick="closeRatingModal()" class="btn btn-secondary" style="flex:1;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    closeRatingModal();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const slider = document.getElementById('block-rating-slider');
    const display = document.getElementById('rating-value-display');
    if (slider && display) {
        slider.addEventListener('input', () => {
            display.textContent = slider.value;
        });
    }
}

function saveBlockRating(blockIdx) {
    const slider = document.getElementById('block-rating-slider');
    if (slider) {
        const rating = parseInt(slider.value);
        blockRatingMap[blockIdx] = rating;
        showAlert(`✅ Rating saved for Block ${blockIdx + 1}: ${rating}/10`, "success");
        closeRatingModal();
        renderBlockAssignmentUI();
    }
}

function closeRatingModal() {
    const existingModal = document.getElementById('rating-modal-overlay');
    if (existingModal) existingModal.remove();
}

function updateRatingSummary() {
    const summaryDiv = document.getElementById('blockRatingSummary');
    const summaryText = document.getElementById('ratingsSummaryText');
    
    if (Object.keys(blockRatingMap).length > 0) {
        summaryDiv.style.display = 'block';
        let summary = '';
        for (let i = 0; i < Object.keys(blockAssignmentMap).length; i++) {
            if (blockRatingMap[i]) {
                const rating = blockRatingMap[i];
                let ratingClass = rating >= 8 ? 'rating-high' : (rating >= 5 ? 'rating-medium' : 'rating-low');
                summary += `<span class="rating-badge ${ratingClass}" style="margin-right: 8px; margin-bottom: 5px; display: inline-block;">Block ${i+1}: ${rating}/10</span>`;
            }
        }
        summaryText.innerHTML = summary || 'No ratings yet';
    } else {
        summaryDiv.style.display = 'none';
    }
}

function showAllRatingsModal() {
    let ratingsHtml = '<div style="max-height: 400px; overflow-y: auto;"><h3 style="margin-bottom: 15px;">⭐ Block Ratings Summary</h3>';
    for (let i = 0; i < Object.keys(blockAssignmentMap).length; i++) {
        if (blockAssignmentMap[i]) {
            const task = blockAssignmentMap[i];
            const isCompleted = blockCompletionStatus[i] || false;
            const rating = blockRatingMap[i] || 'Not rated';
            const ratingClass = rating >= 8 ? 'rating-high' : (rating >= 5 ? 'rating-medium' : 'rating-low');
            ratingsHtml += `
                <div style="padding: 12px; margin-bottom: 10px; background: var(--bg-light); border-radius: 10px; border-left: 4px solid ${isCompleted ? '#10B981' : 'var(--primary)'};">
                    <strong>Block ${i+1}:</strong> ${escapeHtml(task)}<br>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">${isCompleted ? '✅ Completed' : '⏳ Not completed'}</span><br>
                    <span class="rating-badge ${ratingClass}" style="margin-top: 5px; display: inline-block;">⭐ ${rating}/10</span>
                </div>
            `;
        }
    }
    ratingsHtml += '</div>';
    
    const modalHtml = `
        <div id="ratings-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10001; backdrop-filter: blur(4px);">
            <div style="background: var(--card-bg); padding: 30px; border-radius: 20px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; animation: slideInUp 0.3s ease-out;">
                ${ratingsHtml}
                <button onclick="closeRatingsModal()" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Close</button>
            </div>
        </div>
    `;
    
    closeRatingsModal();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeRatingsModal() {
    const existingModal = document.getElementById('ratings-modal-overlay');
    if (existingModal) existingModal.remove();
}

function resetAllBlockAssignments() {
    if (confirm('Are you sure you want to reset all block assignments and ratings?')) {
        blockAssignmentMap = {};
        blockRatingMap = {};
        blockCompletionStatus = {};
        blockAssignmentFinished = false;
        document.getElementById('assignmentStatusMsg').innerHTML = '';
        renderBlockAssignmentUI();
        showAlert('🔄 All block assignments and ratings have been reset', 'success');
    }
}

function finalizeBlockAssignments() {
    const blocksCount = parseInt(document.getElementById('blocks').value) || 1;
    const missingBlocks = [];
    const uncompletedBlocks = [];
    const unratedBlocks = [];
    
    for (let i = 0; i < blocksCount; i++) {
        if (!blockAssignmentMap[i]) {
            missingBlocks.push(i+1);
        } else if (!blockCompletionStatus[i]) {
            uncompletedBlocks.push(i+1);
        } else if (!blockRatingMap[i]) {
            unratedBlocks.push(i+1);
        }
    }
    
    if (missingBlocks.length > 0) {
        showAlert(`⚠️ Please assign a task to Block(s) ${missingBlocks.join(', ')} before finishing.`, "error");
        return false;
    }
    
    if (uncompletedBlocks.length > 0) {
        showAlert(`⚠️ Please mark Block(s) ${uncompletedBlocks.join(', ')} as completed before finishing.`, "error");
        return false;
    }
    
    if (unratedBlocks.length > 0) {
        if (confirm(`⚠️ Block(s) ${unratedBlocks.join(', ')} have no ratings. Do you want to rate them now?`)) {
            showRatingModal(unratedBlocks[0] - 1);
            return false;
        }
        showAlert("⚠️ Proceeding without ratings for some blocks.", "warning");
    }
    
    blockAssignmentFinished = true;
    document.getElementById('assignmentStatusMsg').innerHTML = '✅ Block assignments finalized! You can now rate productivity.';
    showAlert("✅ Great! Block tasks assigned. You can now rate your expected productivity.", "success");
    return true;
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
    document.getElementById("username").value = currentUser;
    taskList = [];
    blockAssignmentMap = {};
    blockRatingMap = {};
    blockCompletionStatus = {};
    blockAssignmentFinished = false;
}

// Setup event listeners for block count and hours + NEW editable time
function setupEventListeners() {
    const blocksInput = document.getElementById('blocks');
    const hoursInput = document.getElementById('total-hours');
    const blockTasksInput = document.getElementById('block-tasks');

    if (blocksInput) blocksInput.addEventListener('change', autoGenerateBlocksManual);
    if (hoursInput) hoursInput.addEventListener('change', autoGenerateBlocksManual);
    
    // NEW: Listen to manual edits in block time
    if (blockTasksInput) {
        blockTasksInput.addEventListener('change', parseAndUpdateBlockTimes);
        blockTasksInput.addEventListener('blur', parseAndUpdateBlockTimes);
    }
}

// Alert system
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

// Save Entry
function saveEntry() {
    const blocksCount = parseInt(document.getElementById('blocks').value) || 1;
    
    // Validate all blocks are assigned and completed
    const missingBlocks = [];
    const uncompletedBlocks = [];
    for (let i = 0; i < blocksCount; i++) {
        if (!blockAssignmentMap[i]) missingBlocks.push(i+1);
        if (!blockCompletionStatus[i]) uncompletedBlocks.push(i+1);
    }
    
    if (missingBlocks.length > 0) {
        showAlert(`⚠️ Please assign tasks to Block(s) ${missingBlocks.join(', ')}.`, "error");
        return;
    }
    
    if (uncompletedBlocks.length > 0) {
        showAlert(`⚠️ Please mark Block(s) ${uncompletedBlocks.join(', ')} as completed.`, "error");
        return;
    }
    
    const entry = {
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-GB'),
        mood: document.getElementById('selected-mood').value,
        tasks: taskList.join(', '),
        totalHours: parseFloat(document.getElementById('total-hours').value),
        blocks: parseInt(document.getElementById('blocks').value),
        blockRatingsData: { ...blockRatingMap },
        blockAssignmentData: { ...blockAssignmentMap },
        blockCompletionData: { ...blockCompletionStatus },
        productivity: parseInt(document.getElementById('productivity').value),
        comments: document.getElementById('comments').value
    };
    
    let history = getHistory();
    history.push(entry);
    localStorage.setItem('productivity_history', JSON.stringify(history));
    
    showAlert('✅ Entry saved successfully!', 'success');
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
    document.getElementById('productivity').value = '7';
    document.getElementById('rating-value').textContent = '7';
    document.getElementById('comments').value = '';
    blockAssignmentMap = {};
    blockRatingMap = {};
    blockCompletionStatus = {};
    blockAssignmentFinished = false;
    document.getElementById('assignmentStatusMsg').innerHTML = '';
    setTimeout(() => autoGenerateBlocksManual(), 100);
}

// Get history
function getHistory() {
    const stored = localStorage.getItem('productivity_history');
    return stored ? JSON.parse(stored) : [];
}

// History Screen Functions
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
    displayStats();
    displayHistory();
    loadProductivityTrendChart();
    loadMoodDistributionChart();
    loadHeatmapChart();
    loadCorrelationChart();
    loadBlockRatingsChart();
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
    
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card"><div class="stat-label">📊 Total Entries</div><div class="stat-value">${totalEntries}</div></div>
        <div class="stat-card"><div class="stat-label">⭐ Avg Productivity</div><div class="stat-value">${avgProductivity}/10</div></div>
        <div class="stat-card"><div class="stat-label">⏱️ Total Hours</div><div class="stat-value">${totalHours}h</div></div>
        <div class="stat-card"><div class="stat-label">😊 Mood</div><div class="stat-value">${mostFrequentMood}</div></div>
    `;
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
    
    list.innerHTML = history.reverse().map((entry, idx) => `
        <div class="history-item" onclick="showEntryDetail(${history.length - idx - 1})">
            <div class="history-item-header">
                <div class="history-date">
                    <span class="date-full">${entry.date}</span>
                    <span class="date-time">${new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="history-mood">${entry.mood}</div>
            </div>
            <div class="history-quick-stats">
                <div class="quick-stat"><span class="stat-text productivity-${entry.productivity >= 8 ? 'high' : entry.productivity >= 5 ? 'medium' : 'low'}">⭐ ${entry.productivity}/10</span></div>
                <div class="quick-stat">⏱️ ${entry.totalHours}h</div>
                <div class="quick-stat">📦 ${entry.blocks} blocks</div>
            </div>
            <p class="history-tasks">${entry.tasks.substring(0, 60)}${entry.tasks.length > 60 ? '...' : ''}</p>
            <div class="history-item-action">View Details →</div>
        </div>
    `).join('');
}

function showEntryDetail(idx) {
    const history = getHistory();
    const entry = history[idx];
    const detailContent = document.getElementById('detail-content');
    
    let blockDetails = '';
    if (entry.blockAssignmentData) {
        for (let i = 0; i < Object.keys(entry.blockAssignmentData).length; i++) {
            const task = entry.blockAssignmentData[i];
            const completed = entry.blockCompletionData[i] ? '✅' : '⏳';
            const rating = entry.blockRatingsData[i] ? `⭐ ${entry.blockRatingsData[i]}/10` : 'Not rated';
            blockDetails += `<div style="padding: 10px; background: var(--bg-light); border-radius: 8px; margin-bottom: 8px; border-left: 4px solid var(--primary);">
                <strong>Block ${i+1}:</strong> ${escapeHtml(task)}<br>
                <span style="font-size: 0.85rem; color: var(--text-muted);">${completed} ${rating}</span>
            </div>`;
        }
    }
    
    detailContent.innerHTML = `
        <div class="detail-header">
            <h2 class="detail-title">${entry.date}</h2>
            <p class="detail-time">${new Date(entry.timestamp).toLocaleTimeString()}</p>
        </div>
        <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Mood</span><div class="detail-value">${entry.mood}</div></div>
            <div class="detail-item"><span class="detail-label">Productivity</span><div class="detail-value">${entry.productivity}/10</div></div>
            <div class="detail-item"><span class="detail-label">Hours</span><div class="detail-value">${entry.totalHours}h</div></div>
            <div class="detail-item"><span class="detail-label">Blocks</span><div class="detail-value">${entry.blocks}</div></div>
        </div>
        <div class="detail-section">
            <h3>📋 Tasks</h3>
            <p>${escapeHtml(entry.tasks)}</p>
        </div>
        ${blockDetails ? `<div class="detail-section"><h3>🎯 Block Details</h3>${blockDetails}</div>` : ''}
        ${entry.comments ? `<div class="detail-section"><h3>💭 Notes</h3><p>${escapeHtml(entry.comments)}</p></div>` : ''}
    `;
    
    document.getElementById('detail-modal').classList.remove('hidden');
}

function closeDetailModal() {
    document.getElementById('detail-modal').classList.add('hidden');
}

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
    if (confirm('⚠️ Are you sure? This will delete all productivity entries permanently!')) {
        localStorage.removeItem('productivity_history');
        showAlert('🗑️ All history cleared', 'success');
        loadHistoryData();
    }
}

// Chart functions
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
        document.getElementById('trend-insight').innerHTML = '📭 No data available. Log entries to see your productivity trend!';
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
        options: { responsive: true, maintainAspectRatio: true, scales: { y: { min: 0, max: 10, ticks: { stepSize: 1 } } }, plugins: { legend: { display: true }, tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12 } } }
    });
    document.getElementById('trend-insight').innerHTML = `📈 <strong>Your Trend:</strong> Average productivity is <strong>${avgProductivity}/10</strong>. ${avgProductivity >= 8 ? 'Excellent consistency! 🎉' : avgProductivity >= 6 ? 'Good progress, keep it up!' : 'Room for improvement. Try adjusting your routine.'}`;
}

function loadMoodDistributionChart() {
    const history = getHistory();
    const ctx = document.getElementById('moodDistributionChart').getContext('2d');
    if (history.length === 0) {
        document.getElementById('mood-insight').innerHTML = '📭 No data available. Log entries to see mood distribution!';
        if (moodChart) moodChart.destroy();
        return;
    }
    const moodCounts = {};
    history.forEach(h => moodCounts[h.mood] = (moodCounts[h.mood] || 0) + 1);
    const moodLabels = Object.keys(moodCounts);
    const moodData = Object.values(moodCounts);
    if (moodChart) moodChart.destroy();
    moodChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: moodLabels, datasets: [{ data: moodData, backgroundColor: ['#1B4D3E', '#2A7F6F', '#D4A574'], borderRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: true, position: 'bottom' } } }
    });
    const dominantMood = moodLabels[moodData.indexOf(Math.max(...moodData))];
    document.getElementById('mood-insight').innerHTML = `😊 <strong>Mood Insight:</strong> Your dominant mood is <strong>${dominantMood}</strong>. This shows your overall emotional state during work sessions.`;
}

function loadHeatmapChart() {
    const history = getHistory();
    const container = document.getElementById('heatmap-calendar');
    if (history.length === 0) {
        document.getElementById('heatmap-insight').innerHTML = '📭 No data available. Log entries to see your heatmap!';
        return;
    }
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    let html = '<div class="heatmap-calendar">';
    const entryMap = {};
    history.forEach(entry => {
        const date = new Date(entry.date + ' 00:00:00').toLocaleDateString('en-GB');
        entryMap[date] = parseInt(entry.productivity);
    });
    let currentDate = new Date(thirtyDaysAgo);
    while (currentDate <= today) {
        const dateStr = currentDate.toLocaleDateString('en-GB');
        const productivity = entryMap[dateStr] || 0;
        const className = `productivity-${productivity}`;
        html += `<div class="heatmap-day ${className}" title="${dateStr}: ${productivity > 0 ? productivity + '/10' : 'No entry'}">${currentDate.getDate()}</div>`;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    html += '</div>';
    container.innerHTML = html;
    
    const currentDate2 = new Date();
    let currentStreak = 0, bestStreak = 0, tempStreak = 0;
    for (let d = new Date(currentDate2); d >= thirtyDaysAgo; d.setDate(d.getDate() - 1)) {
        const dateStr = d.toLocaleDateString('en-GB');
        if (entryMap[dateStr]) { tempStreak++; } else { bestStreak = Math.max(bestStreak, tempStreak); tempStreak = 0; }
    }
    bestStreak = Math.max(bestStreak, tempStreak);
    for (let d = new Date(currentDate2); d >= thirtyDaysAgo; d.setDate(d.getDate() - 1)) {
        const dateStr = d.toLocaleDateString('en-GB');
        if (entryMap[dateStr]) { currentStreak++; } else { break; }
    }
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

function loadBlockRatingsChart() {
    const history = getHistory();
    const ctx = document.getElementById('blockRatingsChart').getContext('2d');
    if (history.length === 0 || !history.some(h => h.blockRatingsData && Object.keys(h.blockRatingsData).length > 0)) {
        document.getElementById('blockratings-insight').innerHTML = '📭 No block rating data available. Start rating your blocks to see analysis!';
        if (blockRatingsChart) blockRatingsChart.destroy();
        return;
    }
    
    const blockRatingsAggregate = {};
    history.forEach(entry => {
        if (entry.blockRatingsData) {
            Object.entries(entry.blockRatingsData).forEach(([blockIdx, rating]) => {
                if (!blockRatingsAggregate[blockIdx]) {
                    blockRatingsAggregate[blockIdx] = { sum: 0, count: 0, ratings: [] };
                }
                blockRatingsAggregate[blockIdx].sum += rating;
                blockRatingsAggregate[blockIdx].count++;
                blockRatingsAggregate[blockIdx].ratings.push(rating);
            });
        }
    });
    
    const blockLabels = Object.keys(blockRatingsAggregate).sort((a,b) => a - b).map(idx => `Block ${parseInt(idx) + 1}`);
    const avgRatings = Object.keys(blockRatingsAggregate).sort((a,b) => a - b).map(idx => (blockRatingsAggregate[idx].sum / blockRatingsAggregate[idx].count).toFixed(1));
    const minRatings = Object.keys(blockRatingsAggregate).sort((a,b) => a - b).map(idx => Math.min(...blockRatingsAggregate[idx].ratings));
    const maxRatings = Object.keys(blockRatingsAggregate).sort((a,b) => a - b).map(idx => Math.max(...blockRatingsAggregate[idx].ratings));
    
    if (blockRatingsChart) blockRatingsChart.destroy();
    blockRatingsChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: blockLabels, datasets: [
            { label: 'Average Rating', data: avgRatings, backgroundColor: '#1B4D3E', borderRadius: 8, yAxisID: 'y' },
            { label: 'Minimum Rating', data: minRatings, backgroundColor: '#EF4444', borderRadius: 8, yAxisID: 'y' },
            { label: 'Maximum Rating', data: maxRatings, backgroundColor: '#10B981', borderRadius: 8, yAxisID: 'y' }
        ] },
        options: { responsive: true, maintainAspectRatio: true, scales: { y: { title: { display: true, text: 'Rating (/10)' }, min: 0, max: 10, ticks: { stepSize: 1 } }, x: { title: { display: true, text: 'Work Blocks' } } }, plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}/10` } } } }
    });
    
    const hardestBlock = avgRatings.reduce((minIdx, rating, idx, arr) => rating < arr[minIdx] ? idx : minIdx, 0);
    const easiestBlock = avgRatings.reduce((maxIdx, rating, idx, arr) => rating > arr[maxIdx] ? idx : maxIdx, 0);
    
    document.getElementById('blockratings-insight').innerHTML = `⭐ <strong>Block Productivity Analysis:</strong><br>
    • <strong>Lowest Productivity Block:</strong> ${blockLabels[hardestBlock]} (Avg: ${avgRatings[hardestBlock]}/10)<br>
    • <strong>Highest Productivity Block:</strong> ${blockLabels[easiestBlock]} (Avg: ${avgRatings[easiestBlock]}/10)<br>
    • <strong>Insight:</strong> ${avgRatings[hardestBlock] < 5 ? 'Consider optimizing your workflow in low-productivity blocks.' : avgRatings[hardestBlock] > 8 ? 'Excellent! You\'re maintaining high productivity across blocks!' : 'Work on balancing productivity levels across all blocks.'}`;
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
    window.resetAllBlockAssignments = resetAllBlockAssignments;
    window.showAllRatingsModal = showAllRatingsModal;
    window.parseAndUpdateBlockTimes = parseAndUpdateBlockTimes;   // ← New function exposed
});