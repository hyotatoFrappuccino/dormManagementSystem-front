import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Building, Round } from "@/lib/interfaces"

// cn 함수
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 환경 감지 함수
export function isV0Preview(): boolean {
  return process.env.NEXT_PUBLIC_IS_V0_PREVIEW === "true"
}

// 날짜 관련 함수
export function formatDate(date: string | Date): string {
  if (!date) return "-"

  const dateObj = typeof date === "string" ? new Date(date) : date

  // YYYY-MM-DD 형식으로 변경
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, "0")
  const day = String(dateObj.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}
// 상태 텍스트/색상 변환 함수
export function getPaymentStatusText(isPaid: "PAID" | "REFUNDED" | "NONE"): string {
  switch (isPaid) {
    case "PAID":
      return "납부 완료"
    case "REFUNDED":
      return "환불"
    case "NONE":
    default:
      return "미납"
  }
}

export function getPaymentStatusColor(isPaid: "PAID" | "REFUNDED" | "NONE"): string {
  switch (isPaid) {
    case "PAID":
      return "text-green-600"
    case "REFUNDED":
      return "text-red-600"
    case "NONE":
    default:
      return "text-red-600"
  }
}

export function getAgreementStatusText(isAgreed: boolean | null): string {
  if (isAgreed === true) return "제출 완료"
  return "미동의"
}

export function getAgreementStatusColor(isAgreed: boolean | null): string {
  if (isAgreed === true) return "text-green-600"
  return "text-red-600"
}

// 학번 유효성 검사 함수
export function validateStudentId(id: string): boolean {
  // 9자 또는 10자인지 확인
  const isValidLength = id.length === 9 || id.length === 10
  // 숫자와 영문 대소문자만 포함하는지 확인
  const isValidCharacters = /^[0-9a-zA-Z]+$/.test(id)
  // 두 조건 모두 만족해야 유효
  return isValidLength && isValidCharacters
}

// 건물 타입 텍스트 변환 함수
export function getBuildingTypeText(type: string): string {
  switch (type) {
    case "REFRIGERATOR":
      return "냉장고 전용"
    case "FREEZER":
      return "냉동고 전용"
    case "COMBINED":
      return "통합형 전용"
    case "ALL":
      return "냉장+냉동"
    default:
      return type
  }
}

// Add a utility function for application type text
export function getApplicationTypeText(type: string | undefined): { text: string; color?: string } {
  if (!type) return { text: "-" }

  switch (type) {
    case "REFRIGERATOR":
      return { text: "냉장", color: "rgb(37,99,235)" }
    case "FREEZER":
      return { text: "냉동", color: "rgb(22,163,74)" }
    case "COMBINED":
      return { text: "통합" }
    default:
      return { text: "-" }
  }
}

// 건물 총 슬롯 계산 함수
export function calculateTotalSlots(building: Building): number {
  return (building.fridgeSlots || 0) + (building.freezerSlots || 0) + (building.integratedSlots || 0)
}

// 현재 날짜가 포함된 회차를 찾는 함수
export function findCurrentRound(rounds: Round[], currentDate: Date = new Date()): Round | null {
  const today = currentDate.toISOString().split("T")[0] // YYYY-MM-DD 형식

  // 현재 날짜가 포함된 회차 찾기
  const currentRound = rounds.find((round) => {
    return round.startDate <= today && today <= round.endDate
  })

  if (currentRound) {
    return currentRound
  }

  // 현재 날짜가 포함된 회차가 없으면 가장 가까운 미래 회차 찾기
  const futureRounds = rounds
    .filter((round) => round.startDate > today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  if (futureRounds.length > 0) {
    return futureRounds[0]
  }

  return null
}

// 사용량 상태 및 색상 관련 함수
export function getUsageStatus(usage: number, total: number): "여유" | "임박" | "마감" | "초과" {
  if (total === 0) return "마감" // 슬롯이 0인 경우

  const percentage = (usage / total) * 100

  if (percentage < 90) return "여유"
  if (percentage < 100) return "임박"
  if (percentage === 100) return "마감"
  return "초과"
}

// 로컬 스토리지 관련 유틸리티
export function setStorageValue(key: string, value: any): void {
  if (typeof window === "undefined") return

  if (typeof value === "string") {
    localStorage.setItem(key, value)
  } else {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

// CSV 변환 및 다운로드 유틸리티
export function convertToCSV(data: any[], type: string): string {
  let headers, rows

  if (type === "payers") {
    // 납부자 CSV 헤더
    headers = ["ID", "학번", "상태", "날짜", "금액", "유형"]

    // 데이터 행 생성
    rows = data.map((item) => [
      item.id,
      item.name,
      item.status === "PAID" ? "납부" : "환불",
      item.date,
      item.amount,
      item.type === "BANK_TRANSFER" ? "계좌이체" : "현장납부",
    ])
  } else if (type === "consents") {
    // 서약서 CSV 헤더
    headers = ["ID", "학번", "이름", "전화번호", "건물", "호실", "제출일", "동의여부"]

    // 데이터 행 생성
    rows = data.map((item) => [
      item.id,
      item.studentId,
      item.name,
      item.phoneNumber,
      item.buildingName,
      item.roomNumber,
      item.dateTime?.split("T")[0] || "",
      item.agreed === true ? "동의" : "미동의",
    ])
  } else {
    throw new Error("Invalid type");
  }

  // 헤더와 행 결합
  const csvArray = [headers, ...rows]

  // CSV 문자열로 변환
  return csvArray.map((row) => row.join(",")).join("\n")
}

export function downloadCSV(csvContent: string, filename: string): void {
  // BOM(Byte Order Mark) 추가하여 한글 깨짐 방지
  const BOM = "\uFEFF"
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" })

  // 다운로드 링크 생성
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  // 링크 클릭하여 다운로드
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function getSlotStatusColor(remaining: number, total: number): string {
  if (remaining <= 0) return "text-red-600"
  const percentage = (remaining / total) * 100
  if (percentage < 10) return "text-red-600"
  if (percentage < 30) return "text-yellow-600"
  return "text-green-600"
}

// 역할 키와 타이틀 매핑 함수
export function getRoleTitleByKey(roleKey: string, adminRoles: { key: string; title: string }[]): string {
  const role = adminRoles.find((r) => r.key === roleKey)
  return role ? role.title : roleKey
}