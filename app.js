// Configuration
const CONFIG = {
    STORAGE_KEY: 'streak40:v1',
    START_DATE: '2025-08-17',
    TOTAL_DAYS: 40,
    TIMEZONE: 'Asia/Kolkata',
    MILESTONES: [7, 14, 21, 28, 35, 40],
    MOTIVATION_TEXTS: [
        "Show up today.",
        "Momentum beats motivation.",
        "Make it obvious. Make it easy.",
        "Protect your energy.",
        "Done > perfect.",
        "Keep the streak."
    ]
};

// State
let appState = {
    start: CONFIG.START_DATE,
    days: [],
    stats: { bestStreak: 0 },
    darkMode: false,
    highContrast: false
};

// Utility Functions
function getDateInIST(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-IN', {
        timeZone: CONFIG.TIMEZONE,
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function addDays(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

function generateDays() {
    const days = [];
    for (let i = 0; i < CONFIG.TOTAL_DAYS; i++) {
        const date = addDays(CONFIG.START_DATE, i);
        days.push({
            date,
            done: false,
            note: ''
        });
    }
    return days;
}

function calculateStreaks() {
    const completedDays = appState.days.filter(day => day.done);
    const totalCompleted = completedDays.length;
    
    // Calculate current streak (consecutive days from the end)
    let currentStreak = 0;
    for (let i = appState.days.length - 1; i >= 0; i--) {
        if (appState.days[i].done) {
            currentStreak++;
        } else {
            break;
        }
    }
    
    // Calculate best streak
    let bestStreak = 0;
    let tempStreak = 0;
    
    appState.days.forEach(day => {
        if (day.done) {
            tempStreak++;
            bestStreak = Math.max(bestStreak, tempStreak);
        } else {
            tempStreak = 0;
        }
    });
    
    // Update best streak in state
    appState.stats.bestStreak = Math.max(appState.stats.bestStreak, bestStreak);
    
    return { totalCompleted, currentStreak, bestStreak: appState.stats.bestStreak };
}

function updateProgress() {
    const { totalCompleted, currentStreak, bestStreak } = calculateStreaks();
    const progress = (totalCompleted / CONFIG.TOTAL_DAYS) * 100;
    
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressBar').setAttribute('aria-valuenow', progress);
    document.getElementById('completedCount').textContent = totalCompleted;
    document.getElementById('currentStreak').textContent = currentStreak;
    document.getElementById('bestStreak').textContent = bestStreak;
}

function saveState() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appState));
}

function loadState() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            appState = { ...appState, ...parsed };
        } catch (e) {
            console.error('Failed to parse saved state:', e);
        }
    }
    
    // Ensure we have all days
    if (appState.days.length !== CONFIG.TOTAL_DAYS) {
        appState.days = generateDays();
    }
    
    // Load theme preferences
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const highContrast = localStorage.getItem('highContrast') === 'true';
    
    if (darkMode) toggleDarkMode();
    if (highContrast) toggleHighContrast();
}

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

function toggleDarkMode() {
    appState.darkMode = !appState.darkMode;
    document.body.classList.toggle('dark', appState.darkMode);
    
    const btn = document.getElementById('darkModeToggle');
    btn.classList.toggle('active', appState.darkMode);
    btn.textContent = appState.darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
    
    localStorage.setItem('darkMode', appState.darkMode);
}

function toggleHighContrast() {
    appState.highContrast = !appState.highContrast;
    document.body.classList.toggle('high-contrast', appState.highContrast);
    
    const btn = document.getElementById('highContrastToggle');
    btn.classList.toggle('active', appState.highContrast);
    
    localStorage.setItem('highContrast', appState.highContrast);
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    appState.days.forEach((day, index) => {
        const dayNumber = index + 1;
        const formattedDate = getDateInIST(day.date);
        const isMilestone = CONFIG.MILESTONES.includes(dayNumber);
        
        const dayCard = document.createElement('div');
        dayCard.className = 'card rounded-2xl p-4 transition-all duration-200';
        
        dayCard.innerHTML = `
            <div class="text-center mb-3">
                <div class="text-sm font-medium mb-1" style="color: var(--muted);">Day ${dayNumber}</div>
                <div class="text-xs" style="color: var(--muted);">${formattedDate}</div>
                ${isMilestone ? '<div class="text-xs mt-1" style="color: var(--accent);">🎯 Milestone</div>' : ''}
            </div>
            
            <div class="flex justify-center mb-3">
                <div class="checkbox ${day.done ? 'checked' : ''}" 
                     role="checkbox" 
                     aria-checked="${day.done}"
                     aria-label="Day ${dayNumber}, ${formattedDate}"
                     tabindex="0"
                     data-day-index="${index}">
                    ${day.done ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 4.5L6 12L2.5 8.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
                </div>
            </div>
            
            <div class="note-section">
                <textarea class="note-input w-full p-2 text-xs rounded-lg resize-none" 
                         placeholder="Add a note..." 
                         maxlength="120" 
                         rows="2"
                         data-day-index="${index}">${day.note}</textarea>
            </div>
        `;
        
        grid.appendChild(dayCard);
    });
    
    // Add event listeners
    document.querySelectorAll('.checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', handleCheckboxClick);
        checkbox.addEventListener('keydown', handleCheckboxKeydown);
    });
    
    document.querySelectorAll('.note-input').forEach(input => {
        input.addEventListener('input', handleNoteInput);
    });
}

function handleCheckboxClick(event) {
    const dayIndex = parseInt(event.target.dataset.dayIndex);
    toggleDay(dayIndex);
}

function handleCheckboxKeydown(event) {
    if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        const dayIndex = parseInt(event.target.dataset.dayIndex);
        toggleDay(dayIndex);
    }
}

function handleNoteInput(event) {
    const dayIndex = parseInt(event.target.dataset.dayIndex);
    appState.days[dayIndex].note = event.target.value;
    saveState();
}

function toggleDay(dayIndex) {
    const day = appState.days[dayIndex];
    const dayNumber = dayIndex + 1;
    const isMilestone = CONFIG.MILESTONES.includes(dayNumber);
    
    day.done = !day.done;
    
    // Update UI
    const checkbox = document.querySelector(`[data-day-index="${dayIndex}"].checkbox`);
    checkbox.classList.toggle('checked', day.done);
    checkbox.setAttribute('aria-checked', day.done);
    
    if (day.done) {
        checkbox.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 4.5L6 12L2.5 8.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        
        if (isMilestone) {
            checkbox.parentElement.parentElement.classList.add('milestone');
            setTimeout(() => {
                checkbox.parentElement.parentElement.classList.remove('milestone');
            }, 600);
        }
    } else {
        checkbox.innerHTML = '';
    }
    
    updateProgress();
    saveState();
}

function exportData() {
    const dataStr = JSON.stringify(appState, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `streak-tracker-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('Data exported successfully!');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            // Validate structure
            if (!imported.days || !Array.isArray(imported.days) || imported.days.length !== CONFIG.TOTAL_DAYS) {
                throw new Error('Invalid data structure');
            }
            
            appState = { ...appState, ...imported };
            renderCalendar();
            updateProgress();
            saveState();
            showToast('Data imported successfully!');
        } catch (error) {
            showToast('Error importing data: Invalid file format');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

function showResetModal() {
    document.getElementById('resetModal').classList.remove('hidden');
    document.getElementById('resetInput').focus();
}

function hideResetModal() {
    document.getElementById('resetModal').classList.add('hidden');
    document.getElementById('resetInput').value = '';
}

function confirmReset() {
    const input = document.getElementById('resetInput').value;
    if (input === 'RESET') {
        appState.days = generateDays();
        appState.stats = { bestStreak: 0 };
        renderCalendar();
        updateProgress();
        saveState();
        hideResetModal();
        showToast('All data has been reset');
    } else {
        showToast('Please type RESET to confirm');
    }
}

function printPage() {
    window.print();
}

function rotateMotivation() {
    const texts = CONFIG.MOTIVATION_TEXTS;
    const current = document.getElementById('motivationText').textContent;
    const currentIndex = texts.indexOf(current);
    const nextIndex = (currentIndex + 1) % texts.length;
    document.getElementById('motivationText').textContent = texts[nextIndex];
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    loadState();
    renderCalendar();
    updateProgress();
    
    // Theme toggles
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    document.getElementById('highContrastToggle').addEventListener('click', toggleHighContrast);
    
    // Footer buttons
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importData);
    document.getElementById('resetBtn').addEventListener('click', showResetModal);
    document.getElementById('printBtn').addEventListener('click', printPage);
    
    // Modal
    document.getElementById('confirmReset').addEventListener('click', confirmReset);
    document.getElementById('cancelReset').addEventListener('click', hideResetModal);
    document.getElementById('resetInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmReset();
        if (e.key === 'Escape') hideResetModal();
    });
    
    // Close modal on backdrop click
    document.getElementById('resetModal').addEventListener('click', (e) => {
        if (e.target.id === 'resetModal') hideResetModal();
    });
    
    // Rotate motivation text every 10 seconds
    setInterval(rotateMotivation, 10000);
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideResetModal();
        }
    });
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}