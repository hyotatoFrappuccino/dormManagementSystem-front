"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  RefreshCw,
  Building as BuildingIcon,
  Users,
  Calendar,
  Settings,
  Pencil,
} from "lucide-react"
import { API_PATHS } from "@/lib/api-config"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Building, Administrator, Round, AdminRole } from "@/lib/interfaces"
import { getRoleTitleByKey } from "@/lib/utils"
import { get, put, post, del } from "@/lib/api-client"

// 설정 단계 정의
const SETUP_STEPS = [
  { id: "basic", title: "기본 설정", icon: Settings },
  { id: "buildings", title: "건물 설정", icon: BuildingIcon },
  { id: "administrators", title: "관리자 설정", icon: Users },
  { id: "rounds", title: "회차 설정", icon: Calendar },
  { id: "complete", title: "완료", icon: CheckCircle },
]

export default function InitialSetup() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState("basic")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // 기본 설정 상태
  const [defaultAmount, setDefaultAmount] = useState("")
  const [googleSheetId, setGoogleSheetId] = useState("")
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  // 건물 설정 상태
  const [buildings, setBuildings] = useState<Building[]>([]) // 빈 배열로 초기화
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false)
  const [buildingError, setBuildingError] = useState<string | null>(null)
  const [buildingName, setBuildingName] = useState("")
  const [buildingType, setBuildingType] = useState<"REFRIGERATOR" | "FREEZER" | "COMBINED" | "ALL">("ALL")
  const [buildingFridgeSlots, setBuildingFridgeSlots] = useState("0")
  const [buildingFreezerSlots, setBuildingFreezerSlots] = useState("0")
  const [buildingIntegratedSlots, setBuildingIntegratedSlots] = useState("0")
  const [showFridgeSlots, setShowFridgeSlots] = useState(true)
  const [showFreezerSlots, setShowFreezerSlots] = useState(true)
  const [showIntegratedSlots, setShowIntegratedSlots] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null)

  // 관리자 설정 상태
  const [administrators, setAdministrators] = useState<Administrator[]>([])
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false)
  const [adminError, setAdminError] = useState<string | null>(null)
  const [adminEmail, setAdminEmail] = useState("")
  const [adminName, setAdminName] = useState("")
  const [adminRole, setAdminRole] = useState("EXECUTIVE")
  const [isEditAdminMode, setIsEditAdminMode] = useState(false)
  const [currentAdmin, setCurrentAdmin] = useState<Administrator | null>(null)

  const [adminRoles] = useState<AdminRole[]>([
    { key: "EXECUTIVE", title: "임원" },
    { key: "PRESIDENT", title: "회장" },
    { key: "VICE_PRESIDENT", title: "부회장" },
    { key: "DEVELOPER", title: "개발자" },
  ])

  // 회차 설정 상태
  const [rounds, setRounds] = useState<Round[]>([])
  const [isLoadingRounds, setIsLoadingRounds] = useState(false)
  const [roundError, setRoundError] = useState<string | null>(null)
  const [roundName, setRoundName] = useState("")
  const [roundStartDate, setRoundStartDate] = useState("")
  const [roundEndDate, setRoundEndDate] = useState("")
  const [isEditRoundMode, setIsEditRoundMode] = useState(false)
  const [currentRound, setCurrentRound] = useState<Round | null>(null)
  // 회차 설정 상태에 비밀번호 필드 추가
  const [roundPassword, setRoundPassword] = useState("")

  // 편집 모드 시작 함수 (건물)
  const handleEditBuilding = (building: Building) => {
    setIsEditMode(true)
    setCurrentBuilding(building)
    setBuildingName(building.name)
    setBuildingType(building.type)
    setBuildingFridgeSlots(String(building.fridgeSlots))
    setBuildingFreezerSlots(String(building.freezerSlots))
    setBuildingIntegratedSlots(String(building.integratedSlots))
  }

  // 편집 모드 시작 함수 (관리자)
  const handleEditAdmin = (admin: Administrator) => {
    setIsEditAdminMode(true)
    setCurrentAdmin(admin)
    setAdminEmail(admin.email)
    setAdminName(admin.name)
    setAdminRole(admin.role)
  }

  // 편집 모드 시작 함수 (회차)
  const handleEditRound = (round: Round) => {
    setIsEditRoundMode(true)
    setCurrentRound(round)
    setRoundName(round.name)
    setRoundStartDate(round.startDate)
    setRoundEndDate(round.endDate)
    setRoundPassword(round.password || "")
  }

  // 이전 단계로 이동
  const handlePrevStep = () => {
    switch (activeStep) {
      case "buildings":
        setActiveStep("basic")
        break
      case "administrators":
        setActiveStep("buildings")
        break
      case "rounds":
        setActiveStep("administrators")
        break
      case "complete":
        setActiveStep("rounds")
        break
      default:
        break
    }
  }

  // 초기 설정 상태 확인
  useEffect(() => {
    // 기본 설정 값 로드
    if (activeStep === "basic") {
      fetchSettings()
    }
  }, [router])

  // buildingType이 변경될 때 슬롯 표시 상태 업데이트
  useEffect(() => {
    switch (buildingType) {
      case "ALL": // 냉장+냉동
        setShowFridgeSlots(true)
        setShowFreezerSlots(true)
        setShowIntegratedSlots(false)
        break
      case "REFRIGERATOR": // 냉장 전용
        setShowFridgeSlots(true)
        setShowFreezerSlots(false)
        setShowIntegratedSlots(false)
        break
      case "FREEZER": // 냉동 전용
        setShowFridgeSlots(false)
        setShowFreezerSlots(true)
        setShowIntegratedSlots(false)
        break
      case "COMBINED": // 통합형 전용
        setShowFridgeSlots(false)
        setShowFreezerSlots(false)
        setShowIntegratedSlots(true)
        break
    }
  }, [buildingType])

  // 기본 설정 값 가져오기
  const fetchSettings = async () => {
    setIsLoadingSettings(true)
    setSettingsError(null)

    try {
      // 기본 납부 금액 가져오기
      try {
        const amountResponse = await get<string>(API_PATHS.CONFIG_DEFAULT_AMOUNT)
        if (amountResponse) {
          setDefaultAmount(amountResponse)
        } else {
          setDefaultAmount("7000") // 기본값 설정
        }
      } catch (error) {
        console.error("기본 납부 금액 가져오기 실패:", error)
        setDefaultAmount("7000") // 기본값 설정
      }

      // 서약서 구글 시트 ID 가져오기
      try {
        const sheetResponse = await get<string>(API_PATHS.CONFIG_GOOGLE_SHEET_ID)
        // 응답이 유효한 문자열인지 확인
        if (sheetResponse && String(sheetResponse) !== "[object Object]") {
          setGoogleSheetId(sheetResponse)
        } else {
          setGoogleSheetId("")
        }
      } catch (error) {
        console.error("구글 시트 ID 가져오기 실패:", error)
        setGoogleSheetId("")
      }
    } catch (error) {
      console.error("설정 가져오기 중 오류 발생:", error)
      setSettingsError("설정을 불러오는데 실패했습니다.")
    } finally {
      setIsLoadingSettings(false)
    }
  }

  // 건물 목록 가져기
  const fetchBuildings = async () => {
    setIsLoadingBuildings(true)
    setBuildingError(null)

    try {
      // API 호출
      const response = await get<Building[]>(API_PATHS.BUILDING)
      if (Array.isArray(response)) {
        setBuildings(response)
      } else {
        console.error("API 응답이 배열이 아닙니다:", response)
        setBuildings([]) // 빈 배열로 초기화
        setBuildingError("건물 목록을 불러오는데 실패했습니다.")
      }
    } catch (error) {
      console.error("Error fetching buildings:", error)
      setBuildings([]) // 오류 발생 시 빈 배열로 초기화
      setBuildingError("서버 연결 오류가 발생했습니다.")
    } finally {
      setIsLoadingBuildings(false)
    }
  }

  // 건물 추가/수정 함수
  const handleAddBuilding = async () => {
    // 입력 검증
    if (!buildingName.trim()) {
      alert("건물 이름을 입력해주세요.")
      return
    }

    // 새 건물 데이터 생성
    const buildingData: Building = {
      id: 0,
      name: buildingName,
      type: buildingType,
      fridgeSlots: Number.parseInt(buildingFridgeSlots) || 0,
      freezerSlots: Number.parseInt(buildingFreezerSlots) || 0,
      integratedSlots: Number.parseInt(buildingIntegratedSlots) || 0,
    }

    try {
      if (isEditMode && currentBuilding?.id) {
        // 기존 건물 수정 (PUT)
        const response = await put<Building>(`${API_PATHS.BUILDING}/${currentBuilding.id}`, {
          ...buildingData,
          id: currentBuilding.id,
        })

        if (!response) {
          return Promise.reject(new Error("건물 수정에 실패했습니다."))
        }

        // 성공 시 로컬 상태 업데이트
        setBuildings(
          buildings.map((b) => (b.id === currentBuilding.id ? { ...buildingData, id: currentBuilding.id } : b)),
        )
      } else {
        // 새 건물 추가 (POST)
        const response = await post<Building>(API_PATHS.BUILDING, buildingData)

        if (!response) {
          return Promise.reject(new Error("건물 추가에 실패했습니다."))
        }

        // 성공 시 응답에서 ID를 받아와 로컬 상태 업데이트
        setBuildings([...buildings, response])
      }

      // 입력 필드 초기화
      setBuildingName("")
      setBuildingType("ALL")
      setBuildingFridgeSlots("0")
      setBuildingFreezerSlots("0")
      setBuildingIntegratedSlots("0")
      setIsEditMode(false)
      setCurrentBuilding(null)
    } catch (error: any) {
      console.error("건물 저장 중 오류 발생:", error)
      alert(error.message || "건물 저장 중 오류가 발생했습니다.")
    }
  }

  // 건물 삭제 함수
  const handleRemoveBuilding = async (index: number) => {
    if (!Array.isArray(buildings) || index < 0 || index >= buildings.length) {
      console.error("유효하지 않은 건물 인덱스:", index)
      return
    }

    const building = buildings[index]

    try {
      if (building.id) {
        // API 호출
        const response = await del<any>(`${API_PATHS.BUILDING}/${building.id}`)

        if (!response) {
          return Promise.reject(new Error("건물 삭제에 실패했습니다."))
        }

        // 성공 시 로컬 상태 업데이트
        const updatedBuildings = [...buildings]
        updatedBuildings.splice(index, 1)
        setBuildings(updatedBuildings)
      } else {
        // ID가 없는 경우 (로컬에만 있는 데이터)
        const updatedBuildings = [...buildings]
        updatedBuildings.splice(index, 1)
        setBuildings(updatedBuildings)
      }
    } catch (error: any) {
      console.error("건물 삭제 중 오류 발생:", error)
      alert(error.message || "건물 삭제 중 오류가 발생했습니다.")
    }
  }

  // 관리자 목록 가져오기
  const fetchAdministrators = async () => {
    setIsLoadingAdmins(true)
    setAdminError(null)

    try {
      // API 호출
      const response = await get<Administrator[]>(API_PATHS.ADMINS)
      if (Array.isArray(response)) {
        setAdministrators(response)
      } else {
        console.error("API 응답이 배열이 아닙니다:", response)
        setAdministrators([]) // 빈 배열로 초기화
        setAdminError("관리자 목록을 불러오는데 실패했습니다.")
      }
    } catch (error) {
      console.error("Error fetching administrators:", error)
      setAdministrators([]) // 오류 발생 시 빈 배열로 초기화
      setAdminError("서버 연결 오류가 발생했습니다.")
    } finally {
      setIsLoadingAdmins(false)
    }
  }

  // 관리자 추가/수정 함수
  const handleAddAdmin = async () => {
    // 입력 검증
    if (!adminEmail.trim()) {
      alert("이메일을 입력해주세요.")
      return
    }

    if (!adminName.trim()) {
      alert("이름을 입력해주세요.")
      return
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(adminEmail)) {
      alert("유효한 이메일 주소를 입력해주세요.")
      return
    }

    // 새 관리자 데이터 생성
    const adminData: Administrator = {
      id: 0,
      email: adminEmail,
      name: adminName,
      role: adminRole,
    }

    try {
      if (isEditAdminMode && currentAdmin?.id) {
        // 기존 관리자 수정 (PUT)
        const response = await put<Administrator>(`${API_PATHS.ADMINS}/${currentAdmin.id}`, {
          ...adminData,
          id: currentAdmin.id,
        })

        if (!response) {
          return Promise.reject(new Error("관리자 수정에 실패했습니다."))
        }

        // 성공 시 로컬 상태 업데이트
        setAdministrators(
          administrators.map((a) => (a.id === currentAdmin.id ? { ...adminData, id: currentAdmin.id } : a)),
        )
      } else {
        // 새 관리자 추가 (POST)
        const response = await post<Administrator>(API_PATHS.ADMINS, adminData)

        if (!response) {
          return Promise.reject(new Error("관리자 추가에 실패했습니다."))
        }

        // 성공 시 응답에서 ID를 받아와 로컬 상태 업데이트
        setAdministrators([...administrators, response])
      }

      // 입력 필드 초기화
      setAdminEmail("")
      setAdminName("")
      setAdminRole("EXECUTIVE")
      setIsEditAdminMode(false)
      setCurrentAdmin(null)
    } catch (error: any) {
      console.error("관리자 저장 중 오류 발생:", error)
      alert(error.message || "관리자 저장 중 오류가 발생했습니다.")
    }
  }

  // 관리자 삭제 함수
  const handleRemoveAdmin = async (index: number) => {
    if (!Array.isArray(administrators) || index < 0 || index >= administrators.length) {
      console.error("유효하지 않은 관리자 인덱스:", index)
      return
    }

    const admin = administrators[index]

    try {
      if (admin.id) {
        // API 호출
        const response = await del<any>(`${API_PATHS.ADMINS}/${admin.id}`)

        if (!response) {
          return Promise.reject(new Error("관리자 삭제에 실패했습니다."))
        }

        // 성공 시 로컬 상태 업데이트
        const updatedAdmins = [...administrators]
        updatedAdmins.splice(index, 1)
        setAdministrators(updatedAdmins)
      } else {
        // ID가 없는 경우 (로컬에만 있는 데이터)
        const updatedAdmins = [...administrators]
        updatedAdmins.splice(index, 1)
        setAdministrators(updatedAdmins)
      }
    } catch (error: any) {
      console.error("관리자 삭제 중 오류 발생:", error)
      alert(error.message || "관리자 삭제 중 오류가 발생했습니다.")
    }
  }

  // 회차 목록 가져오기
  const fetchRounds = async () => {
    setIsLoadingRounds(true)
    setRoundError(null)

    try {
      // API 호출
      const response = await get<Round[]>(API_PATHS.ROUNDS)
      if (Array.isArray(response)) {
        // 시작일 기준으로 정렬 (빠른순)
        const sortedRounds = response.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        setRounds(sortedRounds)
      } else {
        console.error("API 응답이 배열이 아닙니다:", response)
        setRounds([]) // 빈 배열로 초기화
        setRoundError("회차 목록을 불러오는데 실패했습니다.")
      }
    } catch (error) {
      console.error("Error fetching rounds:", error)
      setRounds([]) // 빈 배열로 초기화
      setRoundError("서버 연결 오류가 발생했습니다.")
    } finally {
      setIsLoadingRounds(false)
    }
  }

  // 회차 추가/수정 함수
  const handleAddRound = async () => {
    // 입력 검증
    if (!roundName.trim()) {
      alert("회차 이름을 입력해주세요.")
      return
    }

    if (!roundStartDate) {
      alert("시작일을 입력해주세요.")
      return
    }

    if (!roundEndDate) {
      alert("종료일을 입력해주세요.")
      return
    }

    // 비밀번호 검증 추가
    if (!roundPassword.trim()) {
      alert("비밀번호를 입력해주세요.")
      return
    }

    // 시작일이 종료일보다 이후인지 확인
    if (new Date(roundStartDate) > new Date(roundEndDate)) {
      alert("시작일은 종료일보다 이전이어야 합니다.")
      return
    }

    // 새 회차 데이터 생성
    const roundData: Round = {
      id: 0,
      name: roundName,
      startDate: roundStartDate,
      endDate: roundEndDate,
      password: roundPassword,
    }

    try {
      if (isEditRoundMode && currentRound?.id) {
        // 기존 회차 수정 (PUT)
        const response = await put<Round>(`${API_PATHS.ROUNDS}/${currentRound.id}`, {
          ...roundData,
          id: currentRound.id,
        })

        if (!response) {
          return Promise.reject(new Error("회차 수정에 실패했습니다."))
        }

        // 성공 시 로컬 상태 업데이트
        setRounds(rounds.map((r) => (r.id === currentRound.id ? { ...roundData, id: currentRound.id } : r)))
      } else {
        // 새 회차 추가 (POST)
        const response = await post<Round>(API_PATHS.ROUNDS, roundData)

        if (!response) {
          return Promise.reject(new Error("회차 추가에 실패했습니다."))
        }

        // 성공 시 응답에서 ID를 받아와 로컬 상태 업데이트
        setRounds([...rounds, response])
      }
    } catch (error: any) {
      console.error("회차 저장 중 오류 발생:", error)
      alert(error.message || "회차 저장 중 오류가 발생했습니다.")
    }

    // 입력 필드 초기화
    setRoundName("")
    setRoundStartDate("")
    setRoundEndDate("")
    setRoundPassword("")
    setIsEditRoundMode(false)
    setCurrentRound(null)
  }

  // 회차 삭제 함수
  const handleRemoveRound = async (index: number) => {
    if (!Array.isArray(rounds) || index < 0 || index >= rounds.length) {
      console.error("유효하지 않은 회차 인덱스:", index)
      return
    }

    const round = rounds[index]

    try {
      if (round.id) {
        // API 호출
        const response = await del<any>(`${API_PATHS.ROUNDS}/${round.id}`)

        if (!response) {
          return Promise.reject(new Error("회차 삭제에 실패했습니다."))
        }

        // 성공 시 로컬 상태 업데이트
        const updatedRounds = [...rounds]
        updatedRounds.splice(index, 1)
        setRounds(updatedRounds)
      } else {
        // ID가 없는 경우 (로컬에만 있는 데이터)
        const updatedRounds = [...rounds]
        updatedRounds.splice(index, 1)
        setRounds(updatedRounds)
      }
    } catch (error: any) {
      console.error("회차 삭제 중 오류 발생:", error)
      alert(error.message || "회차 삭제 중 오류가 발생했습니다.")
    }
  }
  // 건물 타입 텍스트 변환 함수
  const getBuildingTypeText = (type: string) => {
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

  // 다음 단계로 이동
  const handleNextStep = () => {
    switch (activeStep) {
      case "basic":
        // 기본 설정 검증
        if (defaultAmount.length == undefined) {
          alert("기본 납부 금액을 입력해주세요.")
          return
        }
        if (!googleSheetId.trim()) {
          alert("서약서 구글 시트 ID를 입력해주세요.")
          return
        }
        setActiveStep("buildings")
        // 건물 목록 로드
        fetchBuildings()
        break
      case "buildings":
        // 건물 설정 검증
        if (!Array.isArray(buildings) || buildings.length === 0) {
          alert("최소 하나 이상의 건물을 추가해주세요.")
          return
        }
        setActiveStep("administrators")
        // 관리자 목록 로드
        fetchAdministrators()
        break
      case "administrators":
        // 관리자 검증 제거 - 관리자 추가 안해도 다음 단계로 이동 가능
        setActiveStep("rounds")
        // 회차 목록 로드
        fetchRounds()
        break
      case "rounds":
        // 회차 설정 검증
        if (!Array.isArray(rounds) || rounds.length === 0) {
          alert("최소 하나 이상의 회차를 추가해주세요.")
          return
        }
        setActiveStep("complete")
        break
      default:
        break
    }
  }

  // 설정 완료 처리
  const handleCompleteSetup = async () => {
    setIsSaving(true)
    setSaveError(null)

    try {
      // 기본 납부 금액 저장
      const amountResponse = await post<any>(API_PATHS.CONFIG_DEFAULT_AMOUNT, defaultAmount)

      if (!amountResponse) {
        return Promise.reject(new Error("기본 납부 금액 저장에 실패했습니다."))
      }

      // 구글 시트 ID 저장
      const sheetResponse = await post<any>(API_PATHS.CONFIG_GOOGLE_SHEET_ID, googleSheetId)

      if (!sheetResponse) {
        return Promise.reject(new Error("구글 시트 ID 저장에 실패했습니다."))
      }

      // 건물 데이터 저장
      for (const building of buildings) {
        let buildingResponse

        if (building.id) {
          // 기존 건물 수정 (PUT)
          buildingResponse = await put<Building>(`${API_PATHS.BUILDING}/${building.id}`, building)
        } else {
          // 새 건물 추가 (POST)
          buildingResponse = await post<Building>(API_PATHS.BUILDING, building)
        }

        if (!buildingResponse) {
          return Promise.reject(new Error("건물 데이터 저장에 실패했습니다."))
        }
      }

      // 관리자 데이터 저장
      for (const admin of administrators) {
        let adminResponse

        if (admin.id) {
          // 기존 관리자 수정 (PUT)
          adminResponse = await put<Administrator>(`${API_PATHS.ADMINS}/${admin.id}`, admin)
        } else {
          // 새 관리자 추가 (POST)
          adminResponse = await post<Administrator>(API_PATHS.ADMINS, admin)
        }

        if (!adminResponse) {
          return Promise.reject(new Error("관리자 데이터 저장에 실패했습니다."))
        }
      }

      // 회차 데이터 저장
      for (const round of rounds) {
        let roundResponse

        if (round.id) {
          // 기존 회차 수정 (PUT)
          roundResponse = await put<Round>(`${API_PATHS.ROUNDS}/${round.id}`, round)
        } else {
          // 새 회차 추가 (POST)
          roundResponse = await post<Round>(API_PATHS.ROUNDS, round)
        }

        if (!roundResponse) {
          return Promise.reject(new Error("회차 데이터 저장에 실패했습니다."))
        }
      }

      // 설정 완료 표시
      const configResponse = await post<any>(API_PATHS.CONFIG_IS_CONFIGURED, true)

      if (!configResponse) {
        return Promise.reject(new Error("설정 완료 표시에 실패했습니다."))
      }

      setSaveSuccess(true)
    } catch (error: any) {
      console.error("설정 저장 중 오류 발생:", error)
      setSaveError(error.message || "설정 저장 중 오류가 발생했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  // 메인 페이지로 이동
  const handleGoToMain = () => {
    // 페이지를 강제로 새로고침하여 상태를 리셋
    window.location.href = "/"
  }

  // 현재 단계 인덱스 계산
  const currentStepIndex = SETUP_STEPS.findIndex((step) => step.id === activeStep)

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">통합관리시스템 초기 설정</CardTitle>
          <CardDescription className="text-center">
            시스템을 사용하기 전에 필요한 기본 설정을 완료해주세요.
          </CardDescription>
        </CardHeader>

        {/* 진행 상태 표시 */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            {SETUP_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${index <= currentStepIndex ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 mb-1
                    ${
                      index < currentStepIndex
                        ? "bg-primary text-primary-foreground border-primary"
                        : index === currentStepIndex
                          ? "border-primary text-primary"
                          : "border-muted-foreground text-muted-foreground"
                    }`}
                >
                  {index < currentStepIndex ? <CheckCircle className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                </div>
                <span className="text-xs font-medium">{step.title}</span>
              </div>
            ))}
          </div>

          {/* 진행 바 */}
          <div className="relative w-full h-1 bg-muted mt-2">
            <div
              className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${(currentStepIndex / (SETUP_STEPS.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        <CardContent>
          {/* 기본 설정 */}
          {activeStep === "basic" && (
            <div className="space-y-6">
              <div className="space-y-4">
                {isLoadingSettings ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : settingsError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{settingsError}</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="default-amount">기본 납부 금액 (원)</Label>
                      <Input
                        id="default-amount"
                        type="number"
                        placeholder="예: 7000"
                        value={defaultAmount}
                        onChange={(e) => setDefaultAmount(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="google-sheet-id">서약서 구글 시트 ID</Label>
                      <Input
                        id="google-sheet-id"
                        placeholder="예: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                        value={googleSheetId}
                        onChange={(e) => setGoogleSheetId(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <p className="mb-2 font-semibold text-base">1. 서약서 양식 안내</p>
                    <p className="mb-2">
                      통합관리시스템에서 서약서 구글 시트 데이터를 불러오려면 아래 양식을 반드시 준수해야 합니다.{" "}
                      <br></br> (그냥 작년 거 쓰면 됩니다. 밑으로 내려서{" "}
                      <a href="#2" className="text-blue-600 hover:underline">
                        2번 권한 추가
                      </a>
                      랑{" "}
                      <a href="#3" className="text-blue-600 hover:underline">
                        3번 시트 ID 저장
                      </a>
                      만 보고 설정해주세요.)
                    </p>

                    <div className="mb-2 border rounded-md p-2 bg-gray-50">
                      <img src="/img/img1.png" alt="응답 시트 위치" className="block w-[40%]" />
                    </div>

                    <p className="mb-2">1번째에 응답 시트가 위치해야 합니다.</p>
                    <p className="font-semibold">필수 항목 (1~6열)</p>
                    <table className="w-full border-collapse mb-4">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border p-1 text-xs text-center">열 번호</th>
                          <th className="border p-1 text-xs text-center">항목</th>
                          <th className="border p-1 text-xs text-center">형식 예시</th>
                          <th className="border p-1 text-xs text-center">비고</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-1 text-xs text-center">1</td>
                          <td className="border p-1 text-xs text-center">타임스탬프</td>
                          <td className="border p-1 text-xs text-center">2025. 1. 1 오전 12:30:01</td>
                          <td className="border p-1 text-xs text-center">설문지-시트 연결 시 자동 생성</td>
                        </tr>
                        <tr>
                          <td className="border p-1 text-xs text-center">2</td>
                          <td className="border p-1 text-xs text-center">학번</td>
                          <td className="border p-1 text-xs text-center">
                            202512345 (내국인)<br></br>2025ABC123 (외국인)
                          </td>
                          <td className="border p-1 text-xs text-center"></td>
                        </tr>
                        <tr>
                          <td className="border p-1 text-xs text-center">3</td>
                          <td className="border p-1 text-xs text-center">이름</td>
                          <td className="border p-1 text-xs text-center">김유연</td>
                          <td className="border p-1 text-xs text-center"></td>
                        </tr>
                        <tr>
                          <td className="border p-1 text-xs text-center">4</td>
                          <td className="border p-1 text-xs text-center">전화번호</td>
                          <td className="border p-1 text-xs text-center">
                            010-XXXX-YYYY<br></br>010XXXXYYYY
                          </td>
                          <td className="border p-1 text-xs text-center"></td>
                        </tr>
                        <tr>
                          <td className="border p-1 text-xs text-center">5</td>
                          <td className="border p-1 text-xs text-center">건물</td>
                          <td className="border p-1 text-xs text-center">이룸관(여)</td>
                          <td className="border p-1 text-xs text-center">
                            시스템 설정의 건물 목록의 이름과 정확히 일치해야 함
                          </td>
                        </tr>
                        <tr>
                          <td className="border p-1 text-xs text-center">6</td>
                          <td className="border p-1 text-xs text-center">거주호실</td>
                          <td className="border p-1 text-xs text-center">
                            234<br></br>234호
                          </td>
                          <td className="border p-1 text-xs text-center"></td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="text-xs mb-1">✅ 1~6열의 항목과 순서는 반드시 지켜야 합니다.</p>
                    <p className="text-xs mb-2">
                      ✅ 항목 이름은 변경 가능하지만 의미는 유지해야 합니다. 예) '학번' → '학번 (Student Number)' 변경
                      가능
                    </p>

                    <p className="font-semibold">선택 항목 (7열~Z열)</p>
                    <p className="text-xs mb-1">7열부터 추가적인 동의 항목을 설정할 수 있습니다.</p>
                    <p className="text-xs mb-2">
                      '동의하지 않습니다' 텍스트가 포함된 응답이 하나라도 있으면 미동의로 간주합니다.
                    </p>

                    <p className="text-xs font-semibold mt-2">✅ 동의 여부 처리 기준</p>
                    <p className="text-xs">예시 1 (미동의 처리)</p>
                    <p className="text-xs text-muted-foreground">
                      2025. 1. 1 오전 12:30:01 | 202512648 | 홍길동 | 010-1234-5678 | 새롬(여) | 123 | 동의합니다. |
                      동의하지 않습니다. | 이해합니다. | 추가 의견
                    </p>
                    <p className="text-xs">➡ '동의하지 않습니다'가 포함되었으므로 미동의 처리</p>

                    <p className="text-xs">예시 2 (동의 처리)</p>
                    <p className="text-xs text-muted-foreground">
                      2025. 1. 1 오전 12:30:01 | 202512648 | 홍길동 | 010-1234-5678 | 새롬(여) | 123 | 추가 의견 |
                      동의합니다. | 이해합니다. | 추가 의견222
                    </p>
                    <p className="text-xs">➡ '동의하지 않습니다'가 포함되지 않았으므로 동의 처리</p>

                    <p className="mb-2 font-semibold text-base mt-4" id="2">
                      2. 불러오기 권한 추가
                    </p>

                    <div className="mb-2 border rounded-md p-2 bg-gray-50">
                      <img src="/img/img2.png" alt="구글 시트 공유 버튼" className="block w-[25%]" />
                    </div>
                    <p className="text-xs mb-2">구글 시트 우측 상단의 "공유" 버튼을 클릭합니다.</p>

                    <div className="mb-2 border rounded-md p-2 bg-gray-50">
                      <img src="/img/img3.png" alt="이메일 입력" className="block w-[50%]" />
                    </div>
                    <p className="text-xs mb-2">사용자 입력란에 아래 이메일을 복사하여 붙여넣기합니다.</p>

                    <div className="flex items-center mb-2 bg-gray-100 p-2 rounded-md">
                      <code className="text-xs flex-1 break-all">
                        knu-dorm-management-system@knu-dorm-management-system.iam.gserviceaccount.com
                      </code>
                      <button
                        className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            "knu-dorm-management-system@knu-dorm-management-system.iam.gserviceaccount.com",
                          )
                          alert("이메일이 클립보드에 복사되었습니다.")
                        }}
                      >
                        복사
                      </button>
                    </div>

                    <div className="mb-2 border rounded-md p-2 bg-gray-50">
                      <img src="/img/img4.png" alt="권한 설정" className="block w-[50%]" />
                    </div>
                    <p className="text-xs mb-4">권한을 "뷰어"로 변경 후 "전송" 버튼을 클릭합니다.</p>

                    <p className="mb-2 font-semibold text-base" id="3">
                      3. 시트 ID 저장
                    </p>

                    <div className="mb-2 border rounded-md p-2 bg-gray-50">
                      <img src="/img/img5.png" alt="시트 ID 복사" className="block w-[100%]" />
                    </div>
                    <p className="text-xs mb-2">
                      설문지와 연결된 구글 시트의 링크에서 위 사진과 같이 시트ID를 복사합니다.
                    </p>

                    <div className="mb-2 border rounded-md p-2 bg-gray-50">
                      <img src="/img/img6.png" alt="시트 ID 저장" className="block w-[100%]" />
                    </div>
                    <p className="text-xs mb-4">설정에서 복사한 ID를 붙여놓고 설정을 저장합니다.</p>

                    <p className="text-xs mt-3">개발자 연락처 : 010-8431-5880 이효재</p>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          {/* 건물 설정 */}
          {activeStep === "buildings" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">건물 추가</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="building-name">건물 이름</Label>
                    <Input
                      id="building-name"
                      placeholder="예: 새롬관(여)"
                      value={buildingName}
                      onChange={(e) => setBuildingName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="building-type">건물 유형</Label>
                    <Select
                      value={buildingType}
                      onValueChange={(value) =>
                        setBuildingType(value as "REFRIGERATOR" | "FREEZER" | "COMBINED" | "ALL")
                      }
                    >
                      <SelectTrigger id="building-type">
                        <SelectValue placeholder="건물 유형 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">냉장+냉동</SelectItem>
                        <SelectItem value="REFRIGERATOR">냉장고 전용</SelectItem>
                        <SelectItem value="FREEZER">냉동고 전용</SelectItem>
                        <SelectItem value="COMBINED">통합형 전용</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {showFridgeSlots && (
                    <div className="space-y-2">
                      <Label htmlFor="fridge-slots">냉장 슬롯 수</Label>
                      <Input
                        id="fridge-slots"
                        type="number"
                        placeholder="예: 50"
                        value={buildingFridgeSlots}
                        onChange={(e) => setBuildingFridgeSlots(e.target.value)}
                      />
                    </div>
                  )}
                  {showFreezerSlots && (
                    <div className="space-y-2">
                      <Label htmlFor="freezer-slots">냉동 슬롯 수</Label>
                      <Input
                        id="freezer-slots"
                        type="number"
                        placeholder="예: 30"
                        value={buildingFreezerSlots}
                        onChange={(e) => setBuildingFreezerSlots(e.target.value)}
                      />
                    </div>
                  )}
                  {showIntegratedSlots && (
                    <div className="space-y-2">
                      <Label htmlFor="integrated-slots">통합 슬롯 수</Label>
                      <Input
                        id="integrated-slots"
                        type="number"
                        placeholder="예: 20"
                        value={buildingIntegratedSlots}
                        onChange={(e) => setBuildingIntegratedSlots(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <p className="text-red-500 font-bold text-center">
                ★ 건물명은 서약서에서 응답 받는 건물명과 완전히 일치해야 합니다. ★
              </p>

              <div className="flex justify-end">
                <Button onClick={handleAddBuilding} className="mt-2">
                  {isEditMode ? "건물 수정" : "건물 추가"}
                </Button>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">건물 목록</h3>
                {isLoadingBuildings ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : buildingError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{buildingError}</AlertDescription>
                  </Alert>
                ) : !Array.isArray(buildings) || buildings.length === 0 ? (
                  <p className="text-muted-foreground">등록된 건물이 없습니다.</p>
                ) : (
                  <div className="overflow-auto rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="p-2 text-center">이름</th>
                          <th className="p-2 text-center">타입</th>
                          <th className="p-2 text-center">냉장 슬롯</th>
                          <th className="p-2 text-center">냉동 슬롯</th>
                          <th className="p-2 text-center">통합 슬롯</th>
                          <th className="p-2 text-center">작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        {buildings.map((building, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2 text-center">{building.name}</td>
                            <td className="p-2 text-center">{getBuildingTypeText(building.type)}</td>
                            <td className="p-2 text-center">{building.fridgeSlots}</td>
                            <td className="p-2 text-center">{building.freezerSlots}</td>
                            <td className="p-2 text-center">{building.integratedSlots}</td>
                            <td className="p-2 text-center">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditBuilding(building)}
                                  className="h-8 px-2 text-xs"
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" />
                                  수정
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveBuilding(index)}
                                  className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  삭제
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 관리자 설정 */}
          {activeStep === "administrators" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">관리자 추가</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">이메일</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="예: user@naver.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-name">이름</Label>
                  <Input
                    id="admin-name"
                    placeholder="예: 김유연"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-role">역할</Label>
                  <Select value={adminRole} onValueChange={(value) => setAdminRole(`${value}`)}>
                    <SelectTrigger id="admin-role">
                      <SelectValue placeholder="역할 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {adminRoles.map((role) => (
                        <SelectItem key={role.key} value={role.key}>
                          {role.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddAdmin} className="mt-2">
                {isEditAdminMode ? "관리자 수정" : "관리자 추가"}
              </Button>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">관리자 목록</h3>
                {isLoadingAdmins ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : adminError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{adminError}</AlertDescription>
                  </Alert>
                ) : !Array.isArray(administrators) || administrators.length === 0 ? (
                  <p className="text-muted-foreground">등록된 관리자가 없습니다.</p>
                ) : (
                  <div className="overflow-auto rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="p-2 text-center">이메일</th>
                          <th className="p-2 text-center">이름</th>
                          <th className="p-2 text-center">역할</th>
                          <th className="p-2 text-center">작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        {administrators.map((admin, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2 text-center">{admin.email}</td>
                            <td className="p-2 text-center">{admin.name}</td>
                            <td className="p-2 text-center">{getRoleTitleByKey(admin.role, adminRoles)}</td>
                            <td className="p-2 text-center">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditAdmin(admin)}
                                  className="h-8 px-2 text-xs"
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" />
                                  수정
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveAdmin(index)}
                                  className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  삭제
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 회차 설정 */}
          {activeStep === "rounds" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">회차 추가</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="round-name">회차 이름</Label>
                  <Input
                    id="round-name"
                    placeholder="예: 1회차"
                    value={roundName}
                    onChange={(e) => setRoundName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="round-password">비밀번호</Label>
                  <Input
                    id="round-password"
                    placeholder="비밀번호를 입력하세요"
                    value={roundPassword}
                    onChange={(e) => setRoundPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="round-start-date">시작일</Label>
                  <Input
                    id="round-start-date"
                    type="date"
                    value={roundStartDate}
                    onChange={(e) => setRoundStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="round-end-date">종료일</Label>
                  <Input
                    id="round-end-date"
                    type="date"
                    value={roundEndDate}
                    onChange={(e) => setRoundEndDate(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleAddRound} className="mt-2">
                {isEditRoundMode ? "회차 수정" : "회차 추가"}
              </Button>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">회차 목록</h3>
                {isLoadingRounds ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : roundError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{roundError}</AlertDescription>
                  </Alert>
                ) : !Array.isArray(rounds) || rounds.length === 0 ? (
                  <p className="text-muted-foreground">등록된 회차가 없습니다.</p>
                ) : (
                  <div className="overflow-auto rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="p-2 text-center">이름</th>
                          <th className="p-2 text-center">시작일</th>
                          <th className="p-2 text-center">종료일</th>
                          <th className="p-2 text-center">비밀번호</th>
                          <th className="p-2 text-center">작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rounds.map((round, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2 text-center">{round.name}</td>
                            <td className="p-2 text-center">{round.startDate}</td>
                            <td className="p-2 text-center">{round.endDate}</td>
                            <td className="p-2 text-center">{round.password}</td>
                            <td className="p-2 text-center">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRound(round)}
                                  className="h-8 px-2 text-xs"
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" />
                                  수정
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveRound(index)}
                                  className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  삭제
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 완료 */}
          {activeStep === "complete" && (
            <div className="space-y-4 text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <h3 className="text-xl font-medium">설정 완료</h3>
              <p className="text-muted-foreground">
                모든 설정이 완료되었습니다. 아래 버튼을 클릭하여 설정을 저장하고 시스템을 시작하세요.
              </p>

              {saveError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>오류 발생</AlertTitle>
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}

              {saveSuccess ? (
                <div className="mt-6">
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>설정 저장 완료</AlertTitle>
                    <AlertDescription>
                      모든 설정이 성공적으로 저장되었습니다. 이제 통합관리시스템을 사용할 수 있습니다.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={handleGoToMain} className="mt-4">
                    메인 페이지로 이동
                  </Button>
                </div>
              ) : (
                <Button onClick={handleCompleteSetup} disabled={isSaving} className="mt-4">
                  {isSaving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    "설정 저장 및 시스템 시작"
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {activeStep !== "basic" && (
            <Button variant="outline" onClick={handlePrevStep}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              이전
            </Button>
          )}
          {activeStep === "basic" && <div></div>}
          {activeStep !== "complete" && (
            <Button onClick={handleNextStep}>
              다음
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
