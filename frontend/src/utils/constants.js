/**
 * Constantes de la aplicación
 */

// Roles de usuario
export const ROLES = {
  ADMIN: 'ADMIN',
  ANALISTA: 'ANALISTA',
  AUDITOR: 'AUDITOR',
};

// Etiquetas de roles
export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.ANALISTA]: 'Analista',
  [ROLES.AUDITOR]: 'Auditor',
};

// Estados de calificación
export const RATING_STATUS = {
  VIGENTE: 'VIGENTE',
  VENCIDO: 'VENCIDO',
  SUSPENDIDO: 'SUSPENDIDO',
};

export const RATING_STATUS_LABELS = {
  [RATING_STATUS.VIGENTE]: 'Vigente',
  [RATING_STATUS.VENCIDO]: 'Vencido',
  [RATING_STATUS.SUSPENDIDO]: 'Suspendido',
};

// Colores por estado
export const RATING_STATUS_COLORS = {
  [RATING_STATUS.VIGENTE]: 'success',
  [RATING_STATUS.VENCIDO]: 'danger',
  [RATING_STATUS.SUSPENDIDO]: 'warning',
};

// Tipos de calificación
export const RATINGS = [
  'AAA', 'AA+', 'AA', 'AA-', 
  'A+', 'A', 'A-', 
  'BBB+', 'BBB', 'BBB-',
  'BB+', 'BB', 'BB-',
  'B+', 'B', 'B-',
  'CCC', 'CC', 'C', 'D'
];

// Outlook
export const OUTLOOKS = {
  POSITIVO: 'POSITIVO',
  ESTABLE: 'ESTABLE',
  NEGATIVO: 'NEGATIVO',
};

export const OUTLOOK_LABELS = {
  [OUTLOOKS.POSITIVO]: 'Positivo',
  [OUTLOOKS.ESTABLE]: 'Estable',
  [OUTLOOKS.NEGATIVO]: 'Negativo',
};

// Colores por outlook
export const OUTLOOK_COLORS = {
  [OUTLOOKS.POSITIVO]: 'success',
  [OUTLOOKS.ESTABLE]: 'info',
  [OUTLOOKS.NEGATIVO]: 'danger',
};

// Estados de carga masiva
export const BULK_UPLOAD_STATUS = {
  PENDIENTE: 'PENDIENTE',
  PROCESANDO: 'PROCESANDO',
  COMPLETADO: 'COMPLETADO',
  ERROR: 'ERROR',
};

export const BULK_UPLOAD_STATUS_LABELS = {
  [BULK_UPLOAD_STATUS.PENDIENTE]: 'Pendiente',
  [BULK_UPLOAD_STATUS.PROCESANDO]: 'Procesando',
  [BULK_UPLOAD_STATUS.COMPLETADO]: 'Completado',
  [BULK_UPLOAD_STATUS.ERROR]: 'Error',
};

// Tipos de acción de auditoría
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
};

export const AUDIT_ACTION_LABELS = {
  [AUDIT_ACTIONS.CREATE]: 'Creación',
  [AUDIT_ACTIONS.UPDATE]: 'Actualización',
  [AUDIT_ACTIONS.DELETE]: 'Eliminación',
  [AUDIT_ACTIONS.LOGIN]: 'Inicio de sesión',
  [AUDIT_ACTIONS.LOGOUT]: 'Cierre de sesión',
};

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
};

// Configuración de API
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
};

export default {
  ROLES,
  ROLE_LABELS,
  RATING_STATUS,
  RATING_STATUS_LABELS,
  RATING_STATUS_COLORS,
  RATINGS,
  OUTLOOKS,
  OUTLOOK_LABELS,
  OUTLOOK_COLORS,
  BULK_UPLOAD_STATUS,
  BULK_UPLOAD_STATUS_LABELS,
  AUDIT_ACTIONS,
  AUDIT_ACTION_LABELS,
  PAGINATION,
  API_CONFIG,
};
