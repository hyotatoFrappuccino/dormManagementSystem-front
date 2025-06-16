import { getApiUrl } from "@/lib/api-config"
import { isV0Preview } from "@/lib/utils"
import { getStoredMockData, PATH_TO_DEFAULT_KEY, DEFAULT_DATA } from "@/lib/mock-data"
import { getAccessToken, logout } from "@/lib/auth"

// 1. HttpMethod 타입 정의 추가
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

// 2. 기본 request 함수 구현
async function request<T>(method: HttpMethod, path: string, data?: any, isRetry = false): Promise<T> {
  if (isV0Preview()) {
    // v0 프리뷰 모드에서는 모의 데이터 처리
    return handleMockRequest<T>(method, path, data)
  }

  const response = await makeRequest(method, path, data)

  // TOKEN_EXPIRED, INVALID_TOKEN, INVALID_JWT_SIGNATURE, FAILED_AUTHORIZED
  if (response.status === 401) {
    logout()
    window.location.href = "/"
  }

  // 새로운 토큰 확인 및 업데이트
  const newToken = response.headers.get("Authorization")
  if (newToken && newToken.startsWith("Bearer ") && !isRetry) {
    const token = newToken.replace("Bearer ", "")
    if (!isV0Preview()) {
      localStorage.setItem("accessToken", token)
      console.log("Access token updated, retrying request")
    }

    // 토큰이 갱신된 경우 원래 요청을 다시 시도
    return request<T>(method, path, data, true)
  }

  // 기존 응답 처리 로직
  if (!response.ok) {
    let errorMessage = `API 호출 실패: ${response.status}`

    try {
      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        // 응답을 텍스트로 먼저 읽어서 확인
        const responseText = await response.text()

        if (responseText) {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.message || errorMessage
        }
      } else {
        // JSON이 아닌 경우 텍스트로 읽기
        const responseText = await response.text()
        if (responseText) {
          errorMessage = responseText
        }
      }
    } catch (parseError) {
      // 파싱 실패 시 기본 메시지 사용
      console.error("Error parsing response:", parseError)
    }

    throw new Error(errorMessage)
  }

  // 204 No Content 응답 처리
  if (response.status === 204) {
    return {} as T
  }

  // 응답이 비어있는지 확인
  const contentLength = response.headers.get("content-length")
  if (contentLength === "0") {
    return {} as T
  }

  // 응답 형식에 따라 처리
  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    return response.json()
  } else {
    return (await response.text()) as unknown as T
  }
}

// 실제 HTTP 요청을 수행하는 내부 함수
async function makeRequest(method: HttpMethod, path: string, data?: any): Promise<Response> {
  const isPlainText = typeof data === "string"
  const options: RequestInit = {
    method,
    credentials: "include",
    headers: {},
  }

  const token = getAccessToken()
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  if (method !== "GET" && data !== undefined) {
    options.headers = {
      ...options.headers,
      "Content-Type": isPlainText ? "text/plain" : "application/json",
    }
    options.body = isPlainText ? data : JSON.stringify(data)
  }

  return fetch(getApiUrl(path), options)
}

// 3. v0 프리뷰 모드에서의 모의 요청 처리 함수
function handleMockRequest<T>(method: HttpMethod, path: string, data?: any): Promise<T> {
  try {
    switch (method) {
      case "GET":
        return Promise.resolve(getMockData<T>(path))
      case "POST":
        return Promise.resolve(saveMockData<T>(path, data))
      case "PUT":
        return Promise.resolve(saveMockData<T>(path, data))
      case "DELETE":
        const match = path.match(/\/(\d+)$/)
        const id = data?.id ?? (match ? Number(match[1]) : undefined)
        deleteMockData(path, id)
        return Promise.resolve({} as T)
      default:
        throw new Error(`Unsupported method: ${method}`)
    }
  } catch (error) {
    return Promise.reject(error)
  }
}

// 4. 래퍼 함수 구현
export function get<T>(path: string): Promise<T> {
  return request<T>("GET", path)
}

export function post<T>(path: string, data?: any): Promise<T> {
  return request<T>("POST", path, data)
}

export function put<T>(path: string, data: any): Promise<T> {
  return request<T>("PUT", path, data)
}

export function del<T>(path: string, data?: any): Promise<T> {
  return request<T>("DELETE", path, data)
}

// 기존 getMockData 함수는 그대로 유지
export function getMockData<T>(path: string): T {
  // 특별한 경로 처리 (예: 학번으로 냉장고 정보 조회)
  if (path.startsWith("/api/fridge/") && path !== "/api/fridge") {
    const studentId = path.split("/").pop() || ""
    const fridgeData = getStoredMockData("fridge")

    // 해당 학번의 데이터가 있으면 반환, 없으면 기본 데이터 반환
    const studentData = fridgeData[studentId] || fridgeData["default"]

    // 데이터가 없거나 구조가 올바르지 않은 경우 기본 구조 생성
    if (!studentData || !studentData.defaultInfo) {
      return {
        defaultInfo: {
          name: "기본사용자",
          isPaid: "PAID",
          isAgreed: true,
          building: "이룸관(여)",
          roomNumber: "101호",
        },
        fridgeApplyInfo: [],
      } as unknown as T
    }

    return studentData as T
  }

  // 회차별 냉장고 신청 현황 조회
  if (path.startsWith("/api/rounds/") && path.includes("/fridge-applications")) {
    // const roundId = path.split("/")[3] // URL에서 회차 ID 추출
    const roundsFridgeApplications = getStoredMockData("roundsFridgeApplications")
    return roundsFridgeApplications as T
  }

  // 일반적인 경로 처리
  const entry = Object.entries(PATH_TO_DEFAULT_KEY).find(([prefix]) => path.startsWith(prefix))

  if (!entry) {
    throw new Error(`No mock data mapping for path: ${path}`)
  }

  const [, key] = entry
  return getStoredMockData(String(key)) as T
}

// 기존 saveMockData 함수 유지
function saveMockData<T>(path: string, data: any): T {
  // 특별한 경로 처리 (예: 냉장고 신청)
  if (path === "/api/fridge") {
    const { roundId, studentId, type } = data
    const fridgeData = getStoredMockData("fridge")

    // 학번에 해당하는 데이터가 없으면 기본 데이터로 초기화
    if (!fridgeData[studentId]) {
      fridgeData[studentId] = JSON.parse(JSON.stringify(fridgeData["default"]))
    }

    // 해당 회차에 이미 신청한 내역이 있는지 확인
    const existingAppIndex = fridgeData[studentId].fridgeApplyInfo.findIndex(
      (app: any) => app.round && app.round.id === roundId,
    )

    // 회차 정보 가져오기
    const rounds = getStoredMockData("rounds")
    const round = rounds.find((r: any) => r.id === roundId)

    if (existingAppIndex >= 0) {
      // 기존 신청 정보 업데이트
      fridgeData[studentId].fridgeApplyInfo[existingAppIndex].type = type
    } else {
      // 새 신청 정보 추가
      const newApp = {
        id: fridgeData[studentId].fridgeApplyInfo.length + 1,
        type,
        round,
        appliedAt: new Date().toISOString(),
      }
      fridgeData[studentId].fridgeApplyInfo.push(newApp)
    }

    // 업데이트된 데이터 저장
    localStorage.setItem("fridge", JSON.stringify(fridgeData))

    // 회차별 신청 현황 업데이트
    const roundsFridgeApplications = getStoredMockData("roundsFridgeApplications")
    if (!roundsFridgeApplications[roundId]) {
      roundsFridgeApplications[roundId] = {}
    }
    if (!roundsFridgeApplications[roundId][type]) {
      roundsFridgeApplications[roundId][type] = 0
    }
    roundsFridgeApplications[roundId][type]++
    localStorage.setItem("roundsFridgeApplications", JSON.stringify(roundsFridgeApplications))

    return { success: true } as T
  }

  // 일반적인 경로 처리
  const entry = Object.entries(PATH_TO_DEFAULT_KEY).find(([prefix]) => path.startsWith(prefix))

  if (!entry) {
    throw new Error(`No mock data mapping for path: ${path}`)
  }

  const [, key] = entry
  const storageKey = String(key)

  // localStorage에서 현재 데이터 가져오기
  const currentData = getStoredMockData(storageKey)

  // Handle different data structures based on the current data
  if (Array.isArray(currentData)) {
    // If it's an array, add the new item with a new ID
    const newId = currentData.length > 0 ? Math.max(...currentData.map((item) => item.id || 0)) + 1 : 1

    // If data doesn't have an ID, add one
    const newItem = { ...data, id: data.id || newId }

    // Add to the array
    const updatedData = [...currentData, newItem]
    localStorage.setItem(storageKey, JSON.stringify(updatedData))

    // Return the newly created item
    return newItem as unknown as T
  } else if (typeof currentData === "object" && currentData !== null) {
    // If it's an object, merge the new data
    const updatedData = { ...currentData, ...data }
    localStorage.setItem(storageKey, JSON.stringify(updatedData))
    return updatedData as T
  } else {
    // If it's something else, just replace it
    localStorage.setItem(storageKey, JSON.stringify(data))
    return data as T
  }
}

// 기존 deleteMockData 함수 유지
function deleteMockData(path: string, id?: number): void {
  const entry = Object.entries(PATH_TO_DEFAULT_KEY).find(([prefix]) => path.startsWith(prefix))

  if (!entry) {
    throw new Error(`No mock data mapping for path: ${path}`)
  }

  const [, key] = entry
  const storageKey = String(key)

  // localStorage에서 현재 데이터 가져오기
  const currentData = getStoredMockData(storageKey)

  // ID가 제공된 경우 해당 항목만 삭제
  if (id !== undefined && Array.isArray(currentData)) {
    const updatedData = currentData.filter((item) => item.id !== id)
    localStorage.setItem(storageKey, JSON.stringify(updatedData))
    console.log(`Deleted item with ID ${id} from ${storageKey}`)
    return
  }

  // ID가 없는 경우 전체 데이터 초기화 (기본값으로)
  if (DEFAULT_DATA[storageKey]) {
    localStorage.setItem(storageKey, JSON.stringify(DEFAULT_DATA[storageKey]))
    console.log(`Reset data for ${storageKey} to default`)
  } else {
    // 기본값이 없는 경우 빈 배열이나 객체로 초기화
    localStorage.setItem(storageKey, JSON.stringify(Array.isArray(currentData) ? [] : {}))
    console.log(`Cleared data for ${storageKey}`)
  }
}
