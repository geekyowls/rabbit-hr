import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import * as packageJson from '../package.json';

interface VersionResponse {
  version: string;
  gitCommit: string | null;
  buildTime: string | null;
}

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check with service status' })
  async getHealth() {
    return this.appService.getHealth();
  }

  @Get('version')
  @ApiOperation({ summary: 'Get application version info' })
  getVersion(): VersionResponse {
    return {
      version: packageJson.version,
      gitCommit: process.env.GIT_COMMIT || null,
      buildTime: process.env.BUILD_TIMESTAMP || null,
    };
  }

  @Get('debug-sentry')
  @ApiOperation({ summary: 'TEMPORARY — throws to verify GlitchTip capture' })
  getDebugSentry(): never {
    throw new Error('GlitchTip debug route — intentional test error');
  }
}
