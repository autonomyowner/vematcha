import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ProgramModule {
  day: number;
  title: string;
  content: string;
  exercise: {
    title: string;
    steps: string[];
  };
}

@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  async getActivePrograms() {
    return this.prisma.program.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        durationDays: true,
        createdAt: true,
      },
    });
  }

  async getProgramBySlug(slug: string) {
    const program = await this.prisma.program.findUnique({
      where: { slug },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    return program;
  }

  async enrollUser(userId: string, slug: string) {
    const program = await this.prisma.program.findUnique({
      where: { slug },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    // Check if already enrolled
    const existing = await this.prisma.programEnrollment.findUnique({
      where: {
        userId_programId: {
          userId,
          programId: program.id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Already enrolled in this program');
    }

    return this.prisma.programEnrollment.create({
      data: {
        userId,
        programId: program.id,
      },
      include: {
        program: true,
      },
    });
  }

  async getUserEnrollments(userId: string) {
    return this.prisma.programEnrollment.findMany({
      where: { userId },
      include: {
        program: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            durationDays: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async getEnrollmentDetails(userId: string, programId: string) {
    const enrollment = await this.prisma.programEnrollment.findUnique({
      where: {
        userId_programId: {
          userId,
          programId,
        },
      },
      include: {
        program: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const modules = enrollment.program.modules as unknown as ProgramModule[];
    const currentModule = modules.find(m => m.day === enrollment.currentDay);
    const completedDays = enrollment.completedDays as number[];

    return {
      ...enrollment,
      currentModule,
      progress: Math.round((completedDays.length / enrollment.program.durationDays) * 100),
    };
  }

  async completeCurrentDay(userId: string, programId: string) {
    const enrollment = await this.prisma.programEnrollment.findUnique({
      where: {
        userId_programId: {
          userId,
          programId,
        },
      },
      include: { program: true },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const completedDays = (enrollment.completedDays as number[]) || [];

    // Add current day to completed if not already
    if (!completedDays.includes(enrollment.currentDay)) {
      completedDays.push(enrollment.currentDay);
    }

    // Calculate next day
    const nextDay = enrollment.currentDay + 1;
    const isComplete = nextDay > enrollment.program.durationDays;

    return this.prisma.programEnrollment.update({
      where: {
        userId_programId: {
          userId,
          programId,
        },
      },
      data: {
        completedDays,
        currentDay: isComplete ? enrollment.currentDay : nextDay,
        completedAt: isComplete ? new Date() : null,
      },
      include: { program: true },
    });
  }

  async unenroll(userId: string, programId: string) {
    return this.prisma.programEnrollment.delete({
      where: {
        userId_programId: {
          userId,
          programId,
        },
      },
    });
  }
}
