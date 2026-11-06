const display = document.querySelector('#display');
const historyDisplay = document.querySelector('#history');
const keys = document.querySelectorAll('.key');

const operatorSymbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
let currentInput = '0';
let accumulator = null;
let pendingOperator = null;
let waitingForOperand = false;
let hasError = false;

function formatNumber(value) {
  if (!Number.isFinite(value)) return 'Error';
  return Number.parseFloat(value.toFixed(10)).toLocaleString(undefined, { maximumFractionDigits: 10 });
}

function render() {
  display.textContent = hasError ? 'Error' : (currentInput.endsWith('.') ? currentInput : formatNumber(Number.parseFloat(currentInput)));
  if (pendingOperator && accumulator !== null && !hasError) {
    historyDisplay.textContent = `${formatNumber(accumulator)} ${operatorSymbols[pendingOperator]}`;
  } else if (!hasError && historyDisplay.textContent === 'Ready') {
    historyDisplay.textContent = 'Ready';
  }
  document.querySelectorAll('.operator').forEach((button) => button.classList.toggle('is-active', button.dataset.operator === pendingOperator && waitingForOperand));
}

function reset() {
  currentInput = '0';
  accumulator = null;
  pendingOperator = null;
  waitingForOperand = false;
  hasError = false;
  historyDisplay.textContent = 'Ready';
  render();
}

function inputNumber(number) {
  if (hasError) reset();
  if (waitingForOperand) {
    currentInput = number;
    waitingForOperand = false;
  } else {
    currentInput = currentInput === '0' ? number : currentInput + number;
  }
  render();
}

function inputDecimal() {
  if (hasError) reset();
  if (waitingForOperand) {
    currentInput = '0.';
    waitingForOperand = false;
  } else if (!currentInput.includes('.')) {
    currentInput += '.';
  }
  render();
}

function calculate(left, right, operator) {
  switch (operator) {
    case 'add': return left + right;
    case 'subtract': return left - right;
    case 'multiply': return left * right;
    case 'divide': return right === 0 ? null : left / right;
    default: return right;
  }
}

function showError(message) {
  hasError = true;
  currentInput = 'Error';
  accumulator = null;
  pendingOperator = null;
  waitingForOperand = true;
  historyDisplay.textContent = message;
  render();
}

function chooseOperator(nextOperator) {
  if (hasError) return;
  const inputValue = Number.parseFloat(currentInput);

  if (pendingOperator && waitingForOperand) {
    pendingOperator = nextOperator;
    render();
    return;
  }
  if (accumulator === null) {
    accumulator = inputValue;
  } else if (pendingOperator) {
    const result = calculate(accumulator, inputValue, pendingOperator);
    if (result === null) {
      showError('Cannot divide by zero');
      return;
    }
    accumulator = result;
    currentInput = String(Number.parseFloat(result.toFixed(10)));
  }
  pendingOperator = nextOperator;
  waitingForOperand = true;
  render();
}

function equals() {
  if (hasError || pendingOperator === null || accumulator === null) return;
  const inputValue = Number.parseFloat(currentInput);
  const expression = `${formatNumber(accumulator)} ${operatorSymbols[pendingOperator]} ${formatNumber(inputValue)} =`;
  const result = calculate(accumulator, inputValue, pendingOperator);
  if (result === null) {
    showError('Cannot divide by zero');
    return;
  }
  currentInput = String(Number.parseFloat(result.toFixed(10)));
  accumulator = null;
  pendingOperator = null;
  waitingForOperand = true;
  historyDisplay.textContent = expression;
  render();
}

function backspace() {
  if (hasError) {
    reset();
    return;
  }
  if (waitingForOperand) return;
  currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : '0';
  if (currentInput === '-') currentInput = '0';
  render();
}

function applyPercent() {
  if (hasError) return;
  currentInput = String(Number.parseFloat((Number.parseFloat(currentInput) / 100).toFixed(10)));
  waitingForOperand = false;
  render();
}

keys.forEach((key) => {
  key.addEventListener('click', () => {
    if (key.dataset.number !== undefined) inputNumber(key.dataset.number);
    else if (key.dataset.operator) chooseOperator(key.dataset.operator);
    else if (key.dataset.action === 'decimal') inputDecimal();
    else if (key.dataset.action === 'equals') equals();
    else if (key.dataset.action === 'clear') reset();
    else if (key.dataset.action === 'backspace') backspace();
    else if (key.dataset.action === 'percent') applyPercent();
  });
});

document.addEventListener('keydown', (event) => {
  if (/^\d$/.test(event.key)) inputNumber(event.key);
  else if (event.key === '.') inputDecimal();
  else if (event.key === '+') chooseOperator('add');
  else if (event.key === '-') chooseOperator('subtract');
  else if (event.key === '*') chooseOperator('multiply');
  else if (event.key === '/') { event.preventDefault(); chooseOperator('divide'); }
  else if (event.key === 'Enter' || event.key === '=') equals();
  else if (event.key === 'Backspace') backspace();
  else if (event.key === 'Escape' || event.key.toLowerCase() === 'c') reset();
});

render();
