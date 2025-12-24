import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { EmdrService } from './emdr.service';
import { AuthModule } from '../auth/auth.module';
import { AIModule } from '../../providers/ai/ai.module';
import { SafetyGuardProvider } from '../../providers/safety/safety-guard.provider';

@Module({
  imports: [AuthModule, AIModule],
  controllers: [ChatController],
  providers: [ChatService, EmdrService, SafetyGuardProvider],
  exports: [ChatService, EmdrService],
})
export class ChatModule {}
