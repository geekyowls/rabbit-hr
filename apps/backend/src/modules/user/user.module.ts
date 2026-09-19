import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module';
import { InviteUser } from './usecases/invite-user/invite-user.usecase';
import { AcceptInvite } from './usecases/accept-invite/accept-invite.usecase';
import { ResendInvite } from './usecases/resend-invite/resend-invite.usecase';
import { BlockUser } from './usecases/block-user/block-user.usecase';
import { UnblockUser } from './usecases/unblock-user/unblock-user.usecase';
import { UpdateUser } from './usecases/update-user/update-user.usecase';
import { GetCurrentUser } from './usecases/get-current-user/get-current-user.usecase';
import { ListUsers } from './usecases/list-users/list-users.usecase';
import { ListUsersDropdown } from './usecases/list-users-dropdown/list-users-dropdown.usecase';
import { UpdateProfile } from './usecases/update-profile/update-profile.usecase';
import { CreateUser } from './usecases/create-user/create-user.usecase';
import { CompleteTour } from './usecases/complete-tour/complete-tour.usecase';
import { SetManager } from './usecases/set-manager/set-manager.usecase';
import { GetUserHierarchy } from './usecases/get-user-hierarchy/get-user-hierarchy.usecase';
import { GetUserDescendants } from './usecases/get-user-descendants/get-user-descendants.usecase';
import { AdminResetPassword } from './usecases/admin-reset-password/admin-reset-password.usecase';
import { UpdatePagePreferences } from './usecases/update-page-preferences/update-page-preferences.usecase';

const USE_CASES = [
  InviteUser,
  AcceptInvite,
  ResendInvite,
  BlockUser,
  UnblockUser,
  UpdateUser,
  GetCurrentUser,
  ListUsers,
  ListUsersDropdown,
  UpdateProfile,
  CreateUser,
  CompleteTour,
  SetManager,
  GetUserHierarchy,
  GetUserDescendants,
  AdminResetPassword,
  UpdatePagePreferences,
];

@Module({
  imports: [MailModule, AuthModule],
  controllers: [UserController],
  providers: [...USE_CASES],
  exports: [],
})
export class UserModule {}
