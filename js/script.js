let quizData = null;
let currentLevelIndex = 0;
let currentQuestionIndex = 0;
let score = 0;
let totalQuestions = 0;
let isAnswered = false;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const questionScreen = document.getElementById('question-screen');
const resultScreen = document.getElementById('result-screen');
const levelDisplay = document.getElementById('level-display');
const scoreDisplay = document.getElementById('score-display');
const levelTitle = document.getElementById('level-title');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const fillContainer = document.getElementById('fill-container');
const fillInput = document.getElementById('fill-input');
const submitFillBtn = document.getElementById('submit-fill');
const feedback = document.getElementById('feedback');
const progressBar = document.getElementById('progress-bar');
const nextBtn = document.getElementById('next-btn');
const finalScore = document.getElementById('final-score');
const resultMessage = document.getElementById('result-message');

// Initialize Quiz
async function initQuiz() {
    try {
        const response = await fetch('data/questions.json');
        quizData = await response.json();
        totalQuestions = quizData.levels.reduce((acc, level) => acc + level.questions.length, 0);

        document.getElementById('start-btn').addEventListener('click', startQuiz);
        submitFillBtn.addEventListener('click', () => checkAnswer(fillInput.value));
        nextBtn.addEventListener('click', nextQuestion);
        document.getElementById('restart-btn').addEventListener('click', resetQuiz);

        // Allow "Enter" key for fill-in-the-blanks
        fillInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkAnswer(fillInput.value);
        });

    } catch (error) {
        console.error('Error loading quiz data:', error);
        questionText.innerText = "Oops! Could not load the quiz. Please try again later.";
    }
}

function startQuiz() {
    startScreen.classList.add('hidden');
    questionScreen.classList.remove('hidden');
    showQuestion();
}

function showQuestion() {
    const currentLevel = quizData.levels[currentLevelIndex];
    const currentQuestion = currentLevel.questions[currentQuestionIndex];

    levelDisplay.innerText = `Level: ${currentLevel.level}`;
    levelTitle.innerText = currentLevel.title;
    questionText.innerText = currentQuestion.question;

    feedback.classList.add('hidden');
    nextBtn.classList.add('hidden');
    isAnswered = false;

    updateProgressBar();

    if (currentQuestion.type === 'mcq') {
        optionsContainer.classList.remove('hidden');
        fillContainer.classList.add('hidden');
        renderOptions(currentQuestion);
    } else {
        optionsContainer.classList.add('hidden');
        fillContainer.classList.remove('hidden');
        fillInput.value = '';
        fillInput.disabled = false;
        submitFillBtn.disabled = false;
        fillInput.focus();
    }
}

function renderOptions(question) {
    optionsContainer.innerHTML = '';
    question.options.forEach(option => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('option-btn');
        button.addEventListener('click', () => checkAnswer(option));
        optionsContainer.appendChild(button);
    });
}

function checkAnswer(userAnswer) {
    if (isAnswered) return;
    isAnswered = true;

    const currentLevel = quizData.levels[currentLevelIndex];
    const currentQuestion = currentLevel.questions[currentQuestionIndex];
    const isCorrect = userAnswer.trim().toLowerCase() === currentQuestion.answer.toLowerCase();

    feedback.classList.remove('hidden');

    if (isCorrect) {
        score++;
        scoreDisplay.innerText = `Score: ${score}`;
        feedback.innerText = "Ma sha Allah! Correct! ✨";
        feedback.className = 'correct';
        playSound('correct');
    } else {
        feedback.innerText = `Keep learning! The correct answer was: ${currentQuestion.answer}`;
        feedback.className = 'incorrect';
        playSound('incorrect');
    }

    // Disable interactions
    if (currentQuestion.type === 'mcq') {
        const buttons = optionsContainer.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.innerText.toLowerCase() === currentQuestion.answer.toLowerCase()) {
                btn.classList.add('correct');
            } else if (btn.innerText === userAnswer && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });
    } else {
        fillInput.disabled = true;
        submitFillBtn.disabled = true;
    }

    nextBtn.classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex >= quizData.levels[currentLevelIndex].questions.length) {
        currentLevelIndex++;
        currentQuestionIndex = 0;
    }

    if (currentLevelIndex >= quizData.levels.length) {
        showResults();
    } else {
        showQuestion();
    }
}

function updateProgressBar() {
    let questionsProcessed = 0;
    for (let i = 0; i < currentLevelIndex; i++) {
        questionsProcessed += quizData.levels[i].questions.length;
    }
    questionsProcessed += currentQuestionIndex;

    const progress = (questionsProcessed / totalQuestions) * 100;
    progressBar.style.width = `${progress}%`;
}

function showResults() {
    questionScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');

    finalScore.innerText = `Your total score: ${score} / ${totalQuestions}`;

    if (score === totalQuestions) {
        resultMessage.innerText = "SubhanAllah! You are a Prophets expert! 🌟";
    } else if (score >= totalQuestions / 2) {
        resultMessage.innerText = "Alhamdulillah! You did a great job! Keep learning about our Prophets. 😊";
    } else {
        resultMessage.innerText = "Well done for trying! Let's read more stories about the Prophets and try again. 📚";
    }
}

function resetQuiz() {
    currentLevelIndex = 0;
    currentQuestionIndex = 0;
    score = 0;
    scoreDisplay.innerText = 'Score: 0';
    resultScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
}

// Placeholder for sound effects
function playSound(type) {
    // In a real app, we could play fun sound effects here
    console.log(`Playing ${type} sound`);
}

initQuiz();
