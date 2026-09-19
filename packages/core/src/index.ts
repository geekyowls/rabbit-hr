// Re-export from shared package for backward compatibility
export * from '@boilerplate/shared';

// Integration Provider enum
export enum IntegrationProvider {
  ZOOM = 'zoom',
  GOOGLE_CALENDAR = 'google_calendar',
  SLACK = 'slack',
  MICROSOFT_TEAMS = 'microsoft_teams',
}

// Utilities
export * from './utils';

// Commands
export * from './commands';

// Services
export * from './services';
