import { Module } from '@nestjs/common';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VapiProvider } from '../../providers/ai/vapi.provider';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [VoiceController],
  providers: [VoiceService, PrismaService, VapiProvider],
  exports: [VoiceService],
})
export class VoiceModule {}
