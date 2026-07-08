const newGameBtn = document.getElementById('newGameBtn');
const resumeGameBtn = document.getElementById('resumeGameBtn');
const playPanel = document.getElementById('playPanel');
const startPanel = document.getElementById('startPanel');
const gameOverPanel = document.getElementById('gameOverPanel');
const questionText = document.getElementById('questionText');
const levelLabel = document.getElementById('levelLabel');
const mistakesLabel = document.getElementById('mistakesLabel');
const scoreLabel = document.getElementById('scoreLabel');
const answerInput = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const timeLeftLabel = document.getElementById('timeLeft');
const timerFill = document.getElementById('timerFill');
const finalLevel = document.getElementById('finalLevel');
const finalMessage = document.getElementById('finalMessage');
const restartBtn = document.getElementById('restartBtn');

const STORAGE_KEY = 'rapidoSumasProgreso';
const MAX_MISTAKES = 2;
const BASE_TIME = 10;

let gameState = {
  level: 1,
  score: 0,
  mistakes: 0,
  currentAnswer: null,
  digits: 1,
  timeRemaining: BASE_TIME,
  active: false
};

let timerInterval = null;

function loadProgress() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return false;
  try {
    const parsed = JSON.parse(saved);
    if (parsed.level && parsed.score >= 0) {
      gameState = {
        ...gameState,
        ...parsed,
        active: false,
        timeRemaining: BASE_TIME
      };
      updateDigits();
      return true;
    }
  } catch (error) {
    console.warn('Error al cargar el progreso', error);
  }
  return false;
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    level: gameState.level,
    score: gameState.score,
    mistakes: gameState.mistakes,
    digits: gameState.digits
  }));
}

function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}

function updateDigits() {
  gameState.digits = Math.min(1 + Math.floor((gameState.level - 1) / 10), 4);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion() {
  updateDigits();
  const max = 9 * Math.pow(10, gameState.digits - 1);
  const min = Math.pow(10, gameState.digits - 1);
  const left = getRandomInt(min, max);
  const right = getRandomInt(min, max);
  const isAddition = Math.random() < 0.55;
  if (isAddition) {
    gameState.currentAnswer = left + right;
    questionText.textContent = `${left} + ${right}`;
  } else {
    const first = Math.max(left, right);
    const second = Math.min(left, right);
    gameState.currentAnswer = first - second;
    questionText.textContent = `${first} - ${second}`;
  }
  levelLabel.textContent = gameState.level;
  mistakesLabel.textContent = `${gameState.mistakes}/${MAX_MISTAKES}`;
  scoreLabel.textContent = gameState.score;
  answerInput.value = '';
  answerInput.focus();
  resetTimer();
}

function resetTimer() {
  clearInterval(timerInterval);
  gameState.timeRemaining = BASE_TIME;
  timeLeftLabel.textContent = gameState.timeRemaining;
  timerFill.style.width = '100%';
  timerInterval = setInterval(() => {
    gameState.timeRemaining -= 0.1;
    if (gameState.timeRemaining <= 0) {
      gameState.timeRemaining = 0;
      handleWrongAnswer(true);
      return;
    }
    timeLeftLabel.textContent = Math.ceil(gameState.timeRemaining);
    timerFill.style.width = `${(gameState.timeRemaining / BASE_TIME) * 100}%`;
  }, 100);
}

function startGame({ reset = false } = {}) {
  if (reset) {
    gameState = {
      level: 1,
      score: 0,
      mistakes: 0,
      currentAnswer: null,
      digits: 1,
      timeRemaining: BASE_TIME,
      active: true
    };
    clearProgress();
  } else {
    gameState.active = true;
  }
  startPanel.classList.add('hidden');
  gameOverPanel.classList.add('hidden');
  playPanel.classList.remove('hidden');
  generateQuestion();
}

function endGame() {
  gameState.active = false;
  clearInterval(timerInterval);
  playPanel.classList.add('hidden');
  gameOverPanel.classList.remove('hidden');
  finalLevel.textContent = gameState.level;
  finalMessage.textContent = `Has perdido ${gameState.mistakes} veces. Tu mejor nivel fue ${gameState.level}.`;
}

function handleCorrectAnswer() {
  gameState.score += 10;
  gameState.level += 1;
  saveProgress();
  generateQuestion();
}

function handleWrongAnswer(timeout = false) {
  gameState.mistakes += 1;
  clearInterval(timerInterval);
  if (gameState.mistakes >= MAX_MISTAKES) {
    saveProgress();
    endGame();
    return;
  }
  mistakesLabel.textContent = `${gameState.mistakes}/${MAX_MISTAKES}`;
  if (timeout) {
    alert('Se acabó el tiempo. Cuidado con la próxima.');
  } else {
    alert('Respuesta incorrecta. Intenta el siguiente.');
  }
  saveProgress();
  gameState.level += 1;
  generateQuestion();
}

function validateAnswer() {
  if (!gameState.active) return;
  const answer = Number(answerInput.value.trim());
  if (Number.isNaN(answer) || answerInput.value.trim() === '') {
    answerInput.focus();
    return;
  }
  clearInterval(timerInterval);
  if (answer === gameState.currentAnswer) {
    handleCorrectAnswer();
  } else {
    handleWrongAnswer(false);
  }
}

newGameBtn.addEventListener('click', () => startGame({ reset: true }));
resumeGameBtn.addEventListener('click', () => {
  if (loadProgress()) {
    startGame();
  } else {
    startGame({ reset: true });
  }
});
submitBtn.addEventListener('click', validateAnswer);
restartBtn.addEventListener('click', () => startGame({ reset: true }));
answerInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    validateAnswer();
  }
});

window.addEventListener('load', () => {
  if (loadProgress()) {
    resumeGameBtn.disabled = false;
  } else {
    resumeGameBtn.disabled = true;
  }
});
