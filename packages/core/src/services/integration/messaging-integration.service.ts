import { IntegrationService, OAuthTokens } from './integration.service';

/**
 * Message payload for sending messages via messaging integrations
 */
export interface MessagePayload {
  channel: string;
  text: string;
  attachments?: any[];
  threadId?: string;
}

/**
 * Channel information for messaging integrations
 */
export interface Channel {
  id: string;
  name: string;
  type?: string;
}

/**
 * Abstract service for messaging integrations
 *
 * Extends the base IntegrationService to add messaging-specific functionality.
 * Messaging integrations (Slack, Microsoft Teams, etc.) should extend this class
 * to provide message sending and channel management capabilities.
 *
 * This service handles:
 * - OAuth2 authentication (inherited from IntegrationService)
 * - Message sending to channels
 * - Channel listing (optional)
 */
export abstract class MessagingIntegrationService extends IntegrationService {
  /**
   * Send a message to a channel
   *
   * @param tokens - OAuth tokens for API authentication
   * @param message - Message payload with channel, text, and optional attachments
   * @returns Promise resolving to message details including ID, timestamp, and optional channelId
   */
  abstract sendMessage(
    tokens: OAuthTokens,
    message: MessagePayload
  ): Promise<{ messageId: string; timestamp: Date; channelId?: string }>;

  /**
   * List available channels (optional implementation)
   *
   * @param _tokens - OAuth tokens for API authentication
   * @returns Promise resolving to array of available channels
   */
  async listChannels(_tokens: OAuthTokens): Promise<Channel[]> {
    // Default implementation returns empty array
    // Subclasses can override to provide actual channel listing
    return [];
  }
}

