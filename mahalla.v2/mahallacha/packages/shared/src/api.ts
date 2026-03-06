import { clearSession, getAccessToken, type BackendRole } from "./session";

const DEFAULT_API_BASE_URL = "http://localhost:4000/api/v1";

export type LoginFlow = "super-admin" | "mahalla" | "aholi";

export interface OtpRequestResponse {
  message: string;
  otpCode?: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    fullName: string;
    role: BackendRole;
  };
}

export interface TwoFactorChallengeResponse {
  requiresTwoFactor: true;
  pendingTwoFactorToken: string;
  expiresInSeconds: number;
  twoFactorCode?: string;
}

export type VerifyOtpResponse = AuthTokensResponse | TwoFactorChallengeResponse;

export interface ApiPaginated<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

export interface ApiMahalla {
  id: string;
  name: string;
  districtId: string;
  district?: {
    id: string;
    name: string;
    regionId: string;
    region?: {
      id: string;
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiUser {
  id: string;
  phone: string;
  fullName: string;
  role: BackendRole;
  mahallaId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiAuditLog {
  id: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ApiComplaint {
  id: string;
  userId: string;
  mahallaId: string;
  category: string;
  description: string;
  status: "NEW" | "IN_PROGRESS" | "ANSWERED" | "REJECTED";
  responseText?: string | null;
  respondedAt?: string | null;
  deadlineAt: string;
  escalationFlag: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiPost {
  id: string;
  title: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishDate?: string | null;
  mahallaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiRating {
  id: string;
  reportId: string;
  userId: string;
  score: number;
  verdict: "TRUTH" | "SUSPICIOUS" | "FALSE";
  comment?: string | null;
  createdAt: string;
}

export interface ApiMonthlyReport {
  id: string;
  mahallaId: string;
  month: string;
  status: "DRAFT" | "SUBMITTED";
  summary: string;
  submittedById: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    workName: string;
    workDate: string;
    resultText: string;
  }>;
  ratings?: ApiRating[];
}

export interface DashboardSummaryResponse {
  totalComplaints: number;
  answeredComplaints: number;
  complaintResolutionRate: number;
  slaBreaches: number;
  slaCompliance: number;
  averageMonthlyRating: number;
  averageResponseHours: number;
  outsideAreaMinutes: number;
  overallScore: number;
}

export interface DashboardChartsResponse {
  ratingLine: Array<{ month: string; value: number }>;
  complaintsByCategory: Array<{ category: string; value: number }>;
  outsideAreaHeatmap: Array<{ date: string; value: number }>;
}

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const getApiBaseUrl = () => {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const base = fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_API_BASE_URL;
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

const parseApiErrorMessage = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const message = (payload as { message?: string | string[] }).message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  if (Array.isArray(message) && message.length > 0) {
    return message.join(", ");
  }

  return fallback;
};

const buildQueryString = (
  query?: Record<string, string | number | undefined | null>
) => {
  if (!query) {
    return "";
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

const apiRequest = async <T>(
  path: string,
  options?: RequestInit & {
    auth?: boolean;
    query?: Record<string, string | number | undefined | null>;
  }
): Promise<T> => {
  const authRequired = Boolean(options?.auth);
  const token = authRequired ? getAccessToken() : "";

  if (authRequired && !token) {
    throw new ApiError("Sessiya topilmadi. Qayta login qiling.", 401, null);
  }

  const response = await fetch(
    `${getApiBaseUrl()}${path}${buildQueryString(options?.query)}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authRequired ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers ?? {}),
      },
      cache: "no-store",
    }
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (authRequired && response.status === 401) {
      clearSession();
    }
    throw new ApiError(
      parseApiErrorMessage(payload, `Request failed (${response.status})`),
      response.status,
      payload
    );
  }

  return payload as T;
};

const endpointPrefixByFlow: Record<LoginFlow, string> = {
  "super-admin": "super-admin",
  mahalla: "mahalla",
  aholi: "aholi",
};

export const normalizePhone = (rawPhone: string) => {
  const digitsAndPlus = rawPhone.replace(/[^\d+]/g, "");

  if (digitsAndPlus.startsWith("+")) {
    return digitsAndPlus;
  }

  if (digitsAndPlus.startsWith("998")) {
    return `+${digitsAndPlus}`;
  }

  return digitsAndPlus;
};

export const requestLoginOtp = (flow: LoginFlow, phone: string) => {
  return apiRequest<OtpRequestResponse>(
    `/auth/${endpointPrefixByFlow[flow]}/login/otp/request`,
    {
      method: "POST",
      body: JSON.stringify({ phone: normalizePhone(phone) }),
    }
  );
};

export const verifyLoginOtp = (flow: LoginFlow, phone: string, code: string) => {
  return apiRequest<VerifyOtpResponse>(
    `/auth/${endpointPrefixByFlow[flow]}/login/otp/verify`,
    {
      method: "POST",
      body: JSON.stringify({ phone: normalizePhone(phone), code: code.trim() }),
    }
  );
};

export const verifyTwoFactor = (pendingTwoFactorToken: string, code: string) => {
  return apiRequest<AuthTokensResponse>("/auth/2fa/verify", {
    method: "POST",
    body: JSON.stringify({ pendingTwoFactorToken, code: code.trim() }),
  });
};

export const isTwoFactorChallengeResponse = (
  payload: VerifyOtpResponse
): payload is TwoFactorChallengeResponse => {
  return (
    "requiresTwoFactor" in payload &&
    payload.requiresTwoFactor === true &&
    typeof payload.pendingTwoFactorToken === "string"
  );
};

export const listUsers = (query?: {
  q?: string;
  role?: BackendRole;
  mahallaId?: string;
  page?: number;
  pageSize?: number;
}) => {
  return apiRequest<ApiPaginated<ApiUser>>("/users", { auth: true, query });
};

export const listMahallas = (query?: {
  q?: string;
  regionName?: string;
  districtName?: string;
  page?: number;
  pageSize?: number;
}) => {
  return apiRequest<ApiPaginated<ApiMahalla>>("/mahallas", {
    auth: true,
    query,
  });
};

export const listAuditLogs = (query?: {
  entityType?: string;
  entityId?: string;
  page?: number;
  pageSize?: number;
}) => {
  return apiRequest<ApiPaginated<ApiAuditLog>>("/audit-logs", {
    auth: true,
    query,
  });
};

export const getDashboardSummary = (query?: { mahallaId?: string }) => {
  return apiRequest<DashboardSummaryResponse>("/dashboard/summary", {
    auth: true,
    query,
  });
};

export const getDashboardCharts = (query?: { mahallaId?: string; months?: number }) => {
  return apiRequest<DashboardChartsResponse>("/dashboard/charts", {
    auth: true,
    query,
  });
};

export const listComplaints = (query?: {
  status?: "NEW" | "IN_PROGRESS" | "ANSWERED" | "REJECTED";
  category?: string;
  mahallaId?: string;
  page?: number;
  pageSize?: number;
}) => {
  return apiRequest<ApiPaginated<ApiComplaint>>("/complaints", {
    auth: true,
    query,
  });
};

export const listPosts = (query?: {
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  mahallaId?: string;
  page?: number;
  pageSize?: number;
}) => {
  return apiRequest<ApiPaginated<ApiPost>>("/posts", { auth: true, query });
};

export const listMonthlyReports = (query?: {
  mahallaId?: string;
  month?: string;
  page?: number;
  pageSize?: number;
}) => {
  return apiRequest<ApiPaginated<ApiMonthlyReport>>("/monthly-reports", {
    auth: true,
    query,
  });
};
