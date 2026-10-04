export type Role = 'STUDENT' | 'COMPANY' | 'COLLEGE' | 'ADMIN';
export type PlacementStatus = 'UNPLACED' | 'PLACED' | 'OPTED_OUT';

export interface User {
  id: string;
  email: string;
  role: Role;
  status: string;
  createdAt: string;
}

export interface Education {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startDate: string;
  endDate?: string | null;
  grade?: string | null;
  isCurrent: boolean;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
}

export interface StudentSkill {
  id: string;
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  skill: Skill;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  repoUrl?: string;
  demoUrl?: string;
  startDate?: string;
  endDate?: string;
}

export interface Certification {
  id: string;
  title: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string;
  credentialUrl?: string;
}

export interface Resume {
  id: string;
  fileUrl: string;
  resumeScore?: number;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  gender?: string;
  bio?: string;
  address?: string;
  cgpa?: number;
  branch?: string;
  graduationYear?: number;
  placementStatus: PlacementStatus;
  profileCompletion: number;
  user: User;
  educations: Education[];
  skills: StudentSkill[];
  projects: Project[];
  certifications: Certification[];
  resumes: Resume[];
}

export interface RecommendedJob {
  id: string;
  title: string;
  location: string;
  jobType: string;
  salaryRange?: string;
  company: {
    name: string;
    logoUrl?: string;
  };
  jobSkills: { skill: Skill }[];
}

export interface ApplicationItem {
  id: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  status: string;
  matchScore?: number;
  submittedAt: string;
}

export interface PendingAssessment {
  id: string;
  assessmentTitle: string;
  durationMinutes: number;
  passingScore: number;
  startedAt: string;
}

export interface UpcomingInterview {
  id: string;
  jobTitle: string;
  companyName: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: string;
  meetingLink?: string;
}

export interface OfferItem {
  id: string;
  jobTitle: string;
  companyName: string;
  positionTitle: string;
  salary: string;
  joiningDate: string;
  status: string;
  offerLetterUrl?: string;
}

export interface StudentDashboardData {
  studentId: string;
  name: string;
  email: string;
  branch?: string;
  cgpa?: number;
  profileCompletion: number;
  resumeStatus: 'UPLOADED' | 'NOT_UPLOADED';
  resumeScore?: number | null;
  latestResume?: Resume | null;
  recommendedJobs: RecommendedJob[];
  recentApplications: ApplicationItem[];
  pendingAssessments: PendingAssessment[];
  upcomingInterviews: UpcomingInterview[];
  offers: OfferItem[];
}
