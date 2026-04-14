// ============================================
// CHIMLA TABDEW - MULTI-TASK BLOCK ASSIGNMENT SYSTEM
// Each block can have MULTIPLE tasks assigned
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

// Multi-Task Block Assignment Storage
// Structure: blockTasksMap[blockIndex] = [{ taskName, rating, completed }]
let blockTasksMap = {};
let blockCompletionMap = {};      // { blockIndex: boolean (all tasks completed?) }
let blockRatingMap = {};           // { blockIndex: averageRating }
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

// ============================================
// AUTO-CALCULATED PRODUCTIVITY SCORE
// ============================================

function calculateAutoProductivityScore() {
    const ratedBlocks = Object.keys(blockRatingMap).filter(idx => blockCompletionMap[idx] === true && blockRatingMap[idx] !== null);
    if (ratedBlocks.length === 0) return null;
    
    let totalRating = 0;
    for (let idx of ratedBlocks) {
        totalRating += blockRatingMap[idx];
    }
    const averageRating = totalRating / ratedBlocks.length;
    return Math.round(averageRating * 10) / 10;
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
// AUTO GENERATE BLOCKS WITH EDITABLE TIME
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
    blockTasksMap = {};
    blockCompletionMap = {};
    blockRatingMap = {};
    blockAssignmentFinished = false;
    document.getElementById('assignmentStatusMsg').innerHTML = '';
    renderBlockAssignmentUI();
    updateAutoProductivityDisplay();
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
}

// ============================================
// MULTI-TASK BLOCK ASSIGNMENT & RATING SYSTEM
// ============================================

function addTaskToBlock(blockIdx) {
    const select = document.getElementById(`block-select-${blockIdx}`);
    if (!select) return;
    const selectedTask = select.value;
    if (!selectedTask) {
        showAlert("Please select a task to add", "warning");
        return;
    }
    
    if (!blockTasksMap[blockIdx]) blockTasksMap[blockIdx] = [];
    blockTasksMap[blockIdx].push({ taskName: selectedTask, rating: null });
    
    // Reset completion status because tasks changed
    blockCompletionMap[blockIdx] = false;
    delete blockRatingMap[blockIdx];
    
    select.value = "";
    renderBlockAssignmentUI();
    updateAutoProductivityDisplay();
    showAlert(`✅ Added "${selectedTask}" to Block ${blockIdx + 1}`, "success");
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
        if (blockTasksMap[blockIdx]) {
            blockTasksMap[blockIdx].forEach(t => t.rating = null);
        }
        showAlert(`⏳ Block ${blockIdx + 1} marked as incomplete. Ratings cleared.`, "warning");
    } else {
        showAlert(`✅ Block ${blockIdx + 1} marked as completed! You can now rate each task.`, "success");
    }
    
    renderBlockAssignmentUI();
    updateAutoProductivityDisplay();
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
    
    let modalHtml = `
        <div id="rating-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10001; backdrop-filter: blur(4px);">
            <div style="background: var(--card-bg); padding: 24px; border-radius: 20px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin-bottom: 15px; color: var(--primary);">⭐ Rate Tasks in Block ${blockIdx + 1}</h3>
    `;
    
    tasks.forEach((task, tIdx) => {
        const currentRating = task.rating || 5;
        modalHtml += `
            <div style="margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                <strong>${escapeHtml(task.taskName)}</strong><br>
                <input type="range" id="rating-slider-${blockIdx}-${tIdx}" min="1" max="10" value="${currentRating}" style="width: 100%; margin-top: 8px;">
                <span id="rating-val-${blockIdx}-${tIdx}" style="display: inline-block; margin-top: 4px;">${currentRating}/10</span>
            </div>
        `;
    });
    
    modalHtml += `
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="saveBlockRatings(${blockIdx})" class="btn btn-primary">Save All Ratings</button>
                    <button onclick="closeRatingModal()" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    closeRatingModal();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Attach live listeners for sliders
    for (let tIdx = 0; tIdx < tasks.length; tIdx++) {
        const slider = document.getElementById(`rating-slider-${blockIdx}-${tIdx}`);
        const span = document.getElementById(`rating-val-${blockIdx}-${tIdx}`);
        if (slider && span) {
            slider.oninput = () => { span.innerText = slider.value + "/10"; };
        }
    }
}

function saveBlockRatings(blockIdx) {
    const tasks = blockTasksMap[blockIdx] || [];
    let totalRating = 0;
    let ratedCount = 0;
    
    for (let tIdx = 0; tIdx < tasks.length; tIdx++) {
        const slider = document.getElementById(`rating-slider-${blockIdx}-${tIdx}`);
        if (slider) {
            const ratingVal = parseInt(slider.value);
            tasks[tIdx].rating = ratingVal;
            totalRating += ratingVal;
            ratedCount++;
        }
    }
    
    if (ratedCount > 0) {
        const avgRating = totalRating / ratedCount;
        blockRatingMap[blockIdx] = Math.round(avgRating * 10) / 10;
        showAlert(`✅ Block ${blockIdx + 1} rated! Average: ${blockRatingMap[blockIdx]}/10`, "success");
    } else {
        blockRatingMap[blockIdx] = null;
    }
    
    closeRatingModal();
    renderBlockAssignmentUI();
    updateAutoProductivityDisplay();
}

function closeRatingModal() {
    const existingModal = document.getElementById('rating-modal-overlay');
    if (existingModal) existingModal.remove();
}

function renderBlockAssignmentUI() {
    const blocksCount = parseInt(document.getElementById('blocks').value) || 1;
    const container = document.getElementById('blockAssignmentContainer');
    if (!container) return;
    
    if (taskList.length === 0) {
        container.innerHTML = `<div style="padding: 12px; background: var(--bg-light); border-radius: 12px; color: var(--text-muted);">
            <span>⚠️ Add at least one task above to assign to blocks.</span>
        </div>`;
        document.getElementById('blockRatingSummary').style.display = 'none';
        return;
    }
    
    let html = '';
    for (let i = 0; i < blocksCount; i++) {
        const blockName = getBlockNameByIndex(i);
        const tasksInBlock = blockTasksMap[i] || [];
        const isCompleted = blockCompletionMap[i] || false;
        const avgRating = blockRatingMap[i] || null;
        const completedClass = isCompleted ? 'completed' : '';
        
        html += `
            <div class="block-assign-row" style="border-left: 4px solid ${isCompleted ? '#10B981' : 'var(--primary)'};">
                <div class="block-header">
                    <span class="block-name">📌 ${escapeHtml(blockName)}</span>
                    <button type="button" class="btn-complete-block ${completedClass}" onclick="markBlockCompleted(${i})" style="background: ${isCompleted ? '#10B981' : '#D4A574'};">
                        ${isCompleted ? '✅ Completed' : '⏳ Mark Block Done'}
                    </button>
                </div>
                
                <div class="multi-task-container" id="tasks-list-block-${i}">
                    ${tasksInBlock.map((t, tIdx) => `
                        <span class="task-tag">
                            ${escapeHtml(t.taskName)} ${t.rating ? `⭐${t.rating}/10` : '📝'}
                            <span class="task-tag-remove" onclick="removeTaskFromBlock(${i}, ${tIdx})">✕</span>
                        </span>
                    `).join('')}
                    ${tasksInBlock.length === 0 ? '<span style="color: var(--text-muted); font-size: 0.8rem;">No tasks added yet</span>' : ''}
                </div>
                
                <div class="add-task-to-block">
                    <select id="block-select-${i}" class="task-selector">
                        <option value="">— Add a task —</option>
                        ${taskList.map(task => `<option value="${escapeHtml(task)}">${escapeHtml(task)}</option>`).join('')}
                    </select>
                    <button type="button" class="btn-sm btn-secondary" onclick="addTaskToBlock(${i})">➕ Add Task</button>
                </div>
                
                <div style="margin-top: 12px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    ${!isCompleted ? 
                        `<button type="button" class="btn-rate-block" disabled style="opacity: 0.5; cursor: not-allowed;">⭐ Rate Block (complete first)</button>` : 
                        `<button type="button" class="btn-rate-block" onclick="showRatingModalForBlock(${i})">${avgRating ? `⭐ Rate (${avgRating}/10)` : '⭐ Rate Block'}</button>`
                    }
                    ${avgRating ? `<span class="rating-badge ${avgRating >= 8 ? 'rating-high' : avgRating >= 5 ? 'rating-medium' : 'rating-low'}">Avg: ${avgRating}/10</span>` : ''}
                </div>
            </div>
        `;
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
        for (let i = 0; i < ratedBlocks.length; i++) {
            const idx = ratedBlocks[i];
            const rating = blockRatingMap[idx];
            const ratingClass = rating >= 8 ? 'rating-high' : (rating >= 5 ? 'rating-medium' : 'rating-low');
            summary += `<span class="rating-badge ${ratingClass}" style="margin-right: 8px; margin-bottom: 5px; display: inline-block;">Block ${parseInt(idx) + 1}: ${rating}/10</span>`;
        }
        summaryTextDiv.innerHTML = summary || 'No ratings yet';
    } else {
        summaryDiv.style.display = 'none';
    }
}

function showAllRatingsModal() {
    let ratingsHtml = '<div style="max-height: 400px; overflow-y: auto;"><h3 style="margin-bottom: 15px;">⭐ Block Ratings Summary</h3>';
    
    for (let i = 0; i < Object.keys(blockTasksMap).length; i++) {
        const tasks = blockTasksMap[i];
        if (tasks && tasks.length > 0) {
            const isCompleted = blockCompletionMap[i] || false;
            const avgRating = blockRatingMap[i] || 'Not rated';
            const ratingClass = (avgRating !== 'Not rated' && avgRating >= 8) ? 'rating-high' : (avgRating !== 'Not rated' && avgRating >= 5) ? 'rating-medium' : 'rating-low';
            
            ratingsHtml += `
                <div style="padding: 12px; margin-bottom: 10px; background: var(--bg-light); border-radius: 10px; border-left: 4px solid ${isCompleted ? '#10B981' : 'var(--primary)'};">
                    <strong>Block ${i+1}:</strong><br>
                    ${tasks.map(t => `• ${escapeHtml(t.taskName)} ${t.rating ? `⭐${t.rating}/10` : '📝 Not rated'}`).join('<br>')}
                    <br>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">${isCompleted ? '✅ Completed' : '⏳ Not completed'}</span><br>
                    <span class="rating-badge ${ratingClass}" style="margin-top: 5px; display: inline-block;">⭐ ${avgRating === 'Not rated' ? 'Not rated' : avgRating + '/10'}</span>
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
        blockTasksMap = {};
        blockCompletionMap = {};
        blockRatingMap = {};
        blockAssignmentFinished = false;
        document.getElementById('assignmentStatusMsg').innerHTML = '';
        renderBlockAssignmentUI();
        updateAutoProductivityDisplay();
        showAlert('🔄 All block assignments and ratings have been reset', 'success');
    }
}

function finalizeBlockAssignments() {
    const blocksCount = parseInt(document.getElementById('blocks').value) || 1;
    const missingBlocks = [];
    const uncompletedBlocks = [];
    
    for (let i = 0; i < blocksCount; i++) {
        if (!blockTasksMap[i] || blockTasksMap[i].length === 0) {
            missingBlocks.push(i + 1);
        } else if (!blockCompletionMap[i]) {
            uncompletedBlocks.push(i + 1);
        }
    }
    
    if (missingBlocks.length > 0) {
        showAlert(`⚠️ Please add tasks to Block(s) ${missingBlocks.join(', ')} before finishing.`, "error");
        return false;
    }
    
    if (uncompletedBlocks.length > 0) {
        showAlert(`⚠️ Please mark Block(s) ${uncompletedBlocks.join(', ')} as completed before finishing.`, "error");
        return false;
    }
    
    blockAssignmentFinished = true;
    document.getElementById('assignmentStatusMsg').innerHTML = '✅ Block assignments finalized! Productivity score calculated.';
    showAlert("✅ Great! All blocks completed. Your productivity score has been calculated.", "success");
    return true;
}

function getBlockNameByIndex(idx) {
    const blockTasksRaw = document.getElementById('block-tasks').value;
    if (!blockTasksRaw) return `Block ${idx + 1}`;
    const parts = blockTasksRaw.split(',').map(s => s.trim());
    if (parts[idx]) {
        return parts[idx].replace(/\s*\([\d.]+\s*h?\)/, '').trim();
    }
    return `Block ${idx + 1}`;
}

// ============================================
// TASK MANAGEMENT
// ============================================

function addTask() {
    const input = document.getElementById('task-input');
    const val = input.value.trim();
    if (val) {
        if (taskList.includes(val)) {
            showAlert("⚠️ Task already exists!", "warning");
            return;
        }
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
    list.innerHTML = taskList.map((t, i) => `
        <li>
            <span>${escapeHtml(t)}</span>
            <span class="delete-task" onclick="removeTask(${i})">✕</span>
        </li>
    `).join('');
}

function removeTask(index) {
    const removedTask = taskList[index];
    taskList.splice(index, 1);
    updateTaskListUI();
    document.getElementById('tasks').value = taskList.join(', ');
    
    // Remove this task from all blocks
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
    blockAssignmentFinished = false;
    document.getElementById('assignmentStatusMsg').innerHTML = '';
    updateAutoProductivityDisplay();
    showAlert(`🗑️ Removed "${removedTask}"`, "warning");
}

// ============================================
// LOGIN/LOGOUT
// ============================================

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
    blockTasksMap = {};
    blockCompletionMap = {};
    blockRatingMap = {};
    blockAssignmentFinished = false;
    updateAutoProductivityDisplay();
}

function setupEventListeners() {
    const blocksInput = document.getElementById('blocks');
    const hoursInput = document.getElementById('total-hours');
    const blockTasksInput = document.getElementById('block-tasks');

    if (blocksInput) blocksInput.addEventListener('change', autoGenerateBlocksManual);
    if (hoursInput) hoursInput.addEventListener('change', autoGenerateBlocksManual);
    
    if (blockTasksInput) {
        blockTasksInput.addEventListener('change', parseAndUpdateBlockTimes);
        blockTasksInput.addEventListener('blur', parseAndUpdateBlockTimes);
    }
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
// SAVE ENTRY
// ============================================

function saveEntry() {
    const blocksCount = parseInt(document.getElementById('blocks').value) || 1;
    
    const missingBlocks = [];
    const uncompletedBlocks = [];
    
    for (let i = 0; i < blocksCount; i++) {
        if (!blockTasksMap[i] || blockTasksMap[i].length === 0) {
            missingBlocks.push(i + 1);
        } else if (!blockCompletionMap[i]) {
            uncompletedBlocks.push(i + 1);
        }
    }
    
    if (missingBlocks.length > 0) {
        showAlert(`⚠️ Please add tasks to Block(s) ${missingBlocks.join(', ')}.`, "error");
        return;
    }
    
    if (uncompletedBlocks.length > 0) {
        showAlert(`⚠️ Please mark Block(s) ${uncompletedBlocks.join(', ')} as completed.`, "error");
        return;
    }
    
    const autoScore = calculateAutoProductivityScore();
    const finalProductivity = autoScore !== null ? autoScore : 5;
    
    // Prepare block data for storage
    const blockMultiTasksData = {};
    for (let i = 0; i < blocksCount; i++) {
        if (blockTasksMap[i]) {
            blockMultiTasksData[i] = blockTasksMap[i].map(t => ({
                taskName: t.taskName,
                rating: t.rating
            }));
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
        blockCompletionMap: { ...blockCompletionMap },
        blockRatingMap: { ...blockRatingMap },
        productivity: finalProductivity,
        comments: document.getElementById('comments').value
    };
    
    let history = getHistory();
    history.push(entry);
    localStorage.setItem('productivity_history', JSON.stringify(history));
    
    showAlert(`✅ Entry saved successfully! Productivity score: ${finalProductivity}/10`, 'success');
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
    blockAssignmentFinished = false;
    document.getElementById('assignmentStatusMsg').innerHTML = '';
    setTimeout(() => autoGenerateBlocksManual(), 100);
    updateAutoProductivityDisplay();
}

function getHistory() {
    const stored = localStorage.getItem('productivity_history');
    return stored ? JSON.parse(stored) : [];
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
    
    list.innerHTML = history.slice().reverse().map((entry, idx) => `
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
    if (entry.blockMultiTasks) {
        for (let i = 0; i < Object.keys(entry.blockMultiTasks).length; i++) {
            const tasks = entry.blockMultiTasks[i];
            if (tasks && tasks.length > 0) {
                const completed = entry.blockCompletionMap && entry.blockCompletionMap[i] ? '✅' : '⏳';
                const avgRating = entry.blockRatingMap && entry.blockRatingMap[i] ? `⭐ ${entry.blockRatingMap[i]}/10` : 'Not rated';
                blockDetails += `
                    <div style="padding: 10px; background: var(--bg-light); border-radius: 8px; margin-bottom: 8px; border-left: 4px solid var(--primary);">
                        <strong>Block ${parseInt(i) + 1}:</strong><br>
                        ${tasks.map(t => `• ${escapeHtml(t.taskName)} ${t.rating ? `⭐${t.rating}/10` : '📝 Not rated'}`).join('<br>')}
                        <br>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">${completed} ${avgRating}</span>
                    </div>
                `;
            }
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
        ${blockDetails ? `<div class="detail-section"><h3>🎯 Block Details (Multi-Task)</h3>${blockDetails}</div>` : ''}
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
    if (history.length === 0 || !history.some(h => h.blockRatingMap && Object.keys(h.blockRatingMap).length > 0)) {
        document.getElementById('blockratings-insight').innerHTML = '📭 No block rating data available. Start rating your blocks to see analysis!';
        if (blockRatingsChart) blockRatingsChart.destroy();
        return;
    }
    
    const blockRatingsAggregate = {};
    history.forEach(entry => {
        if (entry.blockRatingMap) {
            Object.entries(entry.blockRatingMap).forEach(([blockIdx, rating]) => {
                if (!blockRatingsAggregate[blockIdx]) {
                    blockRatingsAggregate[blockIdx] = { sum: 0, count: 0, ratings: [] };
                }
                blockRatingsAggregate[blockIdx].sum += rating;
                blockRatingsAggregate[blockIdx].count++;
                blockRatingsAggregate[blockIdx].ratings.push(rating);
            });
        }
    });
    
    const blockLabels = Object.keys(blockRatingsAggregate).sort((a, b) => a - b).map(idx => `Block ${parseInt(idx) + 1}`);
    const avgRatings = Object.keys(blockRatingsAggregate).sort((a, b) => a - b).map(idx => (blockRatingsAggregate[idx].sum / blockRatingsAggregate[idx].count).toFixed(1));
    const minRatings = Object.keys(blockRatingsAggregate).sort((a, b) => a - b).map(idx => Math.min(...blockRatingsAggregate[idx].ratings));
    const maxRatings = Object.keys(blockRatingsAggregate).sort((a, b) => a - b).map(idx => Math.max(...blockRatingsAggregate[idx].ratings));
    
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
    const daily = localStorage.getItem("dailyReminderEnabled") === "true";
    document.getElementById("daily-reminder-toggle").checked = daily;
    document.getElementById("weekly-report-toggle").checked = localStorage.getItem("weeklyReportEnabled") === "true";
    document.getElementById("nudge-toggle").checked = localStorage.getItem("nudgeEnabled") === "true";
    document.getElementById("reminder-time").value = localStorage.getItem("reminderTime") || "20:00";
    if (daily) scheduleDailyReminder(document.getElementById("reminder-time").value);
}
function toggleDailyReminder() { localStorage.setItem("dailyReminderEnabled", document.getElementById("daily-reminder-toggle").checked); }
function saveReminderTime() { localStorage.setItem("reminderTime", document.getElementById("reminder-time").value); }
function scheduleDailyReminder(time) { if (reminderCheckInterval) clearInterval(reminderCheckInterval); }
function toggleWeeklyReport() { localStorage.setItem("weeklyReportEnabled", document.getElementById("weekly-report-toggle").checked); }
function toggleNudge() { localStorage.setItem("nudgeEnabled", document.getElementById("nudge-toggle").checked); }
function setupReminderSystem() {}
function getBestWorkTimeSuggestions() { const history = getHistory(); if (history.length < 5) return "Log at least 5 entries to get suggestions!"; return "Based on your data, optimal work hours vary. Keep tracking!"; }
function displayWorkTimeSuggestion() { const container = document.getElementById("work-time-suggestion"); if (container) { container.innerHTML = `<h4>⏰ Personalized Work Suggestion</h4><p>${getBestWorkTimeSuggestions()}</p>`; container.style.display = "block"; } }
function addWorkTimeSuggestionCard() { displayWorkTimeSuggestion(); }

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
window.finalizeBlockAssignments = finalizeBlockAssignments;
window.resetAllBlockAssignments = resetAllBlockAssignments;
window.renderBlockAssignmentUI = renderBlockAssignmentUI;
window.parseAndUpdateBlockTimes = parseAndUpdateBlockTimes;
window.toggleTheme = toggleTheme;
window.setMood = setMood;
window.addTask = addTask;
window.removeTask = removeTask;
window.login = login;
window.logout = logout;
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

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    const defaultMoodBtn = document.querySelector('[data-mood="😊"]');
    if (defaultMoodBtn) defaultMoodBtn.classList.add('active');
    if (Notification.permission === "granted") { notificationPermissionGranted = true; setupReminderSystem(); }
    updateAutoProductivityDisplay();
});