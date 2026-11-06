const form = document.querySelector('#converter-form');
const input = document.querySelector('#temperature');
const errorMessage = document.querySelector('#input-error');
const unitSymbol = document.querySelector('#unit-symbol');
const note = document.querySelector('#result-note');
const resultElements = {
  celsius: document.querySelector('#celsius-result'),
  fahrenheit: document.querySelector('#fahrenheit-result'),
  kelvin: document.querySelector('#kelvin-result'),
};

const absoluteZero = { celsius: -273.15, fahrenheit: -459.67, kelvin: 0 };
const symbols = { celsius: '°C', fahrenheit: '°F', kelvin: 'K' };

function selectedUnit() {
  return document.querySelector('input[name="unit"]:checked').value;
}

function formatTemperature(value) {
  return Number(value.toFixed(2)).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function setError(message) {
  errorMessage.textContent = message;
  input.classList.add('invalid');
  note.textContent = 'Please check your value';
}

function clearError() {
  errorMessage.textContent = '';
  input.classList.remove('invalid');
}

function updateUnitSymbol() {
  unitSymbol.textContent = symbols[selectedUnit()];
}

function convertTemperature(value, unit) {
  let celsius;
  if (unit === 'fahrenheit') celsius = (value - 32) * 5 / 9;
  else if (unit === 'kelvin') celsius = value - 273.15;
  else celsius = value;

  return { celsius, fahrenheit: (celsius * 9 / 5) + 32, kelvin: celsius + 273.15 };
}

function showResults(values, inputUnit) {
  Object.entries(values).forEach(([unit, value]) => {
    const element = resultElements[unit];
    element.textContent = formatTemperature(value);
    element.closest('.result-item').classList.remove('updated');
    requestAnimationFrame(() => element.closest('.result-item').classList.add('updated'));
  });
  document.querySelectorAll('.result-item').forEach((item) => item.classList.remove('active'));
  resultElements[inputUnit].closest('.result-item').classList.add('active');
  note.textContent = `Converted from ${symbols[inputUnit]}`;
}

function processConversion() {
  const textValue = input.value.trim();
  const unit = selectedUnit();
  const value = Number(textValue);

  if (textValue === '') {
    setError('Enter a temperature value to convert.');
    return;
  }
  if (!Number.isFinite(value)) {
    setError('Please enter a valid number, such as 24.5 or -10.');
    return;
  }
  if (value < absoluteZero[unit]) {
    setError(`That is below absolute zero (${absoluteZero[unit]} ${symbols[unit]}), which is not possible.`);
    return;
  }
  clearError();
  showResults(convertTemperature(value, unit), unit);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  processConversion();
});

input.addEventListener('input', () => {
  const textValue = input.value.trim();
  const value = Number(textValue);
  const unit = selectedUnit();

  if (textValue === '') {
    clearError();
  } else if (!Number.isFinite(value)) {
    setError('Please enter a valid number, such as 24.5 or -10.');
  } else if (value < absoluteZero[unit]) {
    setError(`That is below absolute zero (${absoluteZero[unit]} ${symbols[unit]}), which is not possible.`);
  } else {
    clearError();
  }
});

document.querySelectorAll('input[name="unit"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    updateUnitSymbol();
    if (input.value.trim() !== '') processConversion();
  });
});

updateUnitSymbol();
