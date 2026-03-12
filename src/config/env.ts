/**
 * Environment Configuration
 * Centralizes all environment variables and provides type-safe access
 */

export const env = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://apilicensing.openlimits.pt:2443',
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),

  // App Environment
  appEnv: (import.meta.env.VITE_APP_ENV || 'development') as 'development' | 'production' | 'staging',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,

  // Auth Configuration
  authDomain: import.meta.env.VITE_AUTH_DOMAIN || 'auth.openlimits.local',
  sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600000', 10),

  // Feature Flags
  enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
  enableLogging: import.meta.env.VITE_ENABLE_LOGGING === 'true',
} as const;

export type Env = typeof env;
