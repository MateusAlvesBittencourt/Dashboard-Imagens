import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const gmailRouter = router({
  /**
   * Conectar conta do Gmail via OAuth
   * Este procedimento retorna a URL de autenticação do Gmail
   */
  getAuthUrl: protectedProcedure.query(() => {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const redirectUri = process.env.GMAIL_REDIRECT_URI || "http://localhost:3000/api/gmail/callback";
    const scope = "https://www.googleapis.com/auth/gmail.send";

    if (!clientId) {
      throw new Error("Gmail Client ID não configurado");
    }

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", scope);
    authUrl.searchParams.append("access_type", "offline");
    authUrl.searchParams.append("prompt", "consent");

    return {
      authUrl: authUrl.toString(),
    };
  }),

  /**
   * Enviar email via Gmail
   */
  sendEmail: protectedProcedure
    .input(z.object({
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
      htmlBody: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Implementar envio de email via Gmail API
        // Por enquanto, retornar sucesso simulado
        return {
          success: true,
          message: "Email seria enviado para: " + input.to,
          subject: input.subject,
        };
      } catch (error) {
        throw new Error(`Erro ao enviar email: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      }
    }),

  /**
   * Enviar notificação para unidade acadêmica
   */
  sendNotificationToUnit: protectedProcedure
    .input(z.object({
      unitId: z.number(),
      unitEmail: z.string().email(),
      unitName: z.string(),
      subject: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const htmlBody = `
          <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
              <h2>Notificação - Dashboard Imagens 2026</h2>
              <p>Olá,</p>
              <p>Você recebeu uma notificação relacionada à unidade <strong>${input.unitName}</strong>:</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #3b82f6;">
                <p>${input.message}</p>
              </div>
              <p>Acesse o dashboard para mais informações: <a href="https://dashboard.example.com">Acessar Dashboard</a></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">Este é um email automático. Não responda a este email.</p>
            </body>
          </html>
        `;

        // TODO: Implementar envio via Gmail API
        return {
          success: true,
          message: `Notificação seria enviada para ${input.unitEmail}`,
          unitId: input.unitId,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        throw new Error(`Erro ao enviar notificação: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      }
    }),

  /**
   * Enviar relatório para unidade acadêmica
   */
  sendReport: protectedProcedure
    .input(z.object({
      unitId: z.number(),
      unitEmail: z.string().email(),
      unitName: z.string(),
      reportType: z.enum(["cronograma", "laboratorios", "softwares", "completo"]),
    }))
    .mutation(async ({ input }) => {
      try {
        const reportTitles = {
          cronograma: "Relatório de Cronograma",
          laboratorios: "Relatório de Laboratórios",
          softwares: "Relatório de Softwares",
          completo: "Relatório Completo",
        };

        const htmlBody = `
          <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
              <h2>${reportTitles[input.reportType]} - Dashboard Imagens 2026</h2>
              <p>Prezado(a),</p>
              <p>Segue em anexo o ${reportTitles[input.reportType].toLowerCase()} solicitado para a unidade <strong>${input.unitName}</strong>.</p>
              <p>Caso tenha dúvidas ou necessite de informações adicionais, entre em contato conosco.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">Este é um email automático. Não responda a este email.</p>
            </body>
          </html>
        `;

        // TODO: Implementar geração de PDF e envio via Gmail API
        return {
          success: true,
          message: `Relatório ${input.reportType} seria enviado para ${input.unitEmail}`,
          unitId: input.unitId,
          reportType: input.reportType,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        throw new Error(`Erro ao enviar relatório: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      }
    }),

  /**
   * Agendar envio de email
   */
  scheduleEmail: protectedProcedure
    .input(z.object({
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
      scheduledFor: z.date(),
    }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Implementar agendamento de email
        return {
          success: true,
          message: `Email agendado para ${input.scheduledFor.toISOString()}`,
          to: input.to,
          subject: input.subject,
        };
      } catch (error) {
        throw new Error(`Erro ao agendar email: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      }
    }),
});
