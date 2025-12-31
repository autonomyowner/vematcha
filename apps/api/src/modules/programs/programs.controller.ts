import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ClerkAuthGuard, AuthenticatedUser } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('programs')
export class ProgramsController {
  constructor(private programsService: ProgramsService) {}

  @Get()
  async listPrograms() {
    return this.programsService.getActivePrograms();
  }

  @Get(':slug')
  async getProgram(@Param('slug') slug: string) {
    return this.programsService.getProgramBySlug(slug);
  }

  @UseGuards(ClerkAuthGuard)
  @Post(':slug/enroll')
  async enroll(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string) {
    return this.programsService.enrollUser(user.id, slug);
  }

  @UseGuards(ClerkAuthGuard)
  @Get('enrollments/me')
  async myEnrollments(@CurrentUser() user: AuthenticatedUser) {
    return this.programsService.getUserEnrollments(user.id);
  }

  @UseGuards(ClerkAuthGuard)
  @Get('enrollments/:programId')
  async getEnrollment(@CurrentUser() user: AuthenticatedUser, @Param('programId') programId: string) {
    return this.programsService.getEnrollmentDetails(user.id, programId);
  }

  @UseGuards(ClerkAuthGuard)
  @Post('enrollments/:programId/complete-day')
  async completeDay(@CurrentUser() user: AuthenticatedUser, @Param('programId') programId: string) {
    return this.programsService.completeCurrentDay(user.id, programId);
  }

  @UseGuards(ClerkAuthGuard)
  @Delete('enrollments/:programId')
  async unenroll(@CurrentUser() user: AuthenticatedUser, @Param('programId') programId: string) {
    return this.programsService.unenroll(user.id, programId);
  }
}
