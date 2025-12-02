import { z } from 'zod';

export const sendMessageSchema = z.object({
  message: z.string().min(1).max(10000),
  conversationId: z.string().optional(),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;

export const createConversationSchema = z.object({
  title: z.string().max(200).optional(),
});

export type CreateConversationDto = z.infer<typeof createConversationSchema>;
