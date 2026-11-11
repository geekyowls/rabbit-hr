import { Injectable } from '@nestjs/common';
import { WhatsappProvider } from './whatsapp-provider';
import { WappCloudProvider } from './wappcloud.provider';

@Injectable()
export class WhatsappProviderRegistry {
  private readonly providers: Map<string, WhatsappProvider>;

  constructor(wappCloud: WappCloudProvider) {
    this.providers = new Map<string, WhatsappProvider>([
      [wappCloud.id, wappCloud],
    ]);
  }

  ids(): string[] {
    return [...this.providers.keys()];
  }

  get(id: string): WhatsappProvider | undefined {
    return this.providers.get(id);
  }
}
