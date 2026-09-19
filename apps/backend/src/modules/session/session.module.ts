import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { ListSessions } from './usecases/list-sessions/list-sessions.usecase';
import { RevokeSession } from './usecases/revoke-session/revoke-session.usecase';

@Module({
  controllers: [SessionController],
  providers: [ListSessions, RevokeSession],
})
export class SessionModule {}
