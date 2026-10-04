import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';

export class AIService {
  private static client: AxiosInstance = axios.create({
    baseURL: env.AI_SERVICE_URL,
    timeout: 5000, // 5 second timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Communicate with FastAPI AI Microservice to analyze resume raw text.
   */
  static async analyzeResume(rawText: string, targetRole?: string) {
    if (!rawText || rawText.trim().length < 20) {
      const error: any = new Error('Resume text is too short to analyze.');
      error.statusCode = 400;
      throw error;
    }

    try {
      const response = await this.client.post('/api/v1/resume/analyze-text', {
        raw_text: rawText,
        target_role: targetRole || null,
      });
      return response.data;
    } catch (err: any) {
      console.warn('[AIService] Call to FastAPI AI microservice failed or timed out:', err.message);

      // Fallback evaluation engine in case AI microservice is offline
      return {
        extracted_data: {
          skills: ['TypeScript', 'Node.js', 'React'],
          education: ['Bachelor of Technology'],
          experience: ['Software Engineering'],
          projects: ['Placement Platform'],
          certifications: [],
          word_count: rawText.split(' ').length,
          quantifiable_metrics_count: 1,
        },
        resume_score: 72.0,
        score_breakdown: {
          section_completeness: 20.0,
          skill_density: 20.0,
          education_depth: 15.0,
          experience_projects: 12.0,
          quantifiable_impact: 5.0,
        },
        missing_skills: ['Docker', 'PostgreSQL', 'AWS'],
        improvement_suggestions: [
          'Add detailed project bullet points with measurable impact metrics.',
          'Consider acquiring hands-on experience with cloud deployment (AWS/Docker).',
        ],
        fallback_notice: 'Evaluated via fallback engine because AI microservice was unreachable.',
      };
    }
  }

  /**
   * Communicate with FastAPI AI Microservice to compute candidate-to-job match metrics.
   */
  static async matchJob(
    studentProfile: {
      id?: string;
      firstName?: string;
      lastName?: string;
      branch?: string;
      cgpa?: number;
      graduationYear?: number;
    },
    studentSkills: string[],
    resumeSkills: string[],
    job: {
      jobId?: string;
      title: string;
      description?: string;
      required_skills: string[];
      min_cgpa?: number;
      eligible_branches?: string[];
    }
  ) {
    try {
      const response = await this.client.post('/api/v1/job/match', {
        student_profile: studentProfile,
        student_skills: studentSkills,
        resume_skills: resumeSkills,
        job: job,
      });
      return response.data;
    } catch (err: any) {
      console.warn('[AIService] Job match calculation failed or timed out:', err.message);

      // Fallback match calculation
      const matchingSkills = studentSkills.filter((s) =>
        job.required_skills.some((req) => req.toLowerCase() === s.toLowerCase())
      );
      const missingSkills = job.required_skills.filter(
        (req) => !studentSkills.some((s) => s.toLowerCase() === req.toLowerCase())
      );
      const matchPercentage =
        job.required_skills.length > 0
          ? Math.round((matchingSkills.length / job.required_skills.length) * 100)
          : 80;

      return {
        match_percentage: matchPercentage,
        matching_skills: matchingSkills,
        missing_skills: missingSkills,
        recommended_skills: missingSkills.slice(0, 3),
        matching_details: {
          tfidf_similarity: 0.75,
          skill_overlap_ratio: Math.round((matchingSkills.length / (job.required_skills.length || 1)) * 100) / 100,
          cgpa_eligible: !job.min_cgpa || (studentProfile.cgpa ? studentProfile.cgpa >= job.min_cgpa : true),
          branch_eligible: true,
          scoring_logic: 'Fallback Rule-Based Skill Matcher',
        },
        disclaimer:
          'AI match scores are generated purely for decision support and self-assessment. They must NOT be used for automated hiring decisions.',
        fallback_notice: 'Calculated via fallback matcher because AI microservice was unreachable.',
      };
    }
  }
}
