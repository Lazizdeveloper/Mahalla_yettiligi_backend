export const ApiRoutes = {
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout"
  },
  posts: {
    list: (mahallaId: string) => `/mahallas/${mahallaId}/posts`,
    create: (mahallaId: string) => `/mahallas/${mahallaId}/posts`
  },
  events: {
    list: (mahallaId: string) => `/mahallas/${mahallaId}/events`
  },
  complaints: {
    listForResident: "/complaints/me",
    create: "/complaints",
    listForMahalla: (mahallaId: string) => `/mahallas/${mahallaId}/complaints`
  },
  monthlyReports: {
    listForMahalla: (mahallaId: string) => `/mahallas/${mahallaId}/monthly-reports`,
    rate: (reportId: string) => `/monthly-reports/${reportId}/rate`
  },
  analytics: {
    mahallaOverview: (mahallaId: string) => `/analytics/mahalla/${mahallaId}/overview`,
    mahallaComplaints: (mahallaId: string) => `/analytics/mahalla/${mahallaId}/complaints`,
    mahallaWorktime: (mahallaId: string) => `/analytics/mahalla/${mahallaId}/worktime`,
    global: "/analytics/global"
  }
} as const;

