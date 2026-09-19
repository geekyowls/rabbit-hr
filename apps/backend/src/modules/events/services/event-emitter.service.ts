import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseEvent } from '@boilerplate/core';

@Injectable()
export class AppEventEmitter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit<T extends BaseEvent>(event: T): boolean {
    return this.eventEmitter.emit(event.eventName, {
      ...event,
      timestamp: event.timestamp ?? new Date(),
    });
  }
}
