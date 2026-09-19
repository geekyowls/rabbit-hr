import { ConsoleLogger, LogLevel } from '@nestjs/common';
import { getRequestContext } from '../middleware/request-context';

const DEFAULT_LEVELS: LogLevel[] = ['log', 'warn', 'error'];

export class JsonLogger extends ConsoleLogger {
  private readonly enabled: Set<LogLevel>;

  constructor(levels: LogLevel[] = DEFAULT_LEVELS) {
    super();
    this.enabled = new Set(levels);
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    if (this.enabled.has('log')) this.emit('log', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    if (this.enabled.has('warn')) this.emit('warn', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    if (this.enabled.has('error')) this.emit('error', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]) {
    if (this.enabled.has('debug')) this.emit('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]) {
    if (this.enabled.has('verbose'))
      this.emit('verbose', message, optionalParams);
  }

  private emit(level: LogLevel, message: unknown, optionalParams: unknown[]) {
    const params = [...optionalParams];
    let context: string | undefined;
    if (params.length && typeof params[params.length - 1] === 'string') {
      context = params.pop() as string;
    }

    let stack: string | undefined;
    const meta: Record<string, unknown> = {};
    for (const param of params) {
      if (typeof param === 'string') stack = param;
      else if (param && typeof param === 'object') Object.assign(meta, param);
    }

    const entry: Record<string, unknown> = { ...meta };
    entry.time = new Date().toISOString();
    entry.level = level;
    entry.context = context ?? this.context;
    entry.message = this.render(message);

    const ctx = getRequestContext();
    if (ctx?.reqId) entry.reqId = ctx.reqId;
    if (ctx?.userId) entry.userId = ctx.userId;
    else if (ctx?.clientId) entry.clientId = ctx.clientId;
    if (ctx?.organizationId) entry.organizationId = ctx.organizationId;
    if (stack) entry.stack = stack;

    const line = JSON.stringify(entry) + '\n';
    if (level === 'error') process.stderr.write(line);
    else process.stdout.write(line);
  }

  private render(message: unknown): string {
    if (typeof message === 'string') return message;
    if (message instanceof Error) return message.message;
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }
}
