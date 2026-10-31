/**
 * Utility functions for CPF masking and official mathematical validation.
 */

export function formatCpf(value: string): string {
  // Remove non-digits
  const clean = value.replace(/\D/g, '').slice(0, 11);

  if (clean.length <= 3) {
    return clean;
  }
  if (clean.length <= 6) {
    return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  }
  if (clean.length <= 9) {
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  }
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

export function validateCpf(cpfValue: string): boolean {
  const clean = cpfValue.replace(/\D/g, '');

  if (clean.length !== 11) {
    return false;
  }

  // Reject known invalid CPFs with identical digits (00000000000, 11111111111, etc.)
  if (/^(\d)\1{10}$/.test(clean)) {
    return false;
  }

  // Validate 1st check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let firstCheck = (sum * 10) % 11;
  if (firstCheck === 10 || firstCheck === 11) {
    firstCheck = 0;
  }
  if (firstCheck !== parseInt(clean.charAt(9), 10)) {
    return false;
  }

  // Validate 2nd check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  let secondCheck = (sum * 10) % 11;
  if (secondCheck === 10 || secondCheck === 11) {
    secondCheck = 0;
  }
  if (secondCheck !== parseInt(clean.charAt(10), 10)) {
    return false;
  }

  return true;
}

export function formatCep(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 8);
  if (clean.length <= 5) {
    return clean;
  }
  return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
}
