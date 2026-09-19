/**
 * OAuth tokens returned by integration providers
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Abstract base service for third-party integrations with OAuth2 authentication
 *
 * This base class provides the OAuth2 authentication flow common to all integrations.
 * It does NOT include integration-specific functionality (e.g., calendar events, messaging).
 * For integration-specific capabilities, extend specialized service classes like
 * `CalendarIntegrationService` or `MessagingIntegrationService`.
 *
 * Each integration provider (Google Calendar, Outlook, Slack, etc.) must implement
 * the OAuth methods defined here to provide authentication functionality.
 */
export abstract class IntegrationService {
  /**
   * Generate OAuth authorization URL for user consent
   *
   * @param organizationId - Organization ID for state parameter
   * @param userId - User ID for state parameter
   * @returns Promise resolving to OAuth authorization URL
   */
  abstract getAuthorizationUrl(organizationId: string, userId: string): Promise<string>;

  /**
   * Exchange OAuth authorization code for access and refresh tokens
   *
   * @param code - Authorization code from OAuth callback
   * @returns Promise resolving to OAuth tokens with expiry
   */
  abstract exchangeCodeForTokens(code: string): Promise<OAuthTokens>;

  /**
   * Refresh expired access token using refresh token
   *
   * @param refreshToken - Refresh token from previous authentication
   * @returns Promise resolving to new OAuth tokens with expiry
   */
  abstract refreshTokens(refreshToken: string): Promise<OAuthTokens>;
}
