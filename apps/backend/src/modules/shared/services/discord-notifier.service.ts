import { Injectable, Logger } from '@nestjs/common';

const DISCORD_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1526984038290555030/TSsp5Tt11zwDJZ3lxrMSNxBem4CaURNaRsKyjq09BNQQP3K5KKLSWc3PvyFXnvYDmbK6';
const DISCORD_USERNAME = 'RabbitHR Bot';
const MAX_CONTENT_LENGTH = 1900;

@Injectable()
export class DiscordNotifierService {
  private readonly logger = new Logger(DiscordNotifierService.name);

  async send(content: string): Promise<boolean> {
    const message = content?.trim();
    if (!message) return false;

    try {
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message.slice(0, MAX_CONTENT_LENGTH),
          username: DISCORD_USERNAME,
        }),
      });

      if (!response.ok) {
        this.logger.error(`Discord webhook returned ${response.status}`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Discord webhook request failed: ${(error as Error).message}`,
      );
      return false;
    }
  }
}
