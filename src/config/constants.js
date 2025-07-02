// Application configuration using environment variables
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Soccer Team Finance',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD
}

// Database table names (centralized configuration)
export const DB_TABLES = {
  USERS: 'users_stf2024',
  CATEGORIES: 'categories_stf2024', 
  ITEMS: 'items_stf2024',
  TRANSACTIONS: 'transactions_stf2024',
  PLATFORM_BUTTONS: 'platform_buttons_stf2024'
}

// UI Constants
export const UI_CONFIG = {
  TOAST_DURATION: 4000,
  ANIMATION_DURATION: 300,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: ['image/*', '.pdf', '.doc', '.docx', '.txt']
}

// Validation rules
export const VALIDATION = {
  EMAIL_PATTERN: /^\S+@\S+$/i,
  MIN_PASSWORD_LENGTH: 6,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 999999.99
}