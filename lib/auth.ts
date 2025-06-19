import {isV0Preview} from "@/lib/utils"

/**
 * 사용자 인증 상태를 확인하는 함수
 * @returns {boolean} 인증 여부
 */
export function isAuthenticated(): boolean {
  if (isV0Preview()) {
    return true
  }

  const token = localStorage.getItem("accessToken")
  return !!token
}

/**
 * 저장된 액세스 토큰을 가져오는 함수
 * @returns {string|null} 액세스 토큰 또는 null
 */
export function getAccessToken(): string | null {
  if (isV0Preview()) {
    return null
  }

  return localStorage.getItem("accessToken")
}

/**
 * 로그아웃 처리 함수
 */
export function logout(): void {
  if (isV0Preview()) {
    return
  }

  localStorage.removeItem("accessToken")
}