import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { AccessJwtStrategy } from './strategies/access-jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';
import { Login } from './usecases/login/login.usecase';
import { UserRegister } from './usecases/register/user-register.usecase';
import { PasswordResetRequest } from './usecases/password-reset-request/password-reset-request.usecase';
import { PasswordReset } from './usecases/password-reset/password-reset.usecase';
import { UpdatePassword } from './usecases/update-password/update-password.usecase';
import { RefreshToken } from './usecases/refresh-token/refresh-token.usecase';
import { Logout } from './usecases/logout/logout.usecase';
import { Impersonate } from './usecases/impersonate/impersonate.usecase';
import { GoogleLogin } from './usecases/google-login/google-login.usecase';
import { SendSignupOtp } from './usecases/send-signup-otp/send-signup-otp.usecase';
import { VerifySignupOtp } from './usecases/verify-signup-otp/verify-signup-otp.usecase';
import { UpdateOnboardingContext } from './usecases/update-onboarding-context/update-onboarding-context.usecase';

const USE_CASES = [
  Login,
  UserRegister,
  PasswordResetRequest,
  PasswordReset,
  UpdatePassword,
  RefreshToken,
  Logout,
  Impersonate,
  GoogleLogin,
  SendSignupOtp,
  VerifySignupOtp,
  UpdateOnboardingContext,
];

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt-access',
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessJwtStrategy,
    RefreshJwtStrategy,
    JwtAuthGuard,
    RefreshJwtGuard,
    ...USE_CASES,
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
