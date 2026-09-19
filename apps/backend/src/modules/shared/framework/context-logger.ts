import { Logger } from '@nestjs/common';
import { getRequestContext } from '../middleware/request-context';

export class ContextLogger extends Logger {
  private formatWithContext(message: string): string {
    const ctx = getRequestContext();
    if (!ctx) return message;

    const parts: string[] = [];
    if (ctx.reqId) parts.push(ctx.reqId);
    if (ctx.userId) parts.push(`user=${ctx.userId}`);
    else if (ctx.clientId) parts.push(`client=${ctx.clientId}`);
    if (ctx.organizationId) parts.push(`org=${ctx.organizationId}`);

    return parts.length > 0 ? `[${parts.join(' ')}] ${message}` : message;
  }

  log(message: string, ...optionalParams: any[]) {
    super.log(this.formatWithContext(message), ...optionalParams);
  }

  warn(message: string, ...optionalParams: any[]) {
    super.warn(this.formatWithContext(message), ...optionalParams);
  }

  error(message: string, ...optionalParams: any[]) {
    super.error(this.formatWithContext(message), ...optionalParams);
  }

  debug(message: string, ...optionalParams: any[]) {
    super.debug(this.formatWithContext(message), ...optionalParams);
  }
}
