/**
 * Valida que un campo no esté vacío
 */
export const required = (value) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return 'Este campo es requerido';
  }
  return null;
};

/**
 * Valida formato de email
 */
export const email = (value) => {
  if (!value) return null;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(value)) {
    return 'Email inválido';
  }
  return null;
};

/**
 * Valida longitud mínima
 */
export const minLength = (min) => (value) => {
  if (!value) return null;
  if (value.length < min) {
    return `Debe tener al menos ${min} caracteres`;
  }
  return null;
};

/**
 * Valida longitud máxima
 */
export const maxLength = (max) => (value) => {
  if (!value) return null;
  if (value.length > max) {
    return `No puede exceder ${max} caracteres`;
  }
  return null;
};

/**
 * Valida que sea un número
 */
export const isNumber = (value) => {
  if (!value && value !== 0) return null;
  if (isNaN(value)) {
    return 'Debe ser un número válido';
  }
  return null;
};

/**
 * Valida rango de fechas
 */
export const dateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) {
    return 'La fecha final debe ser posterior a la fecha inicial';
  }
  return null;
};

/**
 * Valida múltiples reglas
 */
export const validate = (value, rules = []) => {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
};

/**
 * Valida un objeto completo
 */
export const validateForm = (values, rules) => {
  const errors = {};
  for (const field in rules) {
    const fieldRules = rules[field];
    const error = validate(values[field], fieldRules);
    if (error) {
      errors[field] = error;
    }
  }
  return errors;
};

export default {
  required,
  email,
  minLength,
  maxLength,
  isNumber,
  dateRange,
  validate,
  validateForm,
};
