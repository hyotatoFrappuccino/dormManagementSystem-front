export interface Round {
  id: number
  name: string
  startDate: string
  endDate: string
  password: string
}

export interface Building {
  id: number
  name: string
  type: "ALL" | "REFRIGERATOR" | "FREEZER" | "COMBINED"
  fridgeSlots: number
  freezerSlots: number
  integratedSlots: number
  fridgeUsage?: number
  freezerUsage?: number
  integratedUsage?: number
}

export interface DashboardData {
  totalPayers: number
  buildings: Building[]
}

export interface StudentInfo {
  name: string
  isPaid: "PAID" | "REFUNDED" | "NONE"
  isAgreed: boolean
  building: string
  roomNumber: string
}

export interface FridgeApplication {
  id: number
  roundId: number
  type: "REFRIGERATOR" | "FREEZER" | "COMBINED"
  round?: Round
  roundName?: string
  appliedAt?: string
}

export interface AdminRole {
  key: string
  title: string
}

export interface Administrator {
  id: number
  name: string
  email: string
  role: AdminRole["key"] // 내부적으로는 key 값을 사용
  createdAt?: string
  creationDate?: string
}

export interface Member {
  id: number
  studentId: string
  name: string
  phone: string
  buildingName: string
  roomNumber: string
  paymentStatus?: string
  warningCount: number
}

export interface GroupedApplication {
  member: Member
  applications: Record<number, FridgeApplication | null>
  rounds: Round[]
}

export interface Consent {
  id: number
  dateTime: string
  studentId: string
  name: string
  phoneNumber: string
  buildingName: string
  roomNumber: string
  agreed: boolean
}

export interface FridgeApplicationResponse {
  id: number
  studentId: string
  name: string
  phone: string
  buildingName: string
  roomNumber: string
  warningCount: number
  fridgeApplications: FridgeApplication[]
}

export interface Business {
  id: number
  name: string
}

export interface BusinessParticipation {
  id: number
  businessId: number
}

export interface Payer {
  id: number
  name: string
  amount: number
  date: string | null
  status: "PAID" | "REFUNDED"
  type: "BANK_TRANSFER" | "ON_SITE"
  businessParticipations?: BusinessParticipation[]
}