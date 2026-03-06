export type BackendRole = "RESIDENT" | "STAFF" | "ADMIN" | "SUPER_ADMIN";

export interface SessionUser {
  id: string;
  phone: string;
  fullName: string;
  role: BackendRole;
}

export type PanelKey = "super-admin" | "hokimiyat" | "mahalla" | "resident";

const ACCESS_TOKEN_KEY = "mmbp.auth.accessToken";
const REFRESH_TOKEN_KEY = "mmbp.auth.refreshToken";
const USER_KEY = "mmbp.auth.user";
const PANEL_KEY = "mmbp.auth.panel";

const canUseStorage = () => typeof window !== "undefined";

export const getAccessToken = () => {
  if (!canUseStorage()) {
    return "";
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";
};

export const getRefreshToken = () => {
  if (!canUseStorage()) {
    return "";
  }
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? "";
};

export const getStoredPanel = (): PanelKey | "" => {
  if (!canUseStorage()) {
    return "";
  }
  const panel = localStorage.getItem(PANEL_KEY);
  if (
    panel === "super-admin" ||
    panel === "hokimiyat" ||
    panel === "mahalla" ||
    panel === "resident"
  ) {
    return panel;
  }
  return "";
};

export const getSessionUser = (): SessionUser | null => {
  if (!canUseStorage()) {
    return null;
  }

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SessionUser;
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.phone === "string" &&
      typeof parsed.fullName === "string" &&
      (parsed.role === "RESIDENT" ||
        parsed.role === "STAFF" ||
        parsed.role === "ADMIN" ||
        parsed.role === "SUPER_ADMIN")
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

export const setSession = (input: {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
  panel: PanelKey;
}) => {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, input.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, input.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(input.user));
  localStorage.setItem(PANEL_KEY, input.panel);
};

export const clearSession = () => {
  if (!canUseStorage()) {
    return;
  }
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PANEL_KEY);
};

export const panelAllowsRole = (panel: PanelKey, role: BackendRole) => {
  switch (panel) {
    case "super-admin":
      return role === "SUPER_ADMIN";
    case "hokimiyat":
      return role === "ADMIN" || role === "SUPER_ADMIN";
    case "mahalla":
      return role === "STAFF" || role === "ADMIN" || role === "SUPER_ADMIN";
    case "resident":
      return role === "RESIDENT";
    default:
      return false;
  }
};
