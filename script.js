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
    
    // Auto-calculate hours per block
    const totalHoursInput = document.getElementById("total-hours");
    const blocksInput = document.getElementById("blocks");
    const perBlockInput = document.getElementById("hours-per-block");
    const blockTasksInput = document.getElementById("block-tasks");
    
    function updatePerBlock() {
        const total = parseFloat(totalHoursInput.value) || 0;
        const blocks = parseInt(blocksInput.value) || 1;
        perBlockInput.value = (total / blocks).toFixed(1);
    }
    
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
    
    totalHoursInput.addEventListener("input", updatePerBlock);
    blocksInput.addEventListener("input", updatePerBlock);
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
}

function saveEntry() {
    const tasks = document.getElementById("tasks").value;
    const totalHours = document.getElementById("total-hours").value;
    const blockTasks = document.getElementById("block-tasks").value;
    const blocks = document.getElementById("blocks").value;
    const hoursPerBlock = document.getElementById("hours-per-block").value;
    const productivity = document.getElementById("productivity").value;
    const comments = document.getElementById("comments").value;

    if (!tasks) {
        alert("Please tell us what you are going to do today.");
        return;
    }
    if (!blockTasks) {
    alert("Please write your each block task.");
    return;
}

    // Show summary
    document.getElementById("sum-tasks").textContent = tasks;
    document.getElementById("sum-block-tasks").textContent = blockTasks;
    document.getElementById("sum-hours").textContent = totalHours;
    document.getElementById("sum-blocks").textContent = blocks;
    document.getElementById("sum-per-block").textContent = hoursPerBlock;
    document.getElementById("sum-rating").textContent = productivity;
    document.getElementById("sum-comments").textContent = comments || "No comments added.";

    document.getElementById("summary").classList.remove("hidden");

    // Feedback based on rating
    let feedback = "";
    if (productivity >= 9) feedback = "Excellent! You were highly focused today.";
    else if (productivity >= 6) feedback = "Good job! Small improvements can make it even better.";
    else if (productivity >= 4) feedback = "Fair. Try reducing distractions tomorrow.";
    else feedback = "Room for improvement. Planning and focus will help.";

    // Lessons learned (as in your story)
    const lessonsHTML = `
        <li><strong>Planning the Day:</strong> You planned your tasks and time blocks clearly.</li>
        <li><strong>Block Tasks:</strong> ${blockTasks}</li>
        <li><strong>Staying Focused:</strong> You worked on ${tasks} in structured blocks.</li>
        <li><strong>Rating Your Productivity:</strong> You rated yourself ${productivity}/10 and added reflections.</li>
        <li><strong>Getting Better Over Time:</strong> ${feedback}</li>
    `;
    document.getElementById("lessons-list").innerHTML = lessonsHTML;

    // Save to localStorage (history)
    let history = JSON.parse(localStorage.getItem("productivityHistory") || "[]");
    history.push({
        date: new Date().toLocaleDateString(),
        tasks: tasks,
        blockTasks: blockTasks,
        productivity: productivity,
        comments: comments
    });
    localStorage.setItem("productivityHistory", JSON.stringify(history));

    alert("Entry saved successfully! Great work today, Penjor. 🌱\n\nYou can check your past entries in the browser console (F12).");
}

// Allow pressing Enter in login
document.getElementById("password").addEventListener("keypress", function(e) {         
    if (e.key === "Enter") login();
});