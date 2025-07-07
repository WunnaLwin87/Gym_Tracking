
// Global variables from external scripts (gapi, google, Chart) are loaded in index.html

const exerciseLibrary = {
    "Chest": ["Incline Dumbbell Press", "Machine Chest Fly", "Incline Machine Press", "Flat Bench Press", "Decline Bench Press", "Dumbbell Flyes", "Push-ups"],
    "Shoulders": ["Dumbbell Shoulder Press", "Lateral Raise", "Front Raise", "Reverse Pec Deck", "Arnold Press", "Upright Row"],
    "Biceps": ["EZ Bar Curls", "Hammer Curls", "Preacher Curl", "Concentration Curl", "Dumbbell Bicep Curl", "Cable Curl"],
    "Triceps": ["Triceps Extension", "Dips", "Triceps Rope Pushdown", "Close-Grip Bench Press", "Skullcrushers", "Overhead Dumbbell Extension"],
    "Back": ["Lat Pull Down", "Seated Cable Row", "Face Pulls", "Barbell Row", "T-Bar Row", "Pull-ups", "Deadlifts (conventional)"],
    "Legs": ["Leg Press", "Squat", "Leg Extension", "Calf Raise", "Hamstring Curl", "Hip Thrusts", "Romanian Deadlifts", "Lunges"],
    "Treadmill": ["Treadmill Cardio"] // Special key for cardio
};

let workoutHistory = [];
let activeWorkout = null;
let timerInterval = null;
let stopwatchStartTime = null;
let currentExerciseLog = null;
let progressChartInstance = null;

const views = {
    home: document.getElementById('home-view'),
    activeWorkout: document.getElementById('active-workout-view'),
    history: document.getElementById('history-view'),
    progress: document.getElementById('progress-view'),
    export: document.getElementById('export-view')
};
const navLinks = {
    home: document.getElementById('nav-home'),
    history: document.getElementById('nav-history'),
    progress: document.getElementById('nav-progress'),
    export: document.getElementById('nav-export')
};

const startWorkoutBtn = document.getElementById('start-workout-btn');
const stopwatchDisplay = document.getElementById('stopwatch-display');
const muscleGroupSelect = document.getElementById('muscle-group-select');
const exerciseSelect = document.getElementById('exercise-select');
const cardioInputArea = document.getElementById('cardio-input-area');
const strengthInputArea = document.getElementById('strength-input-area');
const exerciseSelectionArea = document.getElementById('exercise-selection-area');
const workoutProgressionButtons = document.getElementById('workout-progression-buttons');
const nextExerciseBtn = document.getElementById('next-exercise-btn');
const finishWorkoutBtn = document.getElementById('finish-workout-btn');
const addSetBtn = document.getElementById('add-set-btn');
const addBulkSetsBtn = document.getElementById('add-bulk-sets-btn');
const logCardioBtn = document.getElementById('log-cardio-btn');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const progressExerciseSelect = document.getElementById('progress-exercise-select');
const exportCsvBtn = document.getElementById('export-csv-btn');
const workoutsThisWeekCount = document.getElementById('workouts-this-week-count');
const currentExerciseLogTitleSpan = document.querySelector('#current-exercise-log-title span');
const loggedSetsDisplay = document.getElementById('logged-sets-display');

// --- Theme Management Elements ---
const themeToggleBtn = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('theme-toggle-sun');
const moonIcon = document.getElementById('theme-toggle-moon');

// --- Google Sheets Sync Elements ---
const googleAuthorizeBtn = document.getElementById('google-authorize-btn');
const googleSignoutBtn = document.getElementById('google-signout-btn');
const syncGoogleSheetsBtn = document.getElementById('sync-google-sheets-btn');
const googleAuthStatusEl = document.getElementById('google-auth-status');
const googleSyncStatusEl = document.getElementById('google-sync-status');

// --- Google API Configuration ---
const GOOGLE_CLIENT_ID = '292165378075-smrkd0eref9irfvhpe7dqfv0f5hqpk70.apps.googleusercontent.com'; 
const GOOGLE_SPREADSHEET_ID = '1pq_fs1o_q4xWTzX7lBK7_k7cRblkOWRVZjJXH8XbJ-I'; 
const GOOGLE_SHEET_RANGE = 'Data Input'; 
const GOOGLE_API_SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Define callback before it's referenced
const tokenResponseCallback = (resp) => {
    if (resp.error) {
        console.error('Google token error:', resp.error);
        googleAuthStatusEl.textContent = `Authorization failed: ${resp.error}`;
        alert(`Authorization failed: ${resp.error}`);
    } else {
        googleAuthStatusEl.textContent = 'Authorization successful!';
    }
    updateGAuthButtonStatus();
};

// --- Google API Callbacks (must be global) ---
window.gapiLoaded = () => {
    gapi.load('client', initializeGapiClient); 
};

window.gisLoaded = () => {
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: GOOGLE_API_SCOPES,
            callback: tokenResponseCallback, 
        });
        gisInited = true;
    } catch (e) {
        console.error("Error initializing GIS client:", e);
        gisInited = false;
        googleAuthStatusEl.textContent = 'Error initializing Google Sign-In. See console.';
    }
    updateGAuthButtonStatus();
};

window.tokenResponseCallback = tokenResponseCallback;

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        });
        gapiInited = true;
    } catch (e) {
        console.error("Error initializing GAPI client:", e);
        gapiInited = false; 
        googleAuthStatusEl.textContent = 'Error initializing Google API Client. See console.';
    }
    updateGAuthButtonStatus();
}

function updateGAuthButtonStatus() {
    if (gapiInited && gisInited) {
        const token = gapi.client.getToken(); 
        if (token && token.access_token) { 
            googleAuthStatusEl.textContent = 'Authorized with Google.';
            googleAuthorizeBtn.classList.add('hidden');
            googleSignoutBtn.classList.remove('hidden');
            syncGoogleSheetsBtn.disabled = false;
        } else {
            googleAuthStatusEl.textContent = 'Not authorized. Click below to authorize.';
            googleAuthorizeBtn.classList.remove('hidden');
            googleSignoutBtn.classList.add('hidden');
            syncGoogleSheetsBtn.disabled = true;
        }
    } else {
         googleAuthStatusEl.textContent = 'Initializing Google services... Please wait.';
    }
}

function handleGoogleAuth() {
    if (GOOGLE_CLIENT_ID.includes('PLACEHOLDER') || GOOGLE_SPREADSHEET_ID.includes('PLACEHOLDER')) {
        alert("Please replace placeholder Google API credentials in the script to use this feature.");
        googleAuthStatusEl.textContent = 'Configuration needed: Update placeholder IDs in the script.';
        return;
    }
    if (gapiInited && gisInited && tokenClient) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        googleAuthStatusEl.textContent = 'Google services not fully loaded yet. Please wait.';
    }
}

function handleGoogleSignout() {
    const token = gapi.client.getToken();
    if (token !== null && token.access_token) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(''); 
            updateGAuthButtonStatus();
            googleSyncStatusEl.textContent = 'Signed out.';
        });
    } else {
        gapi.client.setToken(''); 
        updateGAuthButtonStatus();
        googleSyncStatusEl.textContent = 'Signed out.';
    }
}

async function syncToGoogleSheets() {
    googleSyncStatusEl.className = 'sync-status';
    if (workoutHistory.length === 0) {
        googleSyncStatusEl.textContent = "No workout data to sync.";
        googleSyncStatusEl.classList.add('status-warning');
        return;
    }
     if (!gapi.client.getToken() || !gapi.client.getToken().access_token) {
        googleSyncStatusEl.textContent = "Please authorize with Google first.";
        googleSyncStatusEl.classList.add('status-error');
        handleGoogleAuth(); 
        return;
    }

    googleSyncStatusEl.textContent = "Syncing data to Google Sheets...";
    googleSyncStatusEl.classList.add('status-info');
    syncGoogleSheetsBtn.disabled = true;

    const valuesToAppend = workoutHistory.flatMap(workout =>
        workout.exercises.flatMap(ex => {
            if (ex.sets && ex.sets.length > 0) { 
                return ex.sets.map((set, index) => [
                    workout.date, workout.duration, ex.muscleGroup, ex.name,
                    index + 1, set.reps, set.weight, "", "", ""
                ]);
            } else if (ex.cardio) { 
                return [[
                    workout.date, workout.duration, ex.muscleGroup, ex.name,
                    "", "", "", ex.cardio.incline, ex.cardio.speed, ex.cardio.duration
                ]];
            }
            return [];
        })
    );

    try {
        if (!gapi.client.sheets) {
            throw new Error("Google Sheets API client not loaded.");
        }
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SPREADSHEET_ID,
            range: GOOGLE_SHEET_RANGE,
            valueInputOption: 'USER_ENTERED', 
            insertDataOption: 'INSERT_ROWS', 
            resource: { values: valuesToAppend },
        });
        googleSyncStatusEl.textContent = `Successfully synced ${valuesToAppend.length} rows.`;
        googleSyncStatusEl.className = 'sync-status status-success';
    } catch (err) {
        console.error('Error syncing to Google Sheets:', err);
        googleSyncStatusEl.textContent = `Error syncing: ${err.result?.error?.message || err.message}.`;
        googleSyncStatusEl.className = 'sync-status status-error';
    } finally {
        syncGoogleSheetsBtn.disabled = false;
        updateGAuthButtonStatus(); 
    }
}

// --- Navigation ---
function navigateTo(viewId) {
    Object.values(views).forEach(view => view.classList.add('hidden'));
    views[viewId].classList.remove('hidden');

    Object.values(navLinks).forEach(link => link.classList.remove('nav-link-active'));
    if (navLinks[viewId]) navLinks[viewId].classList.add('nav-link-active');

    if (viewId === 'home') renderHomeView();
    if (viewId === 'history') renderHistoryView();
    if (viewId === 'progress') renderProgressView();
    if (viewId === 'export') {
        updateGAuthButtonStatus(); 
        googleSyncStatusEl.textContent = ''; 
    }
}

// --- Data Persistence ---
function loadWorkoutHistory() {
    const storedHistory = localStorage.getItem('gymTrackerHistory');
    if (storedHistory) workoutHistory = JSON.parse(storedHistory);
}
function saveWorkoutHistory() {
    localStorage.setItem('gymTrackerHistory', JSON.stringify(workoutHistory));
}
function clearAllWorkoutHistory() {
    if (confirm("Are you sure? This will delete all workout history permanently.")) {
        workoutHistory = [];
        saveWorkoutHistory();
        renderHistoryView();
        renderHomeView();    
        renderProgressView(); 
    }
}

// --- View Rendering ---
function renderHomeView() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const workoutsLastWeek = workoutHistory.filter(w => new Date(w.date) >= oneWeekAgo);
    workoutsThisWeekCount.textContent = workoutsLastWeek.length.toString();
}

function renderHistoryView() {
    historyList.innerHTML = ''; 
    if (workoutHistory.length === 0) {
        historyList.innerHTML = '<p class="text-secondary">No workouts recorded yet.</p>';
        return;
    }
    [...workoutHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).forEach(workout => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        let exercisesSummary = workout.exercises.map(ex => {
            let summary = `<strong class="text-accent">${ex.name}</strong> (${ex.muscleGroup})`;
            if (ex.sets?.length) summary += `: ${ex.sets.length} set(s)`;
            else if (ex.cardio) summary += `: ${ex.cardio.duration} min`;
            return summary;
        }).join('<br>');
        cardEl.innerHTML = `
            <div class="history-card-header">
                <h3 class="text-lg font-semibold">${new Date(workout.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                <span class="text-sm text-secondary">${workout.duration}</span>
            </div>
            <div class="text-sm">${exercisesSummary || 'No exercises logged.'}</div>
        `;
        historyList.appendChild(cardEl);
    });
}

function renderProgressView() {
    populateProgressExerciseSelect(); 
}

// --- Stopwatch ---
function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
function startStopwatch() {
    stopwatchStartTime = Date.now();
    stopwatchDisplay.textContent = formatTime(0);
    timerInterval = setInterval(() => {
        if (stopwatchStartTime) {
            stopwatchDisplay.textContent = formatTime(Date.now() - stopwatchStartTime);
        }
    }, 1000);
}
function stopStopwatch() {
    clearInterval(timerInterval);
    timerInterval = null;
    return stopwatchStartTime ? formatTime(Date.now() - stopwatchStartTime) : '00:00:00';
}

// --- Active Workout ---
function initializeActiveWorkoutView() {
    activeWorkout = { id: Date.now(), date: new Date().toISOString().split('T')[0], startTime: Date.now(), duration: null, exercises: [] };
    currentExerciseLog = null;
    resetActiveWorkoutUI();
    populateMuscleGroupDropdown();
    startStopwatch();
    navigateTo('activeWorkout');
}

function resetActiveWorkoutUI() {
    ['muscle-group-select', 'incline-input', 'speed-input', 'cardio-duration-input', 'reps-input', 'weight-input', 'bulk-sets-count', 'bulk-reps-input', 'bulk-weight-input'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    exerciseSelect.innerHTML = '<option value="">-- Choose an exercise --</option>';
    loggedSetsDisplay.innerHTML = '';
    if(currentExerciseLogTitleSpan) currentExerciseLogTitleSpan.textContent = '';
    [exerciseSelectionArea, cardioInputArea, strengthInputArea, workoutProgressionButtons].forEach(el => el.classList.add('hidden'));
}

function populateMuscleGroupDropdown() {
    muscleGroupSelect.innerHTML = '<option value="">-- Choose a muscle group --</option>'; 
    Object.keys(exerciseLibrary).forEach(group => {
        const option = document.createElement('option');
        option.value = option.textContent = group;
        muscleGroupSelect.appendChild(option);
    });
}

function handleMuscleGroupChange() {
    const selectedGroup = muscleGroupSelect.value;
    exerciseSelect.innerHTML = '<option value="">-- Choose an exercise --</option>';
    [strengthInputArea, cardioInputArea, exerciseSelectionArea, workoutProgressionButtons].forEach(id => id.classList.add('hidden'));
    loggedSetsDisplay.innerHTML = ''; 
    currentExerciseLog = null;

    if (!selectedGroup) return;

    workoutProgressionButtons.classList.remove('hidden');
    if (selectedGroup === "Treadmill") {
        cardioInputArea.classList.remove('hidden');
        currentExerciseLog = { muscleGroup: selectedGroup, name: exerciseLibrary[selectedGroup][0] };
    } else {
        exerciseSelectionArea.classList.remove('hidden');
        exerciseLibrary[selectedGroup].forEach(ex => {
            const option = document.createElement('option');
            option.value = option.textContent = ex;
            exerciseSelect.appendChild(option);
        });
    }
}

function handleExerciseSelectChange() {
    const selectedExercise = exerciseSelect.value;
    const selectedGroup = muscleGroupSelect.value;
    loggedSetsDisplay.innerHTML = ''; 

    if (!selectedExercise) {
        strengthInputArea.classList.add('hidden');
        currentExerciseLog = null;
        workoutProgressionButtons.classList.add('hidden');
        return;
    }
    
    strengthInputArea.classList.remove('hidden');
    workoutProgressionButtons.classList.remove('hidden');
    if(currentExerciseLogTitleSpan) currentExerciseLogTitleSpan.textContent = selectedExercise;
    currentExerciseLog = { muscleGroup: selectedGroup, name: selectedExercise, sets: [] };
    renderLoggedSets(); 
}

function renderLoggedSets() {
    if (!currentExerciseLog?.sets) return;
    loggedSetsDisplay.innerHTML = '';
    if (currentExerciseLog.sets.length === 0) {
         loggedSetsDisplay.innerHTML = '<p class="text-sm text-secondary">No sets logged yet.</p>';
         return;
    }
    currentExerciseLog.sets.forEach((set, index) => {
        const setEl = document.createElement('div');
        setEl.className = 'logged-set-item';
        setEl.innerHTML = `
            <span>Set ${index + 1}: ${set.reps} reps @ ${set.weight} kg/lb</span>
            <button class="remove-set-btn" data-index="${index}" aria-label="Remove set ${index+1}">Remove</button>
        `;
        loggedSetsDisplay.appendChild(setEl);
    });
    document.querySelectorAll('.remove-set-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            if (currentExerciseLog && currentExerciseLog.sets) {
                const target = e.target;
                currentExerciseLog.sets.splice(parseInt(target.dataset.index), 1);
                renderLoggedSets();
            }
        });
    });
}

function addSetToActiveWorkout(isBulk = false) {
    if (!currentExerciseLog || !currentExerciseLog.sets) return;
    let setsToAdd = [];
    if (isBulk) {
        const count = parseInt(document.getElementById('bulk-sets-count').value);
        const reps = parseInt(document.getElementById('bulk-reps-input').value);
        const weight = parseFloat(document.getElementById('bulk-weight-input').value);
        if (isNaN(count) || isNaN(reps) || isNaN(weight) || count <= 0) { alert('Enter valid bulk sets.'); return; }
        for (let i = 0; i < count; i++) setsToAdd.push({ reps, weight });
        document.getElementById('bulk-sets-count').value = '';
        document.getElementById('bulk-reps-input').value = '';
        document.getElementById('bulk-weight-input').value = '';
    } else {
        const reps = parseInt(document.getElementById('reps-input').value);
        const weight = parseFloat(document.getElementById('weight-input').value);
        if (isNaN(reps) || isNaN(weight)) { alert('Enter valid reps and weight.'); return; }
        setsToAdd.push({ reps, weight });
        document.getElementById('reps-input').value = '';
        document.getElementById('weight-input').value = '';
    }
    currentExerciseLog.sets.push(...setsToAdd);
    renderLoggedSets();
}

function logCardioDetails() {
    if (!currentExerciseLog || currentExerciseLog.muscleGroup !== "Treadmill") return;
    const incline = parseFloat(document.getElementById('incline-input').value);
    const speed = parseFloat(document.getElementById('speed-input').value);
    const duration = parseInt(document.getElementById('cardio-duration-input').value);
    if (isNaN(duration) || duration <= 0 || isNaN(incline) || isNaN(speed)) { alert('Enter valid cardio details.'); return; }
    currentExerciseLog.cardio = { incline, speed, duration };
    alert(`Treadmill logged: ${duration} mins, Incline ${incline}%, Speed ${speed}.`);
}

function finalizeCurrentExercise() {
    if (activeWorkout && currentExerciseLog && ((currentExerciseLog.sets && currentExerciseLog.sets.length > 0) || currentExerciseLog.cardio)) {
        activeWorkout.exercises.push({...currentExerciseLog}); 
    }
    resetActiveWorkoutUI();
    muscleGroupSelect.value = '';
    handleMuscleGroupChange(); 
}

function finishWorkout() {
    finalizeCurrentExercise(); 
    if (!activeWorkout || activeWorkout.exercises.length === 0) {
        alert("Please log at least one exercise before finishing.");
        resetActiveWorkoutUI();
        populateMuscleGroupDropdown();
        return;
    }
    activeWorkout.duration = stopStopwatch();
    workoutHistory.unshift({...activeWorkout}); 
    saveWorkoutHistory();
    activeWorkout = null;
    navigateTo('home');
}

// --- Charting ---
function getUniqueStrengthExercises() {
    return Array.from(new Set(workoutHistory.flatMap(w => w.exercises.filter(e => e.sets && e.sets.length > 0).map(e => e.name)))).sort();
}

function populateProgressExerciseSelect() {
    const uniqueExercises = getUniqueStrengthExercises();
    progressExerciseSelect.innerHTML = '';
    if (progressChartInstance) progressChartInstance.destroy();
    progressChartInstance = null;
    
    const canvas = document.getElementById('progress-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (uniqueExercises.length === 0) {
        progressExerciseSelect.innerHTML = '<option value="">-- No strength exercises recorded --</option>';
        return;
    }

    uniqueExercises.forEach(exName => {
        const option = document.createElement('option');
        option.value = option.textContent = exName;
        progressExerciseSelect.appendChild(option);
    });

    if (uniqueExercises.length > 0) {
        progressExerciseSelect.value = uniqueExercises[0]; 
        updateProgressChart();
    }
}

function getChartThemeOptions() {
    const style = getComputedStyle(document.body);
    const textColor = style.getPropertyValue('--c-text-secondary');
    const gridColor = style.getPropertyValue('--c-grid');
    return {
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Weight (kg/lb)', color: textColor }, ticks: { color: textColor }, grid: { color: gridColor, borderColor: gridColor } },
            x: { title: { display: true, text: 'Date', color: textColor }, ticks: { color: textColor }, grid: { color: gridColor, borderColor: gridColor } }
        },
        plugins: { legend: { labels: { color: textColor } } }
    };
}

function updateProgressChart() {
    const selectedExercise = progressExerciseSelect.value;
    const canvas = document.getElementById('progress-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (progressChartInstance) progressChartInstance.destroy();

    if (!selectedExercise) { return; }

    const dataPoints = workoutHistory
        .map(workout => {
            const exerciseInstances = workout.exercises.filter(ex => ex.name === selectedExercise && ex.sets && ex.sets.length > 0);
            if (exerciseInstances.length === 0) return null;
            
            const maxWeight = Math.max(0, ...exerciseInstances.flatMap(ex => ex.sets.map(set => set.weight)));
            
            return maxWeight > 0 ? { date: workout.date, maxWeight } : null;
        })
        .filter(dp => dp !== null)
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const style = getComputedStyle(document.body);
    progressChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dataPoints.map(dp => new Date(dp.date).toLocaleDateString()),
            datasets: [{
                label: `Max Weight for ${selectedExercise}`,
                data: dataPoints.map(dp => dp.maxWeight),
                borderColor: style.getPropertyValue('--c-accent'),
                backgroundColor: style.getPropertyValue('--c-accent-transparent'),
                tension: 0.1,
                fill: true,
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, ...getChartThemeOptions() }
    });
}

// --- Theme Management ---
function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    sunIcon.classList.toggle('hidden', theme === 'dark');
    moonIcon.classList.toggle('hidden', theme !== 'dark');
    localStorage.setItem('theme', theme);
    if (!views.progress.classList.contains('hidden')) updateProgressChart();
}

function toggleTheme() {
    const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(newTheme);
}

// --- Export ---
function downloadCSV() {
    if (workoutHistory.length === 0) { alert("No data to export."); return; }
    let csvContent = "Date,Duration,Muscle Group,Exercise,Set,Reps,Weight,Incline,Speed,Cardio Duration\n";
    const rows = workoutHistory.flatMap(w => w.exercises.map(ex => {
        if (ex.sets?.length) return ex.sets.map((s,i) => [w.date,w.duration,ex.muscleGroup,ex.name,i+1,s.reps,s.weight,"","",""].join(','));
        if (ex.cardio) return [[w.date,w.duration,ex.muscleGroup,ex.name,"","", "",ex.cardio.incline,ex.cardio.speed,ex.cardio.duration].join(',')];
        return [];
    }).flat());
    csvContent += rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "workout_history.csv";
    link.click();
    URL.revokeObjectURL(link.href);
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Nav
    navLinks.home.addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
    navLinks.history.addEventListener('click', (e) => { e.preventDefault(); navigateTo('history'); });
    navLinks.progress.addEventListener('click', (e) => { e.preventDefault(); navigateTo('progress'); });
    navLinks.export.addEventListener('click', (e) => { e.preventDefault(); navigateTo('export'); });
    // Workout
    startWorkoutBtn.addEventListener('click', initializeActiveWorkoutView);
    muscleGroupSelect.addEventListener('change', handleMuscleGroupChange);
    exerciseSelect.addEventListener('change', handleExerciseSelectChange);
    addSetBtn.addEventListener('click', () => addSetToActiveWorkout(false));
    addBulkSetsBtn.addEventListener('click', () => addSetToActiveWorkout(true));
    logCardioBtn.addEventListener('click', logCardioDetails);
    nextExerciseBtn.addEventListener('click', finalizeCurrentExercise);
    finishWorkoutBtn.addEventListener('click', finishWorkout);
    // History & Progress
    clearHistoryBtn.addEventListener('click', clearAllWorkoutHistory);
    progressExerciseSelect.addEventListener('change', updateProgressChart);
    // Export
    exportCsvBtn.addEventListener('click', downloadCSV);
    googleAuthorizeBtn.addEventListener('click', handleGoogleAuth);
    googleSignoutBtn.addEventListener('click', handleGoogleSignout);
    syncGoogleSheetsBtn.addEventListener('click', syncToGoogleSheets);
    // Theme
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Initial Load
    loadWorkoutHistory();
    navigateTo('home'); 
    updateGAuthButtonStatus();
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
});
