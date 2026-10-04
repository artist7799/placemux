import { prisma } from '../config/prisma';
import { QuestionType, AssessmentSessionStatus, ApplicationStatus } from '@prisma/client';

export class AssessmentService {
  static async createAssessment(userId: string, data: any) {
    const company = await prisma.company.findUnique({ where: { userId } });

    return prisma.assessment.create({
      data: {
        title: data.title,
        description: data.description,
        durationMinutes: data.durationMinutes || 60,
        passingScore: data.passingScore || 60.0,
        jobId: data.jobId || null,
      },
      include: {
        job: { select: { id: true, title: true } },
        questions: { include: { question: true } },
      },
    });
  }

  static async createQuestion(data: any) {
    return prisma.question.create({
      data: {
        type: data.type,
        prompt: data.prompt,
        options: data.options || null,
        correctAnswer: data.correctAnswer,
        points: data.points || 1.0,
      },
    });
  }

  static async addQuestionToAssessment(assessmentId: string, questionId: string, order: number = 0) {
    return prisma.assessmentQuestion.create({
      data: {
        assessmentId,
        questionId,
        order,
      },
      include: { question: true },
    });
  }

  static async createFullAssessmentWithQuestions(userId: string, data: any) {
    const { title, description, durationMinutes, passingScore, jobId, questions } = data;

    return prisma.$transaction(async (tx) => {
      const assessment = await tx.assessment.create({
        data: {
          title,
          description,
          durationMinutes: durationMinutes || 60,
          passingScore: passingScore || 60.0,
          jobId: jobId || null,
        },
      });

      if (questions && Array.isArray(questions)) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const createdQ = await tx.question.create({
            data: {
              type: q.type as QuestionType,
              prompt: q.prompt,
              options: q.options || null,
              correctAnswer: q.correctAnswer,
              points: q.points || 1.0,
            },
          });
          await tx.assessmentQuestion.create({
            data: {
              assessmentId: assessment.id,
              questionId: createdQ.id,
              order: i,
            },
          });
        }
      }

      return tx.assessment.findUnique({
        where: { id: assessment.id },
        include: {
          job: { select: { id: true, title: true } },
          questions: { include: { question: true }, orderBy: { order: 'asc' } },
        },
      });
    });
  }

  static async getAssignedAssessments(studentUserId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      include: {
        applications: { select: { jobId: true } },
      },
    });

    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    const jobIds = student.applications.map((app) => app.jobId);

    const assessments = await prisma.assessment.findMany({
      where: {
        OR: [{ jobId: { in: jobIds } }, { jobId: null }],
      },
      include: {
        job: { select: { title: true, company: { select: { name: true } } } },
        _count: { select: { questions: true } },
        sessions: {
          where: { studentId: student.id },
          select: { id: true, status: true, totalScore: true, startedAt: true, submittedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assessments.map((assessment) => {
      const userSession = assessment.sessions.length > 0 ? assessment.sessions[0] : null;
      return {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        durationMinutes: assessment.durationMinutes,
        passingScore: assessment.passingScore,
        questionCount: assessment._count.questions,
        jobTitle: assessment.job?.title,
        companyName: assessment.job?.company?.name,
        sessionStatus: userSession ? userSession.status : 'NOT_STARTED',
        lastSession: userSession,
      };
    });
  }

  static async startAssessmentSession(studentUserId: string, assessmentId: string) {
    const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          include: {
            question: {
              select: {
                id: true,
                type: true,
                prompt: true,
                options: true,
                points: true,
                // SECURITY: Explicitly omit correctAnswer from student payload!
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!assessment) {
      const error: any = new Error('Assessment not found');
      error.statusCode = 404;
      throw error;
    }

    // Check for existing active or completed session
    let session = await prisma.assessmentSession.findFirst({
      where: {
        assessmentId,
        studentId: student.id,
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!session || session.status === AssessmentSessionStatus.EXPIRED) {
      session = await prisma.assessmentSession.create({
        data: {
          assessmentId,
          studentId: student.id,
          status: AssessmentSessionStatus.IN_PROGRESS,
        },
      });
    }

    return {
      sessionId: session.id,
      assessmentId: assessment.id,
      title: assessment.title,
      description: assessment.description,
      durationMinutes: assessment.durationMinutes,
      startedAt: session.startedAt,
      status: session.status,
      questions: assessment.questions.map((aq) => ({
        questionId: aq.question.id,
        type: aq.question.type,
        prompt: aq.question.prompt,
        options: aq.question.options,
        points: aq.question.points,
        order: aq.order,
      })),
    };
  }

  static async submitAnswers(studentUserId: string, sessionId: string, responses: Array<{ questionId: string; answerGiven: any }>) {
    const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        assessment: {
          include: {
            questions: { include: { question: true } },
          },
        },
      },
    });

    if (!session || session.studentId !== student.id) {
      const error: any = new Error('Assessment session not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    if (session.status === AssessmentSessionStatus.COMPLETED) {
      const error: any = new Error('Assessment session has already been submitted');
      error.statusCode = 400;
      throw error;
    }

    // Time limit validation (with 2 minutes grace period)
    const durationMs = session.assessment.durationMinutes * 60 * 1000;
    const graceMs = 2 * 60 * 1000;
    const now = new Date();
    const elapsedMs = now.getTime() - new Date(session.startedAt).getTime();

    if (elapsedMs > durationMs + graceMs) {
      await prisma.assessmentSession.update({
        where: { id: sessionId },
        data: { status: AssessmentSessionStatus.EXPIRED },
      });
      const error: any = new Error('Assessment time limit has expired');
      error.statusCode = 400;
      throw error;
    }

    // Scoring calculation map
    const questionMap = new Map<string, any>();
    let maxTotalPoints = 0;
    session.assessment.questions.forEach((aq) => {
      questionMap.set(aq.question.id, aq.question);
      maxTotalPoints += aq.question.points;
    });

    let earnedPoints = 0;
    const responseRecords: any[] = [];

    for (const resp of responses) {
      const question = questionMap.get(resp.questionId);
      if (!question) continue;

      const isCorrect = this.checkAnswerCorrectness(question.type, question.correctAnswer, resp.answerGiven);
      const scoreEarned = isCorrect ? question.points : 0;
      if (isCorrect) earnedPoints += question.points;

      responseRecords.push({
        sessionId,
        questionId: question.id,
        answerGiven: resp.answerGiven,
        isCorrect,
        scoreEarned,
      });
    }

    const percentageScore = maxTotalPoints > 0 ? (earnedPoints / maxTotalPoints) * 100 : 0;
    const isPassed = percentageScore >= session.assessment.passingScore;

    return prisma.$transaction(async (tx) => {
      // Save responses
      await tx.response.deleteMany({ where: { sessionId } });
      await tx.response.createMany({ data: responseRecords });

      // Update session
      const updatedSession = await tx.assessmentSession.update({
        where: { id: sessionId },
        data: {
          submittedAt: now,
          totalScore: Math.round(percentageScore * 100) / 100,
          status: AssessmentSessionStatus.COMPLETED,
        },
      });

      // Update associated job application status if assessment is linked to a job
      if (session.assessment.jobId) {
        const application = await tx.application.findUnique({
          where: {
            jobId_studentId: {
              jobId: session.assessment.jobId,
              studentId: student.id,
            },
          },
        });

        if (application) {
          const nextStatus = isPassed ? ApplicationStatus.ASSESSMENT_PASSED : ApplicationStatus.REJECTED;
          await tx.application.update({
            where: { id: application.id },
            data: { currentStatus: nextStatus },
          });

          await tx.applicationStatusHistory.create({
            data: {
              applicationId: application.id,
              status: nextStatus,
              changedBy: studentUserId,
              remarks: `Assessment completed with ${percentageScore.toFixed(1)}% score (${isPassed ? 'PASSED' : 'FAILED'}).`,
            },
          });
        }
      }

      return {
        sessionId: updatedSession.id,
        totalScore: updatedSession.totalScore,
        earnedPoints,
        maxTotalPoints,
        percentageScore: Math.round(percentageScore * 100) / 100,
        passingScore: session.assessment.passingScore,
        isPassed,
        submittedAt: updatedSession.submittedAt,
      };
    });
  }

  static checkAnswerCorrectness(type: QuestionType, correctAnswer: any, answerGiven: any): boolean {
    if (answerGiven === undefined || answerGiven === null) return false;

    if (type === QuestionType.MCQ || type === QuestionType.APTITUDE || type === QuestionType.TECHNICAL || type === QuestionType.SQL) {
      return String(correctAnswer).trim().toLowerCase() === String(answerGiven).trim().toLowerCase();
    }

    if (type === QuestionType.MULTI_SELECT) {
      if (!Array.isArray(correctAnswer) || !Array.isArray(answerGiven)) return false;
      if (correctAnswer.length !== answerGiven.length) return false;
      const sortedCorrect = [...correctAnswer].map((s) => String(s).trim().toLowerCase()).sort();
      const sortedGiven = [...answerGiven].map((s) => String(s).trim().toLowerCase()).sort();
      return sortedCorrect.every((val, index) => val === sortedGiven[index]);
    }

    if (type === QuestionType.CODING) {
      return String(correctAnswer).trim().toLowerCase() === String(answerGiven).trim().toLowerCase();
    }

    return false;
  }

  static async getSessionResult(userId: string, role: string, sessionId: string) {
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        student: {
          include: { user: { select: { email: true } } },
        },
        assessment: {
          include: {
            questions: { include: { question: true } },
          },
        },
        responses: { include: { question: true } },
      },
    });

    if (!session) {
      const error: any = new Error('Assessment session not found');
      error.statusCode = 404;
      throw error;
    }

    if (role === 'STUDENT' && session.student.userId !== userId) {
      const error: any = new Error('Unauthorized to view this assessment result');
      error.statusCode = 403;
      throw error;
    }

    const percentageScore = session.totalScore || 0;
    const isPassed = percentageScore >= session.assessment.passingScore;

    return {
      sessionId: session.id,
      assessmentTitle: session.assessment.title,
      studentName: `${session.student.firstName} ${session.student.lastName}`.trim(),
      studentEmail: session.student.user.email,
      totalScore: percentageScore,
      passingScore: session.assessment.passingScore,
      isPassed,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
      responses: session.responses.map((r) => ({
        questionId: r.questionId,
        prompt: r.question.prompt,
        type: r.question.type,
        answerGiven: r.answerGiven,
        correctAnswer: role !== 'STUDENT' || session.status === 'COMPLETED' ? r.question.correctAnswer : undefined,
        isCorrect: r.isCorrect,
        scoreEarned: r.scoreEarned,
      })),
    };
  }

  static async getAssessmentResultsForCompany(userId: string, assessmentId: string) {
    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) {
      const error: any = new Error('Company profile not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.assessmentSession.findMany({
      where: {
        assessmentId,
        status: AssessmentSessionStatus.COMPLETED,
      },
      include: {
        student: {
          include: {
            user: { select: { email: true } },
          },
        },
        assessment: { select: { title: true, passingScore: true } },
      },
      orderBy: { totalScore: 'desc' },
    });
  }
}
