import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as PDFDocument from 'pdfkit';
import * as nodemailer from 'nodemailer';

interface BiasAggregate {
  name: string;
  count: number;
  avgIntensity: number;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.initializeEmailTransport();
  }

  private initializeEmailTransport() {
    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpUser = this.config.get<string>('SMTP_USER');
    const smtpPass = this.config.get<string>('SMTP_PASS');

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: 587,
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log('Email transport initialized');
    } else {
      this.logger.warn('Email transport not configured - reports will be generated but not sent');
    }
  }

  // Run every Sunday at 9 AM UTC
  @Cron('0 9 * * 0')
  async generateWeeklyReports() {
    this.logger.log('Starting weekly report generation...');

    const proUsers = await this.prisma.user.findMany({
      where: { tier: 'PRO' },
    });

    this.logger.log(`Generating reports for ${proUsers.length} Pro users`);

    for (const user of proUsers) {
      try {
        await this.generateReportForUser(user.id);
      } catch (err) {
        this.logger.error(`Failed to generate report for ${user.id}:`, err);
      }
    }

    this.logger.log('Weekly report generation complete');
  }

  async generateReportForUser(userId: string) {
    const weekEnd = new Date();
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Gather week's data
    const [conversations, user, streak] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          userId,
          updatedAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.userStreak.findUnique({ where: { userId } }),
    ]);

    // Aggregate biases
    const biasMap = new Map<string, { count: number; totalIntensity: number }>();
    conversations.forEach(c => {
      const biases = (c.biases as Array<{ name: string; confidence?: number; intensity?: number }>) || [];
      biases.forEach(b => {
        const existing = biasMap.get(b.name) || { count: 0, totalIntensity: 0 };
        biasMap.set(b.name, {
          count: existing.count + 1,
          totalIntensity: existing.totalIntensity + ((b.confidence || 0) * 100 || b.intensity || 50),
        });
      });
    });

    const topBiases: BiasAggregate[] = Array.from(biasMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgIntensity: Math.round(data.totalIntensity / data.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate PDF
    const pdfBuffer = await this.generatePDF({
      userName: user?.firstName || 'User',
      weekStart,
      weekEnd,
      conversationCount: conversations.length,
      topBiases,
      currentStreak: streak?.currentStreak || 0,
    });

    // For now, store as base64 (in production, upload to R2/S3)
    const fileUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

    // Save record
    const report = await this.prisma.weeklyReport.create({
      data: {
        userId,
        weekStart,
        weekEnd,
        fileUrl,
      },
    });

    // Send email if configured
    if (this.transporter && user?.email) {
      try {
        await this.sendReportEmail(user.email, user.firstName, pdfBuffer);
        await this.prisma.weeklyReport.update({
          where: { id: report.id },
          data: { emailSentAt: new Date() },
        });
        this.logger.log(`Report email sent to ${user.email}`);
      } catch (err) {
        this.logger.error(`Failed to send email to ${user.email}:`, err);
      }
    }

    return report;
  }

  private async generatePDF(data: {
    userName: string;
    weekStart: Date;
    weekEnd: Date;
    conversationCount: number;
    topBiases: BiasAggregate[];
    currentStreak: number;
  }): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24).fillColor('#4A7C59').text('Matcha Weekly Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).fillColor('#666')
        .text(`${data.weekStart.toLocaleDateString()} - ${data.weekEnd.toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Greeting
      doc.fontSize(16).fillColor('#333').text(`Hello ${data.userName},`);
      doc.moveDown();
      doc.fontSize(11).fillColor('#555')
        .text('Here\'s your psychological insights summary for the past week.');
      doc.moveDown(2);

      // Stats
      doc.fontSize(14).fillColor('#4A7C59').text('Weekly Overview');
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#333')
        .text(`Sessions: ${data.conversationCount}`)
        .text(`Current Streak: ${data.currentStreak} days`);
      doc.moveDown(2);

      // Top Biases
      if (data.topBiases.length > 0) {
        doc.fontSize(14).fillColor('#4A7C59').text('Top Cognitive Patterns Detected');
        doc.moveDown(0.5);
        data.topBiases.forEach((bias, i) => {
          doc.fontSize(11).fillColor('#333')
            .text(`${i + 1}. ${bias.name} - ${bias.count}x (avg intensity: ${bias.avgIntensity}%)`);
        });
      } else {
        doc.fontSize(11).fillColor('#666')
          .text('No cognitive patterns detected this week. Keep chatting to build your profile!');
      }

      doc.moveDown(2);
      doc.fontSize(10).fillColor('#999')
        .text('Generated by Matcha - Your AI Psychological Companion', { align: 'center' });

      doc.end();
    });
  }

  private async sendReportEmail(email: string, name: string | null, pdfBuffer: Buffer) {
    if (!this.transporter) return;

    await this.transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM') || 'Matcha <noreply@matcha.ai>',
      to: email,
      subject: `Your Matcha Weekly Insights - ${new Date().toLocaleDateString()}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4A7C59;">Your Weekly Mind Report</h1>
          <p>Hi ${name || 'there'},</p>
          <p>Your weekly psychological insights report is ready. This summary shows your cognitive patterns and progress from the past 7 days.</p>
          <p style="color: #666; font-size: 14px;">Keep up the self-awareness journey!</p>
          <p style="color: #999; font-size: 12px;">- The Matcha Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `matcha-weekly-report-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  async getUserReports(userId: string, limit = 10) {
    return this.prisma.weeklyReport.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
      take: limit,
    });
  }

  async getReportById(userId: string, reportId: string) {
    return this.prisma.weeklyReport.findFirst({
      where: { id: reportId, userId },
    });
  }

  // Manual trigger for testing
  async triggerReportGeneration(userId: string) {
    return this.generateReportForUser(userId);
  }
}
