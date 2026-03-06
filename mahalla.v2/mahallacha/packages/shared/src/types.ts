export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  HOKIMIYAT = "HOKIMIYAT",
  MAHALLA_STAFF = "MAHALLA_STAFF",
  RESIDENT = "RESIDENT"
}

export enum MahallaStaffPosition {
  RAIS = "RAIS",
  YOSHLAR_YETAKCHISI = "YOSHLAR_YETAKCHISI",
  XOTIN_QIZLAR_FAOLI = "XOTIN_QIZLAR_FAOLI",
  PROFILAKTIKA_INSPEKTORI = "PROFILAKTIKA_INSPEKTORI",
  SOLIQ_VAKILI = "SOLIQ_VAKILI",
  BANDLIK_VAKILI = "BANDLIK_VAKILI",
  IJTIMOIY_HIMOYA_VAKILI = "IJTIMOIY_HIMOYA_VAKILI"
}

export interface Mahalla {
  id: string;
  name: string;
  region: string;
  district: string;
  polygonGeoJson?: unknown;
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  role: Role;
  mahallaId?: string | null;
}

export interface MahallaStaff {
  id: string;
  userId: string;
  mahallaId: string;
  position: MahallaStaffPosition;
}

export type PostStatus = "draft" | "published" | "archived";

export interface Post {
  id: string;
  title: string;
  content: string;
  mediaUrls: string[];
  createdBy: string;
  mahallaId: string;
  publishDate: string;
  status: PostStatus;
  createdAt: string;
}

export type ComplaintStatus = "new" | "in_progress" | "answered" | "rejected";

export interface Complaint {
  id: string;
  userId: string;
  mahallaId: string;
  category: string;
  description: string;
  mediaUrls: string[];
  locationGps?: { lat: number; lng: number };
  status: ComplaintStatus;
  responseText?: string;
  respondedAt?: string;
  deadlineAt: string;
  escalationFlag: boolean;
}

export interface MonthlyWorkItem {
  id: string;
  name: string;
  date: string;
  result: string;
  evidenceUrls: string[];
}

export interface MonthlyReport {
  id: string;
  month: string; // YYYY-MM
  mahallaId: string;
  items: MonthlyWorkItem[];
  summary: string;
}

export type TruthStatus = "ROST" | "SHUBHALI" | "NOTOGRI";

export interface Rating {
  id: string;
  residentId: string;
  monthlyReportId: string;
  score: 1 | 2 | 3 | 4 | 5;
  truthStatus: TruthStatus;
  comment?: string;
}

export interface Event {
  id: string;
  name: string;
  dateTime: string;
  locationGps?: { lat: number; lng: number };
  responsibleStaffId: string;
  expectedParticipants: number;
  status: "planned" | "completed" | "cancelled";
}

export interface WorkSession {
  id: string;
  staffId: string;
  checkInAt: string;
  checkOutAt?: string;
}

export interface LocationLog {
  id: string;
  staffId: string;
  timestamp: string;
  locationGps: { lat: number; lng: number };
  insidePolygon: boolean;
}

