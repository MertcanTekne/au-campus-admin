export type UserRole = "student" | "academic" | "academic_pending" | "admin";

export type PanelRole = Extract<UserRole, "admin" | "academic">;

export type AdminSection = "dashboard" | "users" | "approvals" | "classes";

export type PanelUser = {
  uid: string;
  email: string;
  role: PanelRole;
};

export type AdminUser = {
  uid: string;
  email: string;
  displayName?: string;
  name?: string;
  role?: UserRole | string;
  createdAt?: unknown;
};

export type DashboardStats = {
  totalUsers: number;
  studentCount: number;
  academicCount: number;
  pendingAcademicCount: number;
  adminCount: number;
  totalClasses: number;
};

export type AcademicDashboardStats = {
  ownClassCount: number;
  activeClassCount: number;
  totalAnnouncementCount: number;
  totalMaterialCount: number;
};

export type CampusClass = {
  id: string;
  className?: string;
  courseCode?: string;
  section?: string;
  term?: string;
  description?: string;
  instructorUid?: string;
  instructorEmail?: string;
  joinCode?: string;
  isActive?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ClassAnnouncement = {
  id: string;
  title?: string;
  content?: string;
  authorUid?: string;
  authorEmail?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ClassMaterial = {
  id: string;
  title?: string;
  type?: "text" | "link" | string;
  content?: string;
  url?: string;
  authorUid?: string;
  authorEmail?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ClassDetail = {
  announcements: ClassAnnouncement[];
  materials: ClassMaterial[];
  memberCount: number;
};

export type CreateClassInput = {
  className: string;
  courseCode: string;
  section: string;
  term: string;
  description: string;
  instructorUid: string;
  instructorEmail: string;
  isActive: boolean;
};

export type AuthorInfo = {
  authorUid: string;
  authorEmail: string;
};

export const USER_ROLES: UserRole[] = ["student", "academic", "academic_pending", "admin"];

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Öğrenci",
  academic: "Akademik",
  academic_pending: "Akademik onay bekliyor",
  admin: "Admin",
};
