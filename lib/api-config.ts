// API 기본 URL 설정
export const API_BASE_URL = ""

// API URL 생성 함수
export const getApiUrl = (path: string): string => {
  return `${API_BASE_URL}${path}`
}

// API 경로 상수
export const API_PATHS = {
  // 납부자
  PAYMENT: "/api/v1/payments",
  PAYMENT_BY_ID: (id: number | string) => `/api/v1/payments/${id}`,

  // 사업
  BUSINESS: "/api/v1/payments/business",
  BUSINESS_BY_ID: (id: number | string) => `/api/v1/payments/business/${id}`,

  // 서약서
  SURVEY: "/api/v1/surveys",
  SURVEY_BY_ID: (id: number | string) => `/api/v1/surveys/${id}`,

  // 설정
  CONFIG_GOOGLE_SHEET_ID: "/api/v1/config/google_sheet_id",
  CONFIG_DEFAULT_AMOUNT: "/api/v1/config/default_amount",
  CONFIG_IS_CONFIGURED: "/api/v1/config/is_configured",

  // 대시보드
  DASHBOARD: "/api/v1/dashboard",

  // 냉장고
  FRIDGE: "/api/v1/fridge",
  FRIDGE_BY_ID: (studentId: string) => `/api/v1/fridge/${studentId}`,

  // 건물
  BUILDING: "/api/v1/buildings",
  BUILDING_BY_ID: (id: number | string) => `/api/v1/buildings/${id}`,

  // 회차
  ROUNDS: "/api/v1/rounds",
  ROUNDS_BY_ID: (id: number | string) => `/api/v1/rounds/${id}`,
  ROUNDS_FRIDGE_APPLICATIONS: (id: number | string) => `/api/v1/rounds/fridgeApplications/${id}`,

  // 관리자
  ADMINS: "/api/v1/admins",
  ADMINS_BY_ID: (id: number | string) => `/api/v1/admins/${id}`,
  ADMINS_ROLES: "/api/v1/admins/roles",

  // 인증
  AUTH_LOGOUT: "/api/v1/auth/logout",
}