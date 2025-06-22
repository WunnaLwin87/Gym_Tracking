    // --- START OF ORIGINAL SCRIPT ---
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
        const workoutProgressionButtons = document.getElementById('workout-progression-buttons');
        const nextExerciseBtn = document.getElementById('next-exercise-btn');
        const finishWorkoutBtn = document.getElementById('finish-workout-btn');
        const addSetBtn = document.getElementById('add-set-btn');
        const addBulkSetsBtn = document.getElementById('add-bulk-sets-btn');
        const logCardioBtn = document.getElementById('log-cardio-btn');
        const historyList = document.getElementById('history-list');
        const progressExerciseSelect = document.getElementById('progress-exercise-select');
        const exportCsvBtn = document.getElementById('export-csv-btn');
        const workoutsThisWeekCount = document.getElementById('workouts-this-week-count');
        const currentExerciseLogTitleSpan = document.querySelector('#current-exercise-log-title span');
        const loggedSetsDisplay = document.getElementById('logged-sets-display');
        
        const muscleGroupSelectionArea = document.getElementById('muscle-group-selection-area');
        const exerciseSelectionArea = document.getElementById('exercise-selection-area');

        // --- Google Sheets Sync Elements ---
        const googleAuthorizeBtn = document.getElementById('google-authorize-btn');
        const googleSignoutBtn = document.getElementById('google-signout-btn');
        const syncGoogleSheetsBtn = document.getElementById('sync-google-sheets-btn');
        const googleAuthStatusEl = document.getElementById('google-auth-status');
        const googleSyncStatusEl = document.getElementById('google-sync-status');

        // --- Google API Configuration ---
        // IMPORTANT: Replace with your actual Client ID and Spreadsheet ID
        const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Replace!
        const GOOGLE_SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace!
        const GOOGLE_SHEET_RANGE = 'Sheet1'; // Or your specific sheet name e.g. 'RawData!A1' for appending
        const GOOGLE_API_SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

        let tokenClient;
        let gapiInited = false;
        let gisInited = false;

        window.gapiLoaded = () => {
            gapi.load('client', initializeGapiClient);
        };

        async function initializeGapiClient() {
            try {
                await gapi.client.init({
                    // apiKey: 'YOUR_API_KEY', // Not strictly needed for OAuth flow with discoveryDocs
                    discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
                });
                gapiInited = true;
                console.log("GAPI client initialized.");
                updateGAuthButtonStatus();
            } catch (e) {
                console.error("Error initializing GAPI client:", e);
                googleAuthStatusEl.textContent = 'Error initializing Google API Client. See console.';
            }
        }

        window.gisLoaded = () => {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: GOOGLE_API_SCOPES,
                callback: tokenResponseCallback, // Invoked after user grants or denies consent
            });
            gisInited = true;
            console.log("GIS client initialized.");
            updateGAuthButtonStatus();
        };

        function updateGAuthButtonStatus() {
            if (gapiInited && gisInited) {
                const token = gapi.client.getToken();
                if (token) {
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
                 googleAuthStatusEl.textContent = 'Initializing Google services...';
            }
        }
        
        function handleGoogleAuth() {
            if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID' || GOOGLE_SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID') {
                alert("Please replace 'YOUR_GOOGLE_CLIENT_ID' and 'YOUR_SPREADSHEET_ID' in the script with your actual IDs.");
                googleAuthStatusEl.textContent = 'Configuration needed in script.';
                return;
            }
            if (gapiInited && gisInited) {
                tokenClient.requestAccessToken({prompt: 'consent'});
            } else {
                googleAuthStatusEl.textContent = 'Google services not fully loaded yet.';
            }
        }

        function tokenResponseCallback(resp) {
            if (resp.error) {
                console.error('Google token error:', resp.error);
                googleAuthStatusEl.textContent = `Authorization failed: ${resp.error}`;
                alert(`Authorization failed: ${resp.error}`);
            } else {
                console.log('Access token received.');
                // gapi.client.setToken further usage. Implicitly set by GIS.
                googleAuthStatusEl.textContent = 'Authorization successful!';
            }
            updateGAuthButtonStatus();
        }

        function handleGoogleSignout() {
            const token = gapi.client.getToken();
            if (token !== null) {
                google.accounts.oauth2.revoke(token.access_token, () => {
                    console.log('Access token revoked.');
                    gapi.client.setToken(''); // Clear token in gapi client
                    updateGAuthButtonStatus();
                    googleSyncStatusEl.textContent = 'Signed out.';
                });
            }
        }

        async function syncToGoogleSheets() {
            if (workoutHistory.length === 0) {
                googleSyncStatusEl.textContent = "No workout data to sync.";
                googleSyncStatusEl.className = 'text-sm mt-3 text-orange-600';
                return;
            }
             if (!gapi.client.getToken()) {
                googleSyncStatusEl.textContent = "Please authorize with Google first.";
                googleSyncStatusEl.className = 'text-sm mt-3 text-red-600';
                handleGoogleAuth(); // Prompt for auth
                return;
            }

            googleSyncStatusEl.textContent = "Syncing data to Google Sheets...";
            googleSyncStatusEl.className = 'text-sm mt-3 text-sky-600';
            syncGoogleSheetsBtn.disabled = true;

            const valuesToAppend = [];
            // Header: Date,Duration,Muscle Group,Exercise,Set Number,Reps,Weight,Incline,Speed,Cardio Duration (min)
            workoutHistory.forEach(workout => {
                workout.exercises.forEach(ex => {
                    if (ex.sets && ex.sets.length > 0) { // Strength exercise
                        ex.sets.forEach((set, index) => {
                            valuesToAppend.push([
                                workout.date,
                                workout.duration,
                                ex.muscleGroup,
                                ex.name,
                                index + 1, // Set Number
                                set.reps,
                                set.weight,
                                "", // Incline
                                "", // Speed
                                ""  // Cardio Duration
                            ]);
                        });
                    } else if (ex.cardio) { // Cardio exercise
                        valuesToAppend.push([
                            workout.date,
                            workout.duration,
                            ex.muscleGroup,
                            ex.name,
                            "", // Set Number
                            "", // Reps
                            "", // Weight
                            ex.cardio.incline,
                            ex.cardio.speed,
                            ex.cardio.duration
                        ]);
                    }
                });
            });

            try {
                const response = await gapi.client.sheets.spreadsheets.values.append({
                    spreadsheetId: GOOGLE_SPREADSHEET_ID,
                    range: GOOGLE_SHEET_RANGE,
                    valueInputOption: 'USER_ENTERED', // Interprets dates, numbers etc.
                    insertDataOption: 'INSERT_ROWS', // Appends as new rows
                    resource: {
                        values: valuesToAppend,
                    },
                });
                console.log('Google Sheets API response:', response);
                googleSyncStatusEl.textContent = `Successfully synced ${valuesToAppend.length} rows to Google Sheets.`;
                googleSyncStatusEl.className = 'text-sm mt-3 text-green-600';

                // Optional: Clear local history after successful sync, or mark as synced
                // For now, we'll just report success.
                // workoutHistory = []; // Example: if you want to clear after sync
                // saveWorkoutHistory();
                // renderHomeView(); 

            } catch (err) {
                console.error('Error syncing to Google Sheets:', err);
                googleSyncStatusEl.textContent = `Error syncing: ${err.result?.error?.message || err.message}. See console.`;
                googleSyncStatusEl.className = 'text-sm mt-3 text-red-600';
            } finally {
                syncGoogleSheetsBtn.disabled = false;
                updateGAuthButtonStatus(); // Re-check token status
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
                updateGAuthButtonStatus(); // Ensure auth status is current when navigating to export
                googleSyncStatusEl.textContent = ''; // Clear previous sync status
            }
        }

        // --- Data Persistence ---
        function loadWorkoutHistory() {
            const storedHistory = localStorage.getItem('gymTrackerHistory');
            if (storedHistory) {
                workoutHistory = JSON.parse(storedHistory);
            }
        }

        function saveWorkoutHistory() {
            localStorage.setItem('gymTrackerHistory', JSON.stringify(workoutHistory));
        }

        // --- Home View ---
        function renderHomeView() {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const workoutsLastWeek = workoutHistory.filter(workout => new Date(workout.date) >= oneWeekAgo);
            workoutsThisWeekCount.textContent = workoutsLastWeek.length;
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
            stopwatchStartTime = Date.now();
            stopwatchDisplay.textContent = formatTime(0);
            timerInterval = setInterval(() => {
                const elapsedTime = Date.now() - stopwatchStartTime;
                stopwatchDisplay.textContent = formatTime(elapsedTime);
            }, 1000);
        }

        function stopStopwatch() {
            clearInterval(timerInterval);
            timerInterval = null;
            const elapsedTime = Date.now() - stopwatchStartTime;
            return formatTime(elapsedTime);
        }
        
        // --- Active Workout ---
        function resetActiveWorkoutUI() {
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
        }

        function initializeActiveWorkoutView() {
            activeWorkout = {
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                startTime: Date.now(),
                duration: null,
                exercises: []
            };
            currentExerciseLog = null;
            
            resetActiveWorkoutUI();
            populateMuscleGroupDropdown();
            startStopwatch();
            navigateTo('activeWorkout');
        }
        
        function populateMuscleGroupDropdown() {
            muscleGroupSelect.innerHTML = '<option value="">-- Choose a muscle group --</option>'; // Reset
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
                return;
            }
            
            strengthInputArea.classList.remove('hidden');
            currentExerciseLogTitleSpan.textContent = selectedExercise;
            currentExerciseLog = {
                muscleGroup: selectedGroup,
                name: selectedExercise,
                sets: []
            };
            workoutProgressionButtons.classList.add('hidden');
        }

        function renderLoggedSets() {
            if (!currentExerciseLog || !currentExerciseLog.sets) return;
            loggedSetsDisplay.innerHTML = '';
            if (currentExerciseLog.sets.length === 0) {
                 loggedSetsDisplay.innerHTML = '<p class="text-sm text-slate-500">No sets logged for this exercise yet.</p>';
                 return;
            }

            currentExerciseLog.sets.forEach((set, index) => {
                const setEl = document.createElement('div');
                setEl.className = 'text-sm p-2 bg-slate-100 rounded flex justify-between items-center';
                setEl.innerHTML = `
                    <span>Set ${index + 1}: ${set.reps} reps @ ${set.weight} ${set.weightUnit || 'kg/lb'}</span>
                    <button class="text-red-500 hover:text-red-700 text-xs remove-set-btn" data-index="${index}" aria-label="Remove set ${index+1}">Remove</button>
                `;
                loggedSetsDisplay.appendChild(setEl);
            });
            
            document.querySelectorAll('.remove-set-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const indexToRemove = parseInt(e.target.dataset.index);
                    currentExerciseLog.sets.splice(indexToRemove, 1);
                    renderLoggedSets();
                    if (currentExerciseLog.sets.length === 0) {
                        workoutProgressionButtons.classList.add('hidden');
                    }
                });
            });
        }

        function addSetToActiveWorkout(isBulk = false) {
            if (!currentExerciseLog || currentExerciseLog.muscleGroup === "Treadmill") return;

            let setsToAdd = [];
            if (isBulk) {
                const setCount = parseInt(document.getElementById('bulk-sets-count').value);
                const reps = parseInt(document.getElementById('bulk-reps-input').value);
                const weight = parseFloat(document.getElementById('bulk-weight-input').value);
                if (isNaN(setCount) || isNaN(reps) || isNaN(weight) || setCount <= 0 || reps <=0 || weight < 0) {
                    alert('Please enter valid numbers for bulk sets, reps, and weight.');
                    return;
                }
                for (let i = 0; i < setCount; i++) {
                    setsToAdd.push({ reps, weight });
                }
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
            if (currentExerciseLog.sets.length > 0) {
                 workoutProgressionButtons.classList.remove('hidden');
            }
        }

        function logCardioDetails() {
            if (!currentExerciseLog || currentExerciseLog.muscleGroup !== "Treadmill") return;

            const incline = parseFloat(document.getElementById('incline-input').value);
            const speed = parseFloat(document.getElementById('speed-input').value);
            const duration = parseInt(document.getElementById('cardio-duration-input').value);

            if (isNaN(incline) || isNaN(speed) || isNaN(duration) || duration <= 0) {
                alert('Please enter valid incline, speed, and duration.');
                return;
            }
            currentExerciseLog.cardio = { incline, speed, duration };
            alert(`${currentExerciseLog.name} logged: ${duration} mins, Incline ${incline}%, Speed ${speed}.`);
            workoutProgressionButtons.classList.remove('hidden');
        }

        function finalizeCurrentExercise() {
            if (currentExerciseLog && 
                ( (currentExerciseLog.sets && currentExerciseLog.sets.length > 0) || currentExerciseLog.cardio) ) {
                activeWorkout.exercises.push({...currentExerciseLog}); 
            }
            currentExerciseLog = null; 
            muscleGroupSelect.value = ''; 
            handleMuscleGroupChange(); 
            loggedSetsDisplay.innerHTML = '';
            currentExerciseLogTitleSpan.textContent = '';
        }

        nextExerciseBtn.addEventListener('click', () => {
            finalizeCurrentExercise();
            workoutProgressionButtons.classList.add('hidden'); 
        });

        finishWorkoutBtn.addEventListener('click', () => {
            finalizeCurrentExercise(); 
            
            if (activeWorkout.exercises.length === 0) {
                alert("Please log at least one exercise before finishing the workout.");
                return;
            }

            activeWorkout.duration = stopStopwatch();
            workoutHistory.unshift({...activeWorkout}); 
            saveWorkoutHistory();
            activeWorkout = null;
            navigateTo('home');
        });


        // --- History View ---
        function renderHistoryView() {
            historyList.innerHTML = ''; 
            if (workoutHistory.length === 0) {
                historyList.innerHTML = '<p class="text-slate-500">No workouts recorded yet.</p>';
                return;
            }

            workoutHistory.forEach(workout => {
                const cardEl = document.createElement('div');
                cardEl.className = 'card';
                
                let exercisesSummary = workout.exercises.map(ex => {
                    let summary = `<strong class="text-sky-600">${ex.name}</strong> (${ex.muscleGroup})`;
                    if (ex.sets && ex.sets.length > 0) {
                        summary += `: ${ex.sets.length} set(s)`;
                    } else if (ex.cardio) {
                        summary += `: ${ex.cardio.duration} min`;
                    }
                    return summary;
                }).join('<br>');

                cardEl.innerHTML = `
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="text-lg font-semibold">${new Date(workout.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                        <span class="text-sm text-slate-500">${workout.duration}</span>
                    </div>
                    <div class="text-sm text-slate-700">${exercisesSummary || 'No exercises logged.'}</div>
                `;
                historyList.appendChild(cardEl);
            });
        }

        // --- Progress View ---
        function getUniqueStrengthExercises() {
            const exercises = new Set();
            workoutHistory.forEach(workout => {
                workout.exercises.forEach(ex => {
                    if (ex.sets && ex.sets.length > 0) { 
                        exercises.add(ex.name);
                    }
                });
            });
            return Array.from(exercises).sort();
        }

        function populateProgressExerciseSelect() {
            const uniqueExercises = getUniqueStrengthExercises();
            progressExerciseSelect.innerHTML = '';
            if (uniqueExercises.length === 0) {
                progressExerciseSelect.innerHTML = '<option value="">-- No strength exercises recorded --</option>';
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
            if (!selectedExercise) {
                if(progressChartInstance) progressChartInstance.destroy();
                progressChartInstance = null; // Ensure it's cleared
                // Optionally display a message in the canvas area
                const ctx = document.getElementById('progress-chart').getContext('2d');
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.textAlign = 'center';
                ctx.fillText('Select an exercise to view progress.', ctx.canvas.width / 2, ctx.canvas.height / 2);
                return;
            }

            const dataPoints = [];
            workoutHistory.forEach(workout => {
                let maxWeightThisSession = 0;
                workout.exercises.forEach(ex => {
                    if (ex.name === selectedExercise && ex.sets) {
                        ex.sets.forEach(set => {
                            if (set.weight > maxWeightThisSession) {
                                maxWeightThisSession = set.weight;
                            }
                        });
                    }
                });
                if (maxWeightThisSession > 0) {
                    dataPoints.push({ date: workout.date, maxWeight: maxWeightThisSession });
                }
            });
            
            dataPoints.sort((a,b) => new Date(a.date) - new Date(b.date));

            const labels = dataPoints.map(dp => new Date(dp.date).toLocaleDateString());
            const data = dataPoints.map(dp => dp.maxWeight);

            const ctx = document.getElementById('progress-chart').getContext('2d');
            if (progressChartInstance) {
                progressChartInstance.destroy();
            }
            progressChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `Max Weight for ${selectedExercise}`,
                        data: data,
                        borderColor: 'rgb(14, 165, 233)', 
                        backgroundColor: 'rgba(14, 165, 233, 0.1)',
                        tension: 0.1,
                        fill: true,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Weight (kg/lb)'}
                        },
                        x: {
                            title: { display: true, text: 'Date'}
                        }
                    },
                    plugins: {
                        legend: { display: true, position: 'top' },
                        tooltip: {
                            callbacks: {
                                title: function(tooltipItems) {
                                    // Custom tooltip title if needed
                                    return `Date: ${tooltipItems[0].label}`;
                                },
                                label: function(tooltipItem) {
                                    return `Max Weight: ${tooltipItem.formattedValue} kg/lb`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        function renderProgressView() {
            populateProgressExerciseSelect();
            // updateProgressChart is called by populate if exercises exist, or clears chart if not.
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
                    if (ex.sets && ex.sets.length > 0) { 
                        ex.sets.forEach((set, index) => {
                            const row = [
                                workout.date,
                                workout.duration,
                                ex.muscleGroup,
                                ex.name,
                                index + 1, 
                                set.reps,
                                set.weight,
                                "", 
                                "", 
                                ""  
                            ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(","); // Escape quotes
                            csvContent += row + "\n";
                        });
                    } else if (ex.cardio) { 
                        const row = [
                            workout.date,
                            workout.duration,
                            ex.muscleGroup,
                            ex.name,
                            "", 
                            "", 
                            "", 
                            ex.cardio.incline,
                            ex.cardio.speed,
                            ex.cardio.duration
                        ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(","); // Escape quotes
                        csvContent += row + "\n";
                    }
                });
            });
            return csvContent;
        }

        function downloadCSV(csvString) {
            if (!csvString) return;
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            if (link.download !== undefined) { 
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", "workout_history.csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        }
        
        exportCsvBtn.addEventListener('click', () => {
            const csvData = generateCSV();
            if (csvData) {
                downloadCSV(csvData);
            }
        });

        // Event listeners for Google Sync
        googleAuthorizeBtn.addEventListener('click', handleGoogleAuth);
        googleSignoutBtn.addEventListener('click', handleGoogleSignout);
        syncGoogleSheetsBtn.addEventListener('click', syncToGoogleSheets);


        // --- Event Listeners (Original) ---
        navLinks.home.addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
        navLinks.history.addEventListener('click', (e) => { e.preventDefault(); navigateTo('history'); });
        navLinks.progress.addEventListener('click', (e) => { e.preventDefault(); navigateTo('progress'); });
        navLinks.export.addEventListener('click', (e) => { e.preventDefault(); navigateTo('export'); });

        startWorkoutBtn.addEventListener('click', initializeActiveWorkoutView);
        muscleGroupSelect.addEventListener('change', handleMuscleGroupChange);
        exerciseSelect.addEventListener('change', handleExerciseSelectChange);
        
        addSetBtn.addEventListener('click', () => addSetToActiveWorkout(false));
        addBulkSetsBtn.addEventListener('click', () => addSetToActiveWorkout(true));
        logCardioBtn.addEventListener('click', logCardioDetails);
        progressExerciseSelect.addEventListener('change', updateProgressChart);


        // --- Initialization ---
        document.addEventListener('DOMContentLoaded', () => {
            loadWorkoutHistory();
            navigateTo('home'); 
            // GAPI/GIS loading is handled by their script tags' onload attributes
        });
        // --- END OF ORIGINAL SCRIPT (with modifications) ---
    