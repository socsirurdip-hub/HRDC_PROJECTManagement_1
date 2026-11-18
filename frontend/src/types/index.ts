// ============================================================
// CSIR-HRDC Training Portal - TypeScript Type Definitions
// ============================================================

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'viewer';
  department?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface TrainingProgram {
  _id: string;
  programCode: string;
  title: string;
  description?: string;
  category: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  venue?: string;
  state?: string;
  district?: string;
  startDate: string;
  endDate: string;
  durationDays?: number;
  coordinatorName?: string;
  coordinatorEmail?: string;
  targetAudience?: string;
  maxParticipants: number;
  status: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Postponed';
  outcomes?: string;
  createdBy?: { name: string; email: string };
  enrolledCount: number;
  completedCount: number;
  completionRate?: number;
  allowNominations?: boolean;
  nominationStartDate?: string;
  nominationEndDate?: string;
  nominationsCount?: number;
  hasBatches?: boolean;
  batchesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TraineeAddress {
  street?: string;
  city?: string;
  district?: string;
  state: string;
  pincode?: string;
}

export interface Trainee {
  _id: string;
  traineeId: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  dateOfBirth?: string;
  gender: 'Male' | 'Female' | 'Transgender' | 'Other' | 'Prefer not to say';
  socialCategory: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
  isMinority: boolean;
  isPWD: boolean;
  pwdType?: string;
  domicileType: 'Rural' | 'Urban' | 'Semi-Urban';
  email: string;
  phone: string;
  alternatePhone?: string;
  address: TraineeAddress;
  highestQualification: string;
  specialization?: string;
  institution?: string;
  employmentStatus: string;
  organization?: string;
  designation?: string;
  employeeId?: string;
  registrationType?: 'SELF' | 'ADMIN_ENTRY';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  domainWarning?: boolean;
  domainWarningDetails?: string;
  approvedBy?: { _id: string; name: string; email: string };
  approvedAt?: string;
  rejectionReason?: string;
  activeNominations?: Array<{
    _id: string;
    programId?: string;
    programCode?: string;
    programTitle?: string;
    status: 'INVITED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'WAITLISTED';
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface WillingnessDetails {
  statementOfPurpose?: string;
  reportingOfficerName?: string;
  reportingOfficerDesignation?: string;
  reportingOfficerEmail?: string;
  accommodationRequired?: boolean;
  specialAssistance?: string;
  submittedAt?: string;
}

export interface Nomination {
  _id: string;
  program: TrainingProgram | string;
  trainee: Trainee;
  status: 'INVITED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'WAITLISTED';
  invitationDetails?: {
    invitedBy?: { _id: string; name: string; email: string };
    invitedAt?: string;
    channel?: 'DIRECT_SELECT' | 'CRITERIA_BROADCAST' | 'OPEN_LINK';
    targetCriteria?: {
      organization?: string;
      designation?: string;
      state?: string;
    };
  };
  willingnessDetails?: WillingnessDetails;
  assignedBatch?: Batch | string;
  mappedEnrollment?: string;
  reviewedBy?: { _id: string; name: string; email: string };
  reviewedAt?: string;
  rejectionReason?: string;
  submittedAt?: string;
  createdAt?: string;
}

export interface TraineeFilterOptions {
  organizations: string[];
  designations: string[];
  states: string[];
}

export interface Batch {
  _id: string;
  program: string;
  batchCode: string;
  batchName: string;
  startDate: string;
  endDate: string;
  durationDays?: number;
  maxCapacity: number;
  assignedCount: number;
  venueOrMeetingLink?: string;
  coordinatorInCharge?: string;
  status: 'Scheduled' | 'Active' | 'Completed' | 'Cancelled';
  createdBy?: { _id: string; name: string; email: string };
  enrollments?: Enrollment[];
  createdAt: string;
}

export interface FeedbackData {
  overallRating?: number;
  contentRating?: number;
  trainerRating?: number;
  venueRating?: number;
  comments?: string;
  wouldRecommend?: boolean;
  submittedAt?: string;
}

export interface Enrollment {
  _id: string;
  program: TrainingProgram | string;
  trainee: Trainee | string;
  enrollmentDate: string;
  attendancePercentage: number;
  completionStatus: 'Enrolled' | 'Attending' | 'Completed' | 'Dropped' | 'Absent';
  certificateIssued: boolean;
  certificateNumber?: string;
  preTestScore?: number;
  postTestScore?: number;
  feedback?: FeedbackData;
  registeredBy?: string;
  batch?: Batch | string;
  nomination?: Nomination | string;
  scoreImprovement?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  _id: string;
  user?: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED';
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  total: number;
  page: number;
  pages: number;
  data: T[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Dashboard Analytics Types
export interface DashboardSummary {
  totalPrograms: number;
  totalTrainees: number;
  totalEnrollments: number;
  totalUsers: number;
  completedPrograms: number;
  uniqueTraineesThisYear: number;
}

export interface StatBreakdown {
  _id: string;
  count: number;
  totalEnrolled?: number;
}

export interface MonthlyTrend {
  _id: { year: number; month: number };
  enrollments: number;
  completions: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  programsByStatus: StatBreakdown[];
  genderBreakdown: StatBreakdown[];
  categoryBreakdown: StatBreakdown[];
  stateDistribution: StatBreakdown[];
  recentPrograms: TrainingProgram[];
  monthlyTrend: MonthlyTrend[];
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface ProgramFormData {
  programCode: string;
  title: string;
  description?: string;
  category: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  venue?: string;
  state?: string;
  district?: string;
  startDate: string;
  endDate: string;
  coordinatorName?: string;
  coordinatorEmail?: string;
  targetAudience?: string;
  maxParticipants: number;
  status: string;
  outcomes?: string;
  allowNominations?: boolean;
  nominationStartDate?: string;
  nominationEndDate?: string;
  hasBatches?: boolean;
}

export interface TraineeFormData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender: string;
  socialCategory: string;
  isMinority: boolean;
  isPWD: boolean;
  pwdType?: string;
  domicileType: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  'address.street'?: string;
  'address.city'?: string;
  'address.district'?: string;
  'address.state': string;
  'address.pincode'?: string;
  highestQualification: string;
  specialization?: string;
  institution?: string;
  employmentStatus: string;
  organization?: string;
  designation?: string;
}
