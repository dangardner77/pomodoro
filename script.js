const countdownDisplay = document.getElementById('countdown');
const phaseDisplay = document.getElementById('phase-name');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');

// Pomodoro sequence: 25 min work, 5 min break
const pomodoroSequence = [
    { name: "Work", duration: 25 * 60 },
    { name: "Break", duration: 5 * 60 }
];

let currentPhaseIndex = 0;
let timeLeft = 0;
let timerInterval;
let wakeLock = null;
let isRunning = false;

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock is active!');
            
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock was released');
            });
        }
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startBtn.style.display = "none";
    resetBtn.style.display = "inline-block";
    requestWakeLock();
    runPhase();
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    currentPhaseIndex = 0;
    timeLeft = 0;
    startBtn.style.display = "inline-block";
    resetBtn.style.display = "none";
    document.body.classList.remove("break-session");
    updateDisplay();
}

function runPhase() {
    if (currentPhaseIndex >= pomodoroSequence.length) {
        currentPhaseIndex = 0; // Loop back to work
    }

    let currentPhase = pomodoroSequence[currentPhaseIndex];
    
    playBeep(currentPhase.name === "Work" ? 660 : 440, 0.3);
    
    timeLeft = currentPhase.duration;
    phaseDisplay.innerText = currentPhase.name;
    
    updateTheme(currentPhase.name);
    updateDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();

        // Beep for the final 10 seconds
        if (timeLeft > 0 && timeLeft <= 10) {
            playBeep(330, 0.1);
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            
            // Play completion beep
            playBeep(880, 0.5);
            
            // Show phase complete notification
            if (currentPhaseIndex === 0) {
                phaseDisplay.innerText = "Work Complete!";
            } else {
                phaseDisplay.innerText = "Break Over!";
            }
            
            // Move to next phase after 2 seconds
            setTimeout(() => {
                currentPhaseIndex++;
                if (currentPhaseIndex >= pomodoroSequence.length) {
                    currentPhaseIndex = 0;
                }
                runPhase();
            }, 2000);
        }
    }, 1000);
}

function updateDisplay() {
    countdownDisplay.innerText = formatTime(timeLeft);
}

function updateTheme(name) {
    document.body.classList.remove("break-session");
    if (name === "Break") {
        document.body.classList.add("break-session");
    }
}

function playBeep(frequency = 440, duration = 0.2) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        oscillator.stop(audioCtx.currentTime + duration);
    } catch (err) {
        console.error('Audio error:', err);
    }
}

// Initialize display on page load
updateDisplay();

startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);
