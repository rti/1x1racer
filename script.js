// --- Constants ---
const MAX_PROBLEMS = 10;
const MIN_FACTOR = 1;
const MAX_FACTOR = 10;
const NUM_CHOICES = 7; // Reduced number of choices
const BEST_TIME_KEY = 'mathGameBestTime'; // Key for localStorage

// --- Game State Variables ---
let currentProblemIndex = 0;
let problems = [];
let errors = 0;
let startTime = 0;
let currentCorrectAnswer = 0;
let currentQuestion = "";

// --- HTML Element References ---
const startScreen = document.getElementById('start-screen');
const gameArea = document.getElementById('game-area');
const resultsArea = document.getElementById('results-area');
const progressBarEl = document.getElementById('progress-bar'); // Get progress bar element
const questionEl = document.getElementById('question');
const choicesEl = document.getElementById('choices');
const feedbackEl = document.getElementById('feedback');
const totalTimeEl = document.getElementById('total-time');
const totalErrorsEl = document.getElementById('total-errors');
const bestTimeEl = document.getElementById('best-time'); // Element for best time display
const bestTimeMessageEl = document.getElementById('best-time-message'); // Element for new best time message
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

// --- Functions ---

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Generates a multiplication problem and answer choices. */
function generateProblem() {
    const a = Math.floor(Math.random() * (MAX_FACTOR - MIN_FACTOR + 1)) + MIN_FACTOR;
    const b = Math.floor(Math.random() * (MAX_FACTOR - MIN_FACTOR + 1)) + MIN_FACTOR;
    const correctAnswer = a * b;

    const choices = new Set([correctAnswer]);
    while (choices.size < NUM_CHOICES) {
        // Generate plausible wrong answers near the correct one
        const offsetFactor = Math.max(a, b, 5); // Adjust range based on factors
        const offset = Math.floor(Math.random() * (2 * offsetFactor + 1)) - offsetFactor; // e.g., -5 to +5 if offsetFactor is 5
        let wrongAnswer = correctAnswer + offset;

        // Ensure wrong answer is not the correct answer, is non-negative, and <= 100
        if (wrongAnswer !== correctAnswer && wrongAnswer >= 0 && wrongAnswer <= 100) {
            choices.add(wrongAnswer);
        }
        // Add a simple random wrong answer if generation gets stuck, ensuring it's <= 100
        if (choices.size < NUM_CHOICES && Math.random() > 0.8) {
             let randomWrong = Math.floor(Math.random() * (MAX_FACTOR * MAX_FACTOR + 1)); // Max possible correct answer is 100
             // Ensure the random wrong answer is also <= 100 and not the correct one
             if (randomWrong !== correctAnswer && randomWrong <= 100) choices.add(randomWrong);
        }
    }

    // Sort choices numerically instead of shuffling
    const choicesArray = Array.from(choices).sort((a, b) => a - b);

    return {
        question: `${a} x ${b} = ?`,
        choices: choicesArray,
        answer: correctAnswer
    };
}

/** Displays the current problem */
function displayProblem() {
    feedbackEl.textContent = ''; // Clear previous feedback
    feedbackEl.className = ''; // Clear feedback class

    if (currentProblemIndex >= MAX_PROBLEMS) {
        endGame();
        return;
    }

    const problem = problems[currentProblemIndex];
    currentCorrectAnswer = problem.answer;
    currentQuestion = problem.question;

    // Update progress bar
    const progressPercent = ((currentProblemIndex) / MAX_PROBLEMS) * 100;
    progressBarEl.style.width = `${progressPercent}%`;
    // Optional: Add text inside the progress bar
    // progressBarEl.textContent = `${currentProblemIndex + 1} / ${MAX_PROBLEMS}`;

    questionEl.textContent = problem.question;

    choicesEl.innerHTML = ''; // Clear previous choices
    problem.choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice;
        button.onclick = () => checkAnswer(choice);
        choicesEl.appendChild(button);
    });
}

/** Checks the selected answer */
function checkAnswer(selectedAnswer) {
    if (selectedAnswer === currentCorrectAnswer) {
        feedbackEl.textContent = "Correct!";
        feedbackEl.className = 'correct';
        currentProblemIndex++;
        // Disable buttons briefly after correct answer
        disableChoiceButtons(true);
        setTimeout(() => {
             disableChoiceButtons(false);
             displayProblem();
        }, 800); // Short delay before next problem
    } else {
        errors++;
        feedbackEl.textContent = `Wrong! ${currentQuestion.split('=')[0]} is not ${selectedAnswer}. Try again.`;
        feedbackEl.className = 'wrong';
        // Optionally disable just the wrong button briefly or add visual cue
        const wrongButton = Array.from(choicesEl.children).find(btn => parseInt(btn.textContent) === selectedAnswer);
        if (wrongButton) {
            wrongButton.style.backgroundColor = '#ffdddd'; // Highlight wrong choice briefly
            setTimeout(() => {
                 wrongButton.style.backgroundColor = ''; // Reset style
            }, 500);
        }
    }
}

/** Disables or enables all choice buttons */
function disableChoiceButtons(disabled) {
     const buttons = choicesEl.getElementsByTagName('button');
     for (let button of buttons) {
         button.disabled = disabled;
     }
}


/** Ends the game and displays results */
function endGame() {
    const endTime = Date.now();
    const totalTimeSeconds = (endTime - startTime) / 1000; // Time in seconds

    const currentTimeFormatted = totalTimeSeconds.toFixed(2);
    totalTimeEl.textContent = currentTimeFormatted;
    totalErrorsEl.textContent = errors;

    // --- Best Time Logic ---
    const bestTime = localStorage.getItem(BEST_TIME_KEY);
    let isNewBestTime = false;

    if (bestTime === null || totalTimeSeconds < parseFloat(bestTime)) {
        // New best time or no previous best time
        localStorage.setItem(BEST_TIME_KEY, totalTimeSeconds.toString());
        bestTimeEl.textContent = currentTimeFormatted;
        bestTimeMessageEl.style.display = 'block'; // Show "New Best Time!" message
        isNewBestTime = true;
    } else {
        // Not a new best time, display the stored best time
        bestTimeEl.textContent = parseFloat(bestTime).toFixed(2);
        bestTimeMessageEl.style.display = 'none'; // Hide message
    }
    // --- End Best Time Logic ---


    gameArea.style.display = 'none'; // Hide game area
    resultsArea.style.display = 'block'; // Show results area

    // Trigger confetti effect (maybe enhance for new best time?)
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150, // More particles
            spread: 90,      // Wider spread
            origin: { y: 0.3 } // Start slightly higher than center
        });
    }
}

/** Sets up and starts a new game */
function startGame() {
    currentProblemIndex = 0;
    errors = 0;
    problems = [];
    for (let i = 0; i < MAX_PROBLEMS; i++) {
        problems.push(generateProblem());
    }
    startTime = Date.now();

    // Reset progress bar for new game
    progressBarEl.style.width = '0%';
    // Removed totalProblemsEl update

    displayProblem();
}

// --- Event Listeners ---
startButton.addEventListener('click', () => {
    startScreen.style.display = 'none'; // Hide start screen
    gameArea.style.display = 'block'; // Show game area
    resultsArea.style.display = 'none'; // Ensure results are hidden
    bestTimeMessageEl.style.display = 'none'; // Hide message on start
    startGame(); // Initialize and start the actual game logic
});

restartButton.addEventListener('click', () => {
    resultsArea.style.display = 'none'; // Hide results screen
    gameArea.style.display = 'block'; // Show game area
    bestTimeMessageEl.style.display = 'none'; // Hide message on restart
    startGame(); // Re-initialize and start a new game
});

// --- Initial Setup ---
// Game no longer starts automatically. Waits for start button click.
