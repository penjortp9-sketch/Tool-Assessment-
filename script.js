// New Features Logic
let taskList = [];

function setMood(mood, btn) {
    document.getElementById('selected-mood').value = mood;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function addTask() {
    const input = document.getElementById('task-input');
    const val = input.value.trim();
    if (val) {
        taskList.push(val);
        updateTaskListUI();
        input.value = '';
        // Sync with your original 'tasks' ID so your saveEntry() function still works
        document.getElementById('tasks').value = taskList.join(', ');
    }
}

function updateTaskListUI() {
    const list = document.getElementById('task-checklist');
    list.innerHTML = taskList.map((t, i) => `
        <li>
            ${t} 
            <span class="delete-task" onclick="removeTask(${i})">✕</span>
        </li>
    `).join('');
}

function removeTask(index) {
    taskList.splice(index, 1);
    updateTaskListUI();
    document.getElementById('tasks').value = taskList.join(', ');
}

const quotes = [
    "Focus on being productive instead of busy.",
    "The secret of getting ahead is getting started.",
    "Your mind is for having ideas, not holding them.",
    "Done is better than perfect."
];
let currentUser = "Penjor";

function autoGenerateBlocksManual() {
    const total = parseFloat(document.getElementById("total-hours").value) || 0;
    const blocks = parseInt(document.getElementById("blocks").value) || 1;
    const hoursPerBlock = (total / blocks).toFixed(1);
    
    let blockLabels = [];
    for (let i = 1; i <= blocks; i++) {
        blockLabels.push(`Block ${i} (${hoursPerBlock}h)`);
    }
    document.getElementById("block-tasks").value = blockLabels.join(", ");
}

function login() {
    const name = document.getElementById("username").value.trim();
    if (name) {
        currentUser = name;
    }
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-screen").classList.remove("hidden");
    
    document.getElementById("greeting-name").textContent = currentUser;
    document.getElementById("current-date").textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' });
    document.getElementById('daily-quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];
    // Auto-generate blocks on login
    setTimeout(() => {
        autoGenerateBlocksManual();
    }, 100);
    
    // Setup event listeners
    const totalHoursInput = document.getElementById("total-hours");
    const blocksInput = document.getElementById("blocks");
    const blockTasksInput = document.getElementById("block-tasks");
    
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
    
    // Update rating live
    const ratingSlider = document.getElementById("productivity");
    const ratingValue = document.getElementById("rating-value");
    ratingSlider.addEventListener("input", () => {
        ratingValue.textContent = ratingSlider.value;
    });
}

function logout() {
    document.getElementById("main-screen").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("summary").classList.add("hidden");
}

function saveEntry() {
    // 1. Get all the values from the form
    const tasks = document.getElementById("tasks").value.trim();
    const totalHours = document.getElementById("total-hours").value;
    const blockTasks = document.getElementById("block-tasks").value.trim();
    const blocks = document.getElementById("blocks").value;
    const productivity = document.getElementById("productivity").value;
    const comments = document.getElementById("comments").value.trim();
    
    // --- ADDED THIS LINE: Get the mood value ---
    const mood = document.getElementById("selected-mood").value; 

    // 2. Validation: Make sure they entered tasks
    if (!tasks) {
        alert("❌ Please add at least one task today.");
        return;
    }
    if (!blockTasks) {
        alert("❌ Please divide your work into blocks (use Auto-Generate button).");
        return;
    }

    // 3. Calculate hours per block
    const hoursPerBlock = (parseFloat(totalHours) / parseInt(blocks)).toFixed(1);

    // 4. Show summary on screen
    document.getElementById("sum-tasks").textContent = tasks;
    document.getElementById("sum-block-tasks").textContent = blockTasks;
    document.getElementById("sum-hours").textContent = totalHours;
    document.getElementById("sum-blocks").textContent = blocks;
    document.getElementById("sum-per-block").textContent = hoursPerBlock;
    document.getElementById("sum-rating").textContent = productivity;
    document.getElementById("sum-comments").textContent = comments || "No comments added.";

    document.getElementById("summary").classList.remove("hidden");

    // 5. Generate feedback lessons
    let feedback = "";
    if (productivity >= 9) feedback = "Excellent! You were highly focused today.";
    else if (productivity >= 6) feedback = "Good job! Small improvements can make it even better.";
    else if (productivity >= 4) feedback = "Fair. Try reducing distractions tomorrow.";
    else feedback = "Room for improvement. Planning and focus will help.";

    const lessonsHTML = `
        <li><strong>Morning Mood:</strong> You started the day feeling ${mood}</li>
        <li><strong>Planning the Day:</strong> You planned your tasks and time blocks clearly.</li>
        <li><strong>Focus Area:</strong> You worked on: ${tasks}</li>
        <li><strong>Growth:</strong> ${feedback}</li>
    `;
    document.getElementById("lessons-list").innerHTML = lessonsHTML;

    // 6. SAVE TO HISTORY (This is the part you were looking for)
    let history = JSON.parse(localStorage.getItem("productivityHistory") || "[]");
    
    history.push({
        date: new Date().toLocaleDateString(),
        tasks: tasks,
        mood: mood,           // <--- ADDED THIS LINE
        blockTasks: blockTasks,
        productivity: productivity,
        comments: comments
    });
    
    localStorage.setItem("productivityHistory", JSON.stringify(history));

    // Scroll to summary so the user sees it
    setTimeout(() => {
        document.getElementById("summary").scrollIntoView({ behavior: "smooth" });
    }, 200);
}

// Allow pressing Enter in login
document.getElementById("password").addEventListener("keypress", function(e) {         
    if (e.key === "Enter") login();
});