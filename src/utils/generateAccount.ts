export function generateAccountNumber() {
  // 4 dígitos de 0000 a 9999
  const number = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  const sum = number
    .split('')
    .map((d) => parseInt(d, 10))
    .reduce((acc, n) => acc + n, 0);

  const digit = (sum % 10).toString();

  const display = `${number}-${digit}`;

  return {
    account_number: number,
    account_digit: digit,
    account_display: display,
  };
}
