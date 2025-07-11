

const exerciseLibrary = {
    "Chest": ["Incline Dumbbell Press", "Machine Chest Fly", "Incline Machine Press", "Flat Bench Press", "Decline Bench Press", "Dumbbell Flyes", "Push-ups"],
    "Shoulders": ["Dumbbell Shoulder Press", "Lateral Raise", "Front Raise", "Reverse Pec Deck", "Arnold Press", "Upright Row"],
    "Biceps": ["EZ Bar Curls", "Hammer Curls", "Preacher Curl", "Concentration Curl", "Dumbbell Bicep Curl", "Cable Curl"],
    "Triceps": ["Triceps Extension", "Dips", "Triceps Rope Pushdown", "Close-Grip Bench Press", "Skullcrushers", "Overhead Dumbbell Extension"],
    "Back": ["Lat Pull Down", "Seated Cable Row", "Face Pulls", "Barbell Row", "T-Bar Row", "Pull-ups", "Deadlifts (conventional)"],
    "Legs": ["Leg Press", "Squat", "Leg Extension", "Calf Raise", "Hamstring Curl", "Hip Thrusts", "Romanian Deadlifts", "Lunges"],
    "Treadmill": ["Treadmill Cardio"] // Special key for cardio
};

const HISTORY_KEY = 'gymTrackerHistory';
const ACTIVE_WORKOUT_KEY = 'gymTrackerActiveWorkout';

let workoutHistory = [];
let activeWorkout = null;
let timerInterval = null;
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

const exerciseSelectionArea = document.getElementById('exercise-selection-area');
const loggedWorkoutSummary = document.getElementById('logged-workout-summary');
const activeWorkoutSummaryCard = document.getElementById('active-workout-summary-card');

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

// --- Google API Global Callbacks & Initialization ---
// These functions must be on the window object to be called by the Google API scripts.

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        });
        gapiInited = true;
    } catch (e) {
        console.error("Error initializing GAPI client:", e);
        if(googleAuthStatusEl) googleAuthStatusEl.textContent = 'Error initializing Google API Client. See console.';
    }
    updateGAuthButtonStatus();
}

window.gapiLoaded = () => {
    gapi.load('client', initializeGapiClient); 
};

window.tokenResponseCallback = (resp) => {
    if (resp.error) {
        console.error('Google token error:', resp.error);
        if(googleAuthStatusEl) googleAuthStatusEl.textContent = `Authorization failed: ${resp.error}`;
        alert(`Authorization failed: ${resp.error}`);
    } else {
        console.log('Access token received.');
        if(googleAuthStatusEl) googleAuthStatusEl.textContent = 'Authorization successful!';
    }
    updateGAuthButtonStatus();
}

window.gisLoaded = () => {
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: GOOGLE_API_SCOPES,
            callback: window.tokenResponseCallback, 
        });
        gisInited = true;
    } catch (e) {
        console.error("Error initializing GIS client:", e);
        if(googleAuthStatusEl) googleAuthStatusEl.textContent = 'Error initializing Google Sign-In. See console.';
    }
    updateGAuthButtonStatus();
};

function updateGAuthButtonStatus() {
    if (!gapiInited || !gisInited) {
        if(googleAuthStatusEl) googleAuthStatusEl.textContent = 'Initializing Google services... Please wait.';
        return;
    }
    
    const token = gapi.client.getToken(); 
    if (token && token.access_token) { 
        if(googleAuthStatusEl) googleAuthStatusEl.textContent = 'Authorized with Google.';
        if(googleAuthorizeBtn) googleAuthorizeBtn.classList.add('hidden');
        if(googleSignoutBtn) googleSignoutBtn.classList.remove('hidden');
        if(syncGoogleSheetsBtn) syncGoogleSheetsBtn.disabled = false;
    } else {
        if(googleAuthStatusEl) googleAuthStatusEl.textContent = 'Not authorized. Click below to authorize.';
        if(googleAuthorizeBtn) googleAuthorizeBtn.classList.remove('hidden');
        if(googleSignoutBtn) googleSignoutBtn.classList.add('hidden');
        if(syncGoogleSheetsBtn) syncGoogleSheetsBtn.disabled = true;
    }
}

function handleGoogleAuth() {
    if (tokenClient) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        if(googleAuthStatusEl) googleAuthStatusEl.textContent = 'Google services not fully loaded yet. Please wait and try again.';
    }
}

function handleGoogleSignout() {
    const token = gapi.client.getToken();
    if (token !== null && token.access_token) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(''); 
            updateGAuthButtonStatus();
            if(googleSyncStatusEl) googleSyncStatusEl.textContent = 'Signed out.';
        });
    }
}

async function syncToGoogleSheets() {
    if (workoutHistory.length === 0) {
        googleSyncStatusEl.textContent = "No workout data to sync.";
        googleSyncStatusEl.style.color = 'orange';
        return;
    }
     if (!gapi.client.getToken() || !gapi.client.getToken().access_token) {
        googleSyncStatusEl.textContent = "Please authorize with Google first.";
        googleSyncStatusEl.style.color = 'red';
        handleGoogleAuth(); 
        return;
    }

    googleSyncStatusEl.textContent = "Syncing data to Google Sheets...";
    googleSyncStatusEl.style.color = 'var(--color-primary)';
    syncGoogleSheetsBtn.disabled = true;

    const valuesToAppend = [];
    workoutHistory.forEach(workout => {
        workout.exercises.forEach(ex => {
            if (ex.sets && ex.sets.length > 0) { 
                ex.sets.forEach((set, index) => {
                    valuesToAppend.push([
                        workout.date, workout.duration, ex.muscleGroup, ex.name,
                        index + 1, set.reps, set.weight, "", "", ""  
                    ]);
                });
            } else if (ex.cardio) { 
                valuesToAppend.push([
                    workout.date, workout.duration, ex.muscleGroup, ex.name,
                    "", "", "", ex.cardio.incline, ex.cardio.speed, ex.cardio.duration
                ]);
            }
        });
    });

    try {
        const response = await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SPREADSHEET_ID,
            range: GOOGLE_SHEET_RANGE,
            valueInputOption: 'USER_ENTERED', 
            insertDataOption: 'INSERT_ROWS', 
            resource: { values: valuesToAppend },
        });
        googleSyncStatusEl.textContent = `Successfully synced ${valuesToAppend.length} rows.`;
        googleSyncStatusEl.style.color = 'var(--color-success)';
    } catch (err) {
        googleSyncStatusEl.textContent = `Error syncing: ${err.result?.error?.message || err.message}.`;
        googleSyncStatusEl.style.color = 'var(--color-danger)';
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
    if (navLinks[viewId]) {
         navLinks[viewId].classList.add('nav-link-active');
    } else if (viewId === 'activeWorkout') {
        navLinks.home.classList.add('nav-link-active');
    }

    if (viewId === 'home') renderHomeView();
    if (viewId === 'history') renderHistoryView();
    if (viewId === 'progress') renderProgressView();
    if (viewId === 'export') {
        updateGAuthButtonStatus(); 
        if (googleSyncStatusEl) googleSyncStatusEl.textContent = ''; 
    }
    
    updateUiForActiveState();
}

// --- Data Persistence ---
function loadState() {
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    if (storedHistory) workoutHistory = JSON.parse(storedHistory);

    const storedActiveWorkout = localStorage.getItem(ACTIVE_WORKOUT_KEY);
    if (storedActiveWorkout) activeWorkout = JSON.parse(storedActiveWorkout);
}

function saveState() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(workoutHistory));
    if (activeWorkout) {
        localStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(activeWorkout));
    } else {
        localStorage.removeItem(ACTIVE_WORKOUT_KEY);
    }
}

function clearAllWorkoutHistory() {
    if (confirm("Are you sure you want to delete all workout history? This action cannot be undone.")) {
        workoutHistory = [];
        activeWorkout = null;
        saveState();
        renderHistoryView();
        renderHomeView();    
        renderProgressView(); 
        updateUiForActiveState();
        alert("All workout history has been cleared.");
    }
}

function updateUiForActiveState() {
    if (activeWorkout) {
        startWorkoutBtn.textContent = 'Resume Workout';
        navLinks.home.textContent = 'Active Workout';
    } else {
        startWorkoutBtn.textContent = "+ Start Today's Workout";
        navLinks.home.textContent = 'Home';
        if(timerInterval) clearInterval(timerInterval);
        timerInterval = null;
    }
}

// --- Home View ---
function renderHomeView() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const workoutsLastWeek = workoutHistory.filter(workout => new Date(workout.date) >= oneWeekAgo);
    workoutsThisWeekCount.textContent = workoutsLastWeek.length.toString();
    updateUiForActiveState();
}

// --- Stopwatch ---
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function startStopwatch() {
    if (!activeWorkout || !activeWorkout.startTime) return;
    if (timerInterval) clearInterval(timerInterval);
    
    const updateDisplay = () => {
        const elapsedTime = Date.now() - activeWorkout.startTime;
        stopwatchDisplay.textContent = formatTime(elapsedTime);
    };
    
    timerInterval = setInterval(updateDisplay, 1000);
    updateDisplay();
}

function stopStopwatch() {
    clearInterval(timerInterval);
    timerInterval = null;
    if (!activeWorkout || !activeWorkout.startTime) return formatTime(0);
    const elapsedTime = Date.now() - activeWorkout.startTime;
    return formatTime(elapsedTime);
}

// --- Active Workout ---
function resetActiveWorkoutInputs() {
    muscleGroupSelect.value = '';
    exerciseSelect.innerHTML = '<option value="">-- Choose an exercise --</option>';
    exerciseSelectionArea.classList.add('hidden');
    cardioInputArea.classList.add('hidden');
    strengthInputArea.classList.add('hidden');
    workoutProgressionButtons.classList.add('hidden');
    
    document.getElementById('incline-input').value = '';
    document.getElementById('speed-input').value = '';
    document.getElementById('cardio-duration-input').value = '';
    
    document.getElementById('reps-input').value = '';
    document.getElementById('weight-input').value = '';
    document.getElementById('bulk-sets-count').value = '';
    document.getElementById('bulk-reps-input').value = '';
    document.getElementById('bulk-weight-input').value = '';
    loggedSetsDisplay.innerHTML = '';
    currentExerciseLogTitleSpan.textContent = '';
    currentExerciseLog = null;
}

function renderActiveWorkoutState() {
    if (!activeWorkout) return;
    
    loggedWorkoutSummary.innerHTML = '';
    if (activeWorkout.exercises.length > 0) {
        activeWorkoutSummaryCard.classList.remove('hidden');
        activeWorkout.exercises.forEach(ex => {
             let summary = `<div><strong>${ex.name}</strong> (${ex.muscleGroup})`;
            if (ex.sets && ex.sets.length > 0) {
                summary += `: ${ex.sets.length} set(s)`;
            } else if (ex.cardio) {
                summary += `: ${ex.cardio.duration} min`;
            }
             summary += `</div>`;
            loggedWorkoutSummary.innerHTML += summary;
        });
    } else {
         activeWorkoutSummaryCard.classList.add('hidden');
    }
}

function resumeActiveWorkout() {
    resetActiveWorkoutInputs();
    populateMuscleGroupDropdown();
    renderActiveWorkoutState();
    startStopwatch();
    navigateTo('activeWorkout');
}

function initializeActiveWorkoutView() {
     if (activeWorkout && !confirm('You have an unfinished workout. Discard it and start new?')) {
        return; 
    }
    
    activeWorkout = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        startTime: Date.now(),
        duration: null,
        exercises: []
    };
    saveState();
    
    resetActiveWorkoutInputs();
    populateMuscleGroupDropdown();
    renderActiveWorkoutState();
    startStopwatch();
    navigateTo('activeWorkout');
}

function populateMuscleGroupDropdown() {
    muscleGroupSelect.innerHTML = '<option value="">-- Choose a muscle group --</option>'; 
    Object.keys(exerciseLibrary).forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        muscleGroupSelect.appendChild(option);
    });
}

function handleMuscleGroupChange() {
    const selectedGroup = muscleGroupSelect.value;
    exerciseSelect.innerHTML = '<option value="">-- Choose an exercise --</option>';
    strengthInputArea.classList.add('hidden');
    cardioInputArea.classList.add('hidden');
    exerciseSelectionArea.classList.add('hidden');
    workoutProgressionButtons.classList.add('hidden'); 
    loggedSetsDisplay.innerHTML = ''; 
    currentExerciseLog = null;

    if (!selectedGroup) return;

    if (selectedGroup === "Treadmill") {
        cardioInputArea.classList.remove('hidden');
        currentExerciseLog = {
            muscleGroup: selectedGroup,
            name: exerciseLibrary[selectedGroup][0], 
            cardio: null
        };
        workoutProgressionButtons.classList.remove('hidden');
    } else {
        exerciseSelectionArea.classList.remove('hidden');
        const exercises = exerciseLibrary[selectedGroup];
        exercises.forEach(ex => {
            const option = document.createElement('option');
            option.value = ex;
            option.textContent = ex;
            exerciseSelect.appendChild(option);
        });
    }
}

function handleExerciseSelectChange() {
    const selectedExercise = exerciseSelect.value;
    const selectedGroup = muscleGroupSelect.value;
    loggedSetsDisplay.innerHTML = ''; 

    if (!selectedExercise || !selectedGroup || selectedGroup === "Treadmill") {
        strengthInputArea.classList.add('hidden');
        currentExerciseLog = null;
        workoutProgressionButtons.classList.add('hidden');
        return;
    }
    
    strengthInputArea.classList.remove('hidden');
    currentExerciseLogTitleSpan.textContent = selectedExercise;
    currentExerciseLog = { muscleGroup: selectedGroup, name: selectedExercise, sets: [] };
    workoutProgressionButtons.classList.remove('hidden');
    renderLoggedSets(); 
}

function renderLoggedSets() {
    if (!currentExerciseLog || !currentExerciseLog.sets) return;
    loggedSetsDisplay.innerHTML = '';
    if (currentExerciseLog.sets.length === 0) {
         loggedSetsDisplay.innerHTML = '<p class="placeholder-text">No sets logged for this exercise yet.</p>';
         return;
    }

    currentExerciseLog.sets.forEach((set, index) => {
        const setEl = document.createElement('div');
        setEl.className = 'set-item';
        setEl.innerHTML = `
            <span>Set ${index + 1}: ${set.reps} reps @ ${set.weight} kg/lb</span>
            <button class="remove-set-btn" data-index="${index}" aria-label="Remove set ${index+1}">Remove</button>
        `;
        loggedSetsDisplay.appendChild(setEl);
    });
    
    document.querySelectorAll('.remove-set-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const indexToRemove = parseInt(e.target.dataset.index);
            currentExerciseLog.sets.splice(indexToRemove, 1);
            renderLoggedSets();
        });
    });
}

function addSetToActiveWorkout(isBulk = false) {
    if (!currentExerciseLog || currentExerciseLog.muscleGroup === "Treadmill") return;

    const setsToAdd = [];
    if (isBulk) {
        const setCount = parseInt(document.getElementById('bulk-sets-count').value);
        const reps = parseInt(document.getElementById('bulk-reps-input').value);
        const weight = parseFloat(document.getElementById('bulk-weight-input').value);
        if (isNaN(setCount) || isNaN(reps) || isNaN(weight) || setCount <= 0 || reps <=0 || weight < 0) {
            alert('Please enter valid numbers for bulk sets, reps, and weight.');
            return;
        }
        for (let i = 0; i < setCount; i++) setsToAdd.push({ reps, weight });
        document.getElementById('bulk-sets-count').value = '';
        document.getElementById('bulk-reps-input').value = '';
        document.getElementById('bulk-weight-input').value = '';
    } else {
        const reps = parseInt(document.getElementById('reps-input').value);
        const weight = parseFloat(document.getElementById('weight-input').value);
         if (isNaN(reps) || isNaN(weight) || reps <= 0 || weight < 0) {
            alert('Please enter valid numbers for reps and weight.');
            return;
        }
        setsToAdd.push({ reps, weight });
        document.getElementById('reps-input').value = '';
        document.getElementById('weight-input').value = '';
    }
    
    currentExerciseLog.sets.push(...setsToAdd);
    renderLoggedSets();
}

function logCardioDetails() {
    if (!currentExerciseLog || currentExerciseLog.muscleGroup !== "Treadmill") return;

    const incline = parseFloat(document.getElementById('incline-input').value) || 0;
    const speed = parseFloat(document.getElementById('speed-input').value);
    const duration = parseInt(document.getElementById('cardio-duration-input').value);

    if (isNaN(duration) || duration <= 0 || isNaN(speed) || speed <=0) {
        alert('Please enter valid speed (>0) and duration (>0).');
        return;
    }
    currentExerciseLog.cardio = { incline, speed, duration };
    alert(`${currentExerciseLog.name} logged: ${duration} mins, Incline ${incline}%, Speed ${speed}.`);
}

function finalizeCurrentExercise() {
     if (currentExerciseLog && ((currentExerciseLog.sets && currentExerciseLog.sets.length > 0) || currentExerciseLog.cardio)) {
        activeWorkout.exercises.push({...currentExerciseLog}); 
        saveState();
        renderActiveWorkoutState();
    }
    resetActiveWorkoutInputs();
    populateMuscleGroupDropdown();
}

function finishWorkout() {
    finalizeCurrentExercise(); 
    
    if (!activeWorkout || activeWorkout.exercises.length === 0) {
        alert("Please log at least one exercise before finishing.");
        return;
    }

    activeWorkout.duration = stopStopwatch();
    workoutHistory.unshift({...activeWorkout}); 
    activeWorkout = null;
    saveState();
    navigateTo('home');
}

// --- History View ---
function renderHistoryView() {
    historyList.innerHTML = ''; 
    if (workoutHistory.length === 0) {
        historyList.innerHTML = '<p class="placeholder-text">No workouts recorded yet.</p>';
        return;
    }

    workoutHistory.forEach(workout => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        
        let exercisesSummary = workout.exercises.map(ex => {
            let summary = `<strong>${ex.name}</strong> (${ex.muscleGroup})`;
            if (ex.sets && ex.sets.length > 0) {
                summary += `: ${ex.sets.length} set(s)`;
            } else if (ex.cardio) {
                summary += `: ${ex.cardio.duration} min`;
            }
            return summary;
        }).join('<br>');

        cardEl.innerHTML = `
            <div class="workout-card-header">
                <h3>${new Date(workout.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                <span>${workout.duration}</span>
            </div>
            <div class="exercises-summary">${exercisesSummary || 'No exercises logged.'}</div>
        `;
        historyList.appendChild(cardEl);
    });
}

// --- Progress View ---
function getUniqueStrengthExercises() {
    const exercises = new Set();
    workoutHistory.forEach(w => w.exercises.forEach(ex => {
        if (ex.sets && ex.sets.length > 0) exercises.add(ex.name);
    }));
    return Array.from(exercises).sort();
}

function populateProgressExerciseSelect() {
    const uniqueExercises = getUniqueStrengthExercises();
    progressExerciseSelect.innerHTML = '';
    const chartCanvas = document.getElementById('progress-chart');
    if (!chartCanvas) return;
    const chartCtx = chartCanvas.getContext('2d');
    if (progressChartInstance) progressChartInstance.destroy();
    progressChartInstance = null;
    chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

    if (uniqueExercises.length === 0) {
        progressExerciseSelect.innerHTML = '<option value="">-- No strength exercises recorded --</option>';
        chartCtx.textAlign = 'center';
        chartCtx.font = "16px 'Inter', sans-serif";
        chartCtx.fillStyle = 'var(--color-text-muted)'; 
        chartCtx.fillText('No strength data to display.', chartCanvas.width / 2, chartCanvas.height / 2);
        return;
    }

    uniqueExercises.forEach(exName => {
        const option = document.createElement('option');
        option.value = exName;
        option.textContent = exName;
        progressExerciseSelect.appendChild(option);
    });

    if (uniqueExercises.length > 0) {
         progressExerciseSelect.value = uniqueExercises[0]; 
         updateProgressChart();
    }
}

function updateProgressChart() {
    const selectedExercise = progressExerciseSelect.value;
    const chartCanvas = document.getElementById('progress-chart');
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext('2d');

    if (progressChartInstance) progressChartInstance.destroy();
    if (!selectedExercise) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.textAlign = 'center';
        ctx.font = "16px 'Inter', sans-serif";
        ctx.fillStyle = 'var(--color-text-muted)'; 
        ctx.fillText('Select an exercise to view progress.', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const dataPoints = [];
    workoutHistory.forEach(workout => {
        const maxWeight = workout.exercises
            .filter(ex => ex.name === selectedExercise && ex.sets)
            .flatMap(ex => ex.sets)
            .reduce((max, set) => Math.max(max, set.weight), 0);
        if (maxWeight > 0) dataPoints.push({ date: workout.date, maxWeight });
    });
    
    dataPoints.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (dataPoints.length === 0) { /* ... handle no data ... */ return; }

    progressChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dataPoints.map(dp => new Date(dp.date).toLocaleDateString()),
            datasets: [{
                label: `Max Weight for ${selectedExercise}`,
                data: dataPoints.map(dp => dp.maxWeight),
                borderColor: 'var(--color-primary)', 
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                tension: 0.1,
                fill: true,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Weight (kg/lb)'} },
                x: { title: { display: true, text: 'Date'} }
            }
        }
    });
}

function renderProgressView() {
    populateProgressExerciseSelect(); 
}

// --- Export View ---
function generateCSV() {
    if (workoutHistory.length === 0) {
        alert("No workout data to export.");
        return null;
    }
    let csvContent = "Date,Duration,Muscle Group,Exercise,Set Number,Reps,Weight,Incline,Speed,Cardio Duration (min)\n";
    workoutHistory.forEach(workout => {
        workout.exercises.forEach(ex => {
            const rowBase = [workout.date, workout.duration, ex.muscleGroup, ex.name];
            if (ex.sets && ex.sets.length > 0) { 
                ex.sets.forEach((set, index) => {
                    const row = [...rowBase, index + 1, set.reps, set.weight, "", "", ""];
                    csvContent += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";
                });
            } else if (ex.cardio) { 
                const row = [...rowBase, "", "", "", ex.cardio.incline, ex.cardio.speed, ex.cardio.duration];
                csvContent += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";
            }
        });
    });
    return csvContent;
}

function downloadCSV(csvString) {
    if (!csvString) return;
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "workout_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    navLinks.home.addEventListener('click', (e) => { 
        e.preventDefault(); 
        navigateTo(activeWorkout ? 'activeWorkout' : 'home');
    });
    navLinks.history.addEventListener('click', (e) => { e.preventDefault(); navigateTo('history'); });
    navLinks.progress.addEventListener('click', (e) => { e.preventDefault(); navigateTo('progress'); });
    navLinks.export.addEventListener('click', (e) => { e.preventDefault(); navigateTo('export'); });

    // Workout Flow
    startWorkoutBtn.addEventListener('click', () => activeWorkout ? resumeActiveWorkout() : initializeActiveWorkoutView());
    muscleGroupSelect.addEventListener('change', handleMuscleGroupChange);
    exerciseSelect.addEventListener('change', handleExerciseSelectChange);
    nextExerciseBtn.addEventListener('click', finalizeCurrentExercise);
    finishWorkoutBtn.addEventListener('click', finishWorkout);

    // Logging
    addSetBtn.addEventListener('click', () => addSetToActiveWorkout(false));
    addBulkSetsBtn.addEventListener('click', () => addSetToActiveWorkout(true));
    logCardioBtn.addEventListener('click', logCardioDetails);

    // Other Actions
    clearHistoryBtn.addEventListener('click', clearAllWorkoutHistory);
    progressExerciseSelect.addEventListener('change', updateProgressChart);
    exportCsvBtn.addEventListener('click', () => downloadCSV(generateCSV()));

    // Google Sync
    googleAuthorizeBtn.addEventListener('click', handleGoogleAuth);
    googleSignoutBtn.addEventListener('click', handleGoogleSignout);
    syncGoogleSheetsBtn.addEventListener('click', syncToGoogleSheets);

    // --- Initialization ---
    loadState();
    navigateTo('home'); 
    updateGAuthButtonStatus(); 
});
