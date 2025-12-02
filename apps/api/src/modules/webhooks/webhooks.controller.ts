import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { Webhook } from 'svix';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string | null;
    last_name?: string | null;
    created_at?: number;
    updated_at?: number;
  };
}

@Controller('webhooks')
@SkipThrottle() // Webhooks should not be rate limited
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('clerk')
  async handleClerkWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const webhookSecret = this.configService.get<string>('clerk.webhookSecret');

    if (!webhookSecret) {
      this.logger.warn('Clerk webhook secret not configured');
      throw new BadRequestException('Webhook not configured');
    }

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException('Missing svix headers');
    }

    const body = req.rawBody;

    if (!body) {
      throw new BadRequestException('Missing request body');
    }

    let event: ClerkWebhookEvent;

    try {
      const webhook = new Webhook(webhookSecret);
      event = webhook.verify(body.toString(), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch (error) {
      this.logger.error('Webhook verification failed', error);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Received Clerk webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'user.created':
          await this.handleUserCreated(event.data);
          break;

        case 'user.updated':
          await this.handleUserUpdated(event.data);
          break;

        case 'user.deleted':
          await this.handleUserDeleted(event.data);
          break;

        default:
          this.logger.log(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook ${event.type}`, error);
      throw error;
    }

    return { received: true };
  }

  private async handleUserCreated(data: ClerkWebhookEvent['data']) {
    const email = data.email_addresses?.[0]?.email_address;

    if (!email) {
      this.logger.warn(`User created without email: ${data.id}`);
      return;
    }

    await this.prisma.user.upsert({
      where: { id: data.id },
      update: {
        email,
        firstName: data.first_name,
      },
      create: {
        id: data.id,
        email,
        firstName: data.first_name,
        tier: 'FREE',
      },
    });

    this.logger.log(`User created/updated: ${data.id}`);
  }

  private async handleUserUpdated(data: ClerkWebhookEvent['data']) {
    const email = data.email_addresses?.[0]?.email_address;

    const existingUser = await this.prisma.user.findUnique({
      where: { id: data.id },
    });

    if (!existingUser) {
      // User doesn't exist yet, create them
      if (email) {
        await this.handleUserCreated(data);
      }
      return;
    }

    await this.prisma.user.update({
      where: { id: data.id },
      data: {
        email: email || existingUser.email,
        firstName: data.first_name,
      },
    });

    this.logger.log(`User updated: ${data.id}`);
  }

  private async handleUserDeleted(data: ClerkWebhookEvent['data']) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: data.id },
    });

    if (!existingUser) {
      this.logger.warn(`User not found for deletion: ${data.id}`);
      return;
    }

    // Delete user and cascade to related records
    await this.prisma.user.delete({
      where: { id: data.id },
    });

    this.logger.log(`User deleted: ${data.id}`);
  }
}
