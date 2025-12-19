-- CreateEnum
CREATE TYPE "VoiceSessionStatus" AS ENUM ('active', 'completed', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "voice_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "vapi_call_id" TEXT NOT NULL,
    "session_type" TEXT NOT NULL,
    "status" "VoiceSessionStatus" NOT NULL DEFAULT 'active',
    "transcript" TEXT,
    "duration" INTEGER,
    "vapi_costs" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "voice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voice_sessions_vapi_call_id_key" ON "voice_sessions"("vapi_call_id");

-- CreateIndex
CREATE INDEX "voice_sessions_user_id_created_at_idx" ON "voice_sessions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "voice_sessions_vapi_call_id_idx" ON "voice_sessions"("vapi_call_id");

-- AddForeignKey
ALTER TABLE "voice_sessions" ADD CONSTRAINT "voice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_sessions" ADD CONSTRAINT "voice_sessions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
