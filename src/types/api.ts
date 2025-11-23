// API response types will be defined here

// Base API response structure
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  timestamp: string;
}

// Dashboard Statistics Types
export interface DashboardStats {
  applications: {
    count: number;
    trend: number[];
    subtitle?: string;
  };
  interviews: {
    count: number;
    trend: number[];
    subtitle?: string;
  };
  hired: {
    count: number;
    trend: number[];
    subtitle?: string;
  };
}

// Individual stat item
export interface StatItem {
  count: number;
  trend?: number[];
  subtitle?: string;
  changePercent?: number;
  changeDirection?: 'up' | 'down' | 'neutral';
}

// Error response structure
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Authentication Types
export interface AuthLoginRequest {
  identifier: string; // email or username
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: 'USER' | 'ADMIN' | string;
  isActive?: boolean;
  avatar?: string | null;
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string | number; // e.g. "15m" or ms
}

export interface AuthLoginResponseData {
  user: AuthUser;
  tokens: AuthTokens;
}

// User profile update request (optional fields)
export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  bio?: string; // max 500 chars (validated server-side)
  website?: string; // URL
  location?: string; // max 100 chars
  avatar?: string; // URL
}

// Change password request
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Change password response (normalized)
export interface ChangePasswordResponse {
  message: string;
}

// Pagination structure
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Calendar and Interview Types
export interface CalendarEvent {
  id: string;
  date: string; // ISO date string
  type: 'interview' | 'deadline' | 'meeting';
  title?: string;
}

export interface Interview {
  id: string;
  candidate: {
    name: string;
    avatar?: string;
    role: string;
  };
  timeSlot: {
    start: string; // ISO datetime string
    end: string; // ISO datetime string
  };
  status: 'scheduled' | 'completed' | 'cancelled';
}

// Hiring Sources Analytics Types
export interface HiringSource {
  id: string;
  source: string; // 'Direct', 'Dribbble', 'LinkedIn', etc.
  value: number; // 0-100 scale
  category: 'design' | 'engineering' | 'marketing';
  color?: string;
}

export interface HiringSourcesData {
  sources: HiringSource[];
  categories: {
    design: { label: string; color: string };
    engineering: { label: string; color: string };
    marketing: { label: string; color: string };
  };
  lastUpdated: string;
}

// Job Management Types
export interface Job {
  id: string;
  title: string;
  applicationCount: number;
  datePosted: string; // ISO date string
  status: 'active' | 'paused' | 'closed';
  department?: string;
  location?: string;
  type?: 'full-time' | 'part-time' | 'contract' | 'internship';
  description?: string;
  requirements?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JobsListResponse extends PaginatedResponse<Job> {}

export interface JobAction {
  type: 'edit' | 'pause' | 'resume' | 'close' | 'delete' | 'duplicate';
  label: string;
  icon?: string;
  variant?: 'default' | 'destructive';
}

// Job sorting and filtering
export type JobSortField =
  | 'title'
  | 'applicationCount'
  | 'datePosted'
  | 'status';
export type SortDirection = 'asc' | 'desc';

export interface JobsFilters {
  status?: Job['status'][];
  department?: string[];
  type?: Job['type'][];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface JobsSortConfig {
  field: JobSortField;
  direction: SortDirection;
}

// User Plan and Upgrade Types
export interface UserPlan {
  id: string;
  name: string;
  type: 'free' | 'pro' | 'enterprise';
  features: string[];
  limits: {
    jobPostings: number;
    candidates: number;
    analytics: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
  };
  price?: {
    monthly: number;
    yearly: number;
  };
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpgradeRequest {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  paymentMethodId?: string;
}

export interface UpgradeResponse {
  subscription: UserSubscription;
  plan: UserPlan;
  paymentIntent?: {
    id: string;
    clientSecret: string;
    status: string;
  };
}

export interface UpgradeAnalytics {
  event:
    | 'upgrade_viewed'
    | 'upgrade_clicked'
    | 'upgrade_completed'
    | 'upgrade_cancelled';
  planId?: string;
  source: 'dashboard_card' | 'header_badge' | 'settings_page';
  timestamp: string;
}

// Admin Blog Types
export type BlogPostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  slug?: string;
  status: BlogPostStatus;
  tags: string[];
  imageUrl?: string;
  readingTime?: number;
  likes?: number;
  views?: number;
  metaTitle?: string;
  metaDescription?: string;
  authorId?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface BlogPostQuery {
  page?: number;
  limit?: number;
  status?: BlogPostStatus;
  authorId?: string;
  tags?: string[];
  search?: string;
  sortBy?:
    | 'createdAt'
    | 'updatedAt'
    | 'title'
    | 'publishedAt'
    | 'likes'
    | 'views'
    | 'readingTime';
  sortOrder?: 'asc' | 'desc';
}

// Admin Comment Types
export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';
export interface Comment {
  id: string;
  postId: string;
  authorName: string;
  authorEmail: string;
  authorUrl?: string;
  content: string;
  status: CommentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommentQuery {
  page?: number;
  limit?: number;
  status?: CommentStatus;
  postId?: string;
  authorEmail?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'authorName' | 'authorEmail';
  sortOrder?: 'asc' | 'desc';
}

// Admin Contact Types
export type ContactStatus = 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED';
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  phone?: string;
  company?: string;
  website?: string;
  budget?: string;
  timeline?: string;
  status: ContactStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactQuery {
  page?: number;
  limit?: number;
  status?: ContactStatus;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'email' | 'status';
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
}

// Project Management Types
export type ProjectStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Project {
  id: string;
  title: string;
  description: string;
  content?: string;
  slug?: string;
  status: ProjectStatus;
  technologies: string[]; // at least 1 required on create
  featured?: boolean;
  githubUrl?: string; // URL
  liveUrl?: string; // URL
  imageUrl?: string; // primary image URL
  images?: string[]; // additional images URLs
  metaTitle?: string; // up to 60 chars
  metaDescription?: string; // up to 160 chars
  ownerId?: string; // project owner (for RBAC)
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface ProjectQuery {
  page?: number;
  limit?: number;
  status?: ProjectStatus;
  ownerId?: string;
  technologies?: string[]; // CSV on server
  search?: string;
  featured?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'publishedAt' | 'featured';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  technologies: string[]; // min 1
  content?: string;
  slug?: string;
  status?: ProjectStatus; // default DRAFT
  featured?: boolean;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  images?: string[];
  metaTitle?: string; // <= 60 chars
  metaDescription?: string; // <= 160 chars
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  technologies?: string[];
  content?: string;
  slug?: string;
  status?: ProjectStatus;
  featured?: boolean;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  images?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface Image {
  externalId: string;
  publicId: string;
  secureUrl?: string;
  url?: string;
  filename: string;
  size: number;
  mimetype: string;
  width?: number;
  height?: number;
}

export interface ImageUploadResponse {
  image: Image;
}

export interface ImageQuery {
  page?: number;
  limit?: number;
  uploader?: string;
  format?: string;
  mimetype?: string;
}

export type EntityType = 'USER' | 'PROJECT' | 'BLOG' | string;

export interface ImageAttachment {
  id: string;
  imageExternalId: string;
  entityType: EntityType;
  entityId: string;
  role?: string;
  order?: number;
  createdAt?: string;
}
