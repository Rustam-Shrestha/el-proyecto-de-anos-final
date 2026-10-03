-- AlterTable
ALTER TABLE "auth"."chat_conversations" ADD COLUMN     "bankStatementId" TEXT;

-- CreateIndex
CREATE INDEX "chat_conversations_bankStatementId_idx" ON "auth"."chat_conversations"("bankStatementId");

-- AddForeignKey
ALTER TABLE "auth"."chat_conversations" ADD CONSTRAINT "chat_conversations_bankStatementId_fkey" FOREIGN KEY ("bankStatementId") REFERENCES "auth"."bank_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
