document.addEventListener('DOMContentLoaded', () => {
    // Tab switching logic
    const sgpaBtn = document.getElementById('sgpa-calc-btn');
    const cgpaBtn = document.getElementById('cgpa-calc-btn');
    const sgpaSection = document.getElementById('sgpa-section');
    const cgpaSection = document.getElementById('cgpa-section');

    sgpaBtn.addEventListener('click', () => {
        sgpaBtn.classList.add('active');
        cgpaBtn.classList.remove('active');
        sgpaSection.style.display = 'block';
        cgpaSection.style.display = 'none';
    });

    cgpaBtn.addEventListener('click', () => {
        cgpaBtn.classList.add('active');
        sgpaBtn.classList.remove('active');
        cgpaSection.style.display = 'block';
        sgpaSection.style.display = 'none';
    });
});

// Row management
function addRow() {
    const courseRows = document.getElementById('course-rows');
    const rowCount = courseRows.children.length + 1;

    const newRow = document.createElement('div');
    newRow.className = 'course-row';
    newRow.innerHTML = `
        <input type="text" placeholder="Course ${rowCount}" class="calc-input course-name">
        <input type="number" min="1" max="10" value="3" class="calc-input course-credits">
        <select class="calc-input course-grade">
            <option value="10">O (10)</option>
            <option value="9">A+ (9)</option>
            <option value="8">A (8)</option>
            <option value="7">B+ (7)</option>
            <option value="6">B (6)</option>
            <option value="5">C (5)</option>
            <option value="4">P (4)</option>
            <option value="0">F / Ab (0)</option>
        </select>
        <button class="delete-row-btn" onclick="removeRow(this)">×</button>
    `;

    courseRows.appendChild(newRow);
}

function removeRow(btn) {
    const row = btn.parentElement;
    const courseRows = document.getElementById('course-rows');

    // Don't remove if it's the only row left
    if (courseRows.children.length > 1) {
        row.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            row.remove();
        }, 280);
    } else {
        alert("You need at least one course to calculate SGPA.");
    }
}

// Calculations
function calculateSGPA() {
    const rows = document.querySelectorAll('.course-row');
    let totalCredits = 0;
    let earnedPoints = 0;

    rows.forEach(row => {
        const credits = parseFloat(row.querySelector('.course-credits').value) || 0;
        const gradePoint = parseFloat(row.querySelector('.course-grade').value) || 0;

        totalCredits += credits;
        earnedPoints += (credits * gradePoint);
    });

    const resultBox = document.getElementById('sgpa-result-box');
    const resultValue = document.getElementById('sgpa-value');
    const resultDetails = document.getElementById('sgpa-details');

    if (totalCredits === 0) {
        alert("Please enter valid credits for your courses.");
        return;
    }

    const sgpa = (earnedPoints / totalCredits).toFixed(2);

    resultValue.textContent = sgpa;
    resultDetails.textContent = `Total Credits: ${totalCredits} | Earned Points: ${earnedPoints}`;
    resultBox.style.display = 'block';

    // Scroll to results
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function useForCGPA() {
    const sgpa = document.getElementById('sgpa-value').textContent;
    const details = document.getElementById('sgpa-details').textContent;
    // Extract total credits from details string
    const creditsMatch = details.match(/Total Credits:\s*(\d+(\.\d+)?)/);
    const credits = creditsMatch ? creditsMatch[1] : 0;

    document.getElementById('curr-sgpa').value = sgpa;
    document.getElementById('curr-credits').value = credits;

    // Switch to CGPA tab
    document.getElementById('cgpa-calc-btn').click();
}

function calculateCGPA() {
    const prevCredits = parseFloat(document.getElementById('prev-credits').value) || 0;
    const prevCGPA = parseFloat(document.getElementById('prev-cgpa').value) || 0;
    const currCredits = parseFloat(document.getElementById('curr-credits').value) || 0;
    const currSGPA = parseFloat(document.getElementById('curr-sgpa').value) || 0;

    if (prevCredits === 0 && currCredits === 0) {
        alert("Please enter credits for at least one semester.");
        return;
    }

    const totalCredits = prevCredits + currCredits;
    const totalPoints = (prevCredits * prevCGPA) + (currCredits * currSGPA);

    const cgpa = (totalPoints / totalCredits).toFixed(2);

    const resultBox = document.getElementById('cgpa-result-box');
    const resultValue = document.getElementById('cgpa-value');
    const resultDetails = document.getElementById('cgpa-details');

    resultValue.textContent = cgpa;
    resultDetails.textContent = `Total Credits: ${totalCredits}`;
    resultBox.style.display = 'block';

    // Scroll to results
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
