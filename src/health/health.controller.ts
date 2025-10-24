import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  checkHealth() {
    return {
      status: 'ok',
      service: 'nexus-ai-task',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }



  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness check for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  checkReadiness() {
    return {
      status: 'ready',
      service: 'nexus-ai-task',
      timestamp: new Date().toISOString(),
    };
  }
}