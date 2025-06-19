"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"

// lib
import type { Building, Administrator, AdminRole, Round, Payer, Consent, Business } from "@/lib/interfaces"
import { API_PATHS } from "@/lib/api-config"
import { get, post, put, del } from "@/lib/api-client"
import { getBuildingTypeText as utilsGetBuildingTypeText, calculateTotalSlots as utilsCalculateTotalSlots, convertToCSV as utilsConvertToCSV, downloadCSV, setStorageValue, formatDate } from "@/lib/utils"

// components ui
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { AlertCircle, RefreshCw, FileOutputIcon as FileExport, AlertTriangle, Pencil, Trash2, Plus, X, Loader2 } from "lucide-react"

import { useForm } from "react-hook-form"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [default_amount, setDefaultAmount] = useState("7000")
  const [google_sheet_id, setGoogleSheetId] = useState("")
  const [isExportingPayers, setIsExportingPayers] = useState(false)
  const [isExportingConsents, setIsExportingConsents] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  // 초기화 관련 상태
  const [isResetPayersDialogOpen, setIsResetPayersDialogOpen] = useState(false)
  const [isResetConsentsDialogOpen, setIsResetConsentsDialogOpen] = useState(false)
  const [isResetFridgeDialogOpen, setIsResetFridgeDialogOpen] = useState(false)
  const [resetConfirmCount, setResetConfirmCount] = useState(0)
  const [resetType, setResetType] = useState<"payers" | "consents" | "fridge" | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  // 건물 관리 관련 상태
  const [buildings, setBuildings] = useState<Building[]>([])
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false)
  const [buildingError, setBuildingError] = useState<string | null>(null)

  // 관리자 관련 상태
  const [administrators, setAdministrators] = useState<Administrator[]>([])
  const [isLoadingAdministrators, setIsLoadingAdministrators] = useState(false)
  const [administratorError, setAdministratorError] = useState<string | null>(null)

  // 회차 관리 관련 상태
  const [rounds, setRounds] = useState<Round[]>([])
  const [isLoadingRounds, setIsLoadingRounds] = useState(false)
  const [roundError, setRoundError] = useState<string | null>(null)

  // 건물 추가/수정 다이얼로그 관련 상태
  const [isBuildingDialogOpen, setIsBuildingDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null)
  const [buildingName, setBuildingName] = useState("")
  const [buildingType, setBuildingType] = useState<"REFRIGERATOR" | "FREEZER" | "COMBINED" | "ALL">("ALL")
  const [buildingFridgeSlots, setBuildingFridgeSlots] = useState("")
  const [buildingFreezerSlots, setBuildingFreezerSlots] = useState("")
  const [buildingIntegratedSlots, setBuildingIntegratedSlots] = useState("")

  // 관리자 다이얼로그 관련 상태
  const [isAdministratorDialogOpen, setIsAdministratorDialogOpen] = useState(false)
  const [administratorEmail, setAdministratorEmail] = useState("")
  const [administratorName, setAdministratorName] = useState("")
  const [administratorRole, setAdministratorRole] = useState("")
  const [isEditAdminMode, setIsEditAdminMode] = useState(false)
  const [currentAdministrator, setCurrentAdministrator] = useState<Administrator | null>(null)

  // 회차 추가/수정 다이얼로그 관련 상태
  const [isRoundDialogOpen, setIsRoundDialogOpen] = useState(false)
  const [isEditRoundMode, setIsEditRoundMode] = useState(false)
  const [currentRound, setCurrentRound] = useState<Round | null>(null)
  const [roundName, setRoundName] = useState("")
  const [roundStartDate, setRoundStartDate] = useState("")
  const [roundEndDate, setRoundEndDate] = useState("")
  const [roundPassword, setRoundPassword] = useState("")

  // 건물 삭제 다이얼로그 관련 상태
  const [isDeleteBuildingDialogOpen, setIsDeleteBuildingDialogOpen] = useState(false)
  const [buildingToDelete, setBuildingToDelete] = useState<Building | null>(null)
  const [isDeletingBuilding, setIsDeletingBuilding] = useState(false)

  // 관리자 삭제 다이얼로그 관련 상태
  const [isDeleteAdministratorDialogOpen, setIsDeleteAdministratorDialogOpen] = useState(false)
  const [administratorToDelete, setAdministratorToDelete] = useState<Administrator | null>(null)
  const [isDeletingAdministrator, setIsDeletingAdministrator] = useState(false)

  // 회차 삭제 다이얼로그 관련 상태
  const [isDeleteRoundDialogOpen, setIsDeleteRoundDialogOpen] = useState(false)
  const [roundToDelete, setRoundToDelete] = useState<Round | null>(null)
  const [isDeletingRound, setIsDeletingRound] = useState(false)

  // 건물 타입에 따른 슬롯 입력 필드 표시 여부 결정
  const [showFridgeSlots, setShowFridgeSlots] = useState(false)
  const [showFreezerSlots, setShowFreezerSlots] = useState(false)
  const [showIntegratedSlots, setShowIntegratedSlots] = useState(false)

  // 관리자 역할 목록 상태
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([])

  // 사업 관련 상태
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(false)
  const [businessError, setBusinessError] = useState<string | null>(null)
  const [isBusinessDialogOpen, setIsBusinessDialogOpen] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [isDeleteBusinessDialogOpen, setIsDeleteBusinessDialogOpen] = useState(false)
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null)
  const [isDeletingBusiness, setIsDeletingBusiness] = useState(false)

  // 작업 완료 알림을 위한 상태 추가
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error" | "info"
    message: string
  } | null>(null)

  const handleDefaultAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDefaultAmount(e.target.value)
    setStorageValue("default_amount", e.target.value)
  }, [])

  const handleGoogleSheetIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGoogleSheetId(e.target.value)
    setStorageValue("google_sheet_id", e.target.value)
  }, [])

  useEffect(() => {
    if (!saveSuccess) return

    const timeout = setTimeout(() => setSaveSuccess(false), 3000)
    return () => clearTimeout(timeout) // 기존 타이머 정리
  }, [saveSuccess])

  useEffect(() => {
    if (!exportSuccess) return

    const timeout = setTimeout(() => setExportSuccess(false), 3000)
    return () => clearTimeout(timeout) // 기존 타이머 정리
  }, [exportSuccess])

  // actionMessage 자동 제거
  useEffect(() => {
    if (!actionMessage) return

    // info 타입은 자동으로 닫히지 않도록 함
    if (actionMessage.type === "info") return

    const timeout = setTimeout(() => setActionMessage(null), actionMessage.type === "error" ? 60000 : 3000)

    return () => clearTimeout(timeout)
  }, [actionMessage])

  // 기본 납부 금액 가져오기 및 구글 시트 ID 가져오기 부분 수정
  // 이 useEffect를 다음과 같이 수정합니다:

  useEffect(() => {
    // 일반 탭일 때만 기본 납부 금액과 구글 시트 ID를 가져옴
    if (activeTab === "general") {
      // 기본 납부 금액 가져오기
      const fetchDefaultAmount = async () => {
        try {
          const data = await get<string>(API_PATHS.CONFIG_DEFAULT_AMOUNT)
          setDefaultAmount(data || "7000") // Ensure it's never undefined
        } catch (error) {
          console.error("Error fetching default amount:", error)
          setDefaultAmount("7000")
        }
      }

      // 서약서 구글 시트 ID 가져오기
      const fetchGoogleSheetId = async () => {
        try {
          const data = await get<string>(API_PATHS.CONFIG_GOOGLE_SHEET_ID)
          // 응답이 유효한 문자열인지 확인
          if (data && data !== "[object Object]") {
            setGoogleSheetId(data)
          } else {
            setGoogleSheetId("")
          }
        } catch (error) {
          console.error("Error fetching Google Sheet ID:", error)
          setGoogleSheetId("")
        }
      }

      fetchDefaultAmount()
      fetchGoogleSheetId()
    }

    // 건물 목록 로드
    if (activeTab === "buildings") {
      fetchBuildings()
    }

    // 관리자 목록 로드
    if (activeTab === "administrators") {
      fetchAdminRoles().then(() => fetchAdministrators())
    }

    // 회차 목록 로드
    if (activeTab === "rounds") {
      fetchRounds()
    }

    // 사업 목록 로드
    if (activeTab === "business") {
      fetchBusinesses()
    }
  }, [activeTab])

  // 건물 목록 가져오기 함수 수정
  const fetchBuildings = async () => {
    setIsLoadingBuildings(true)
    setBuildingError(null)

    try {
      const data = await get<Building[]>(API_PATHS.BUILDING)
      setBuildings(data || [])
    } catch (error) {
      console.error("Error fetching buildings:", error)
      setBuildingError("서버 연결 오류가 발생했습니다.")
      setBuildings([])
    } finally {
      setIsLoadingBuildings(false)
    }
  }

  // 관리자 목록 가져오기 함수 수정
  const fetchAdministrators = async () => {
    setIsLoadingAdministrators(true)
    setAdministratorError(null)

    try {
      const data = await get<Administrator[]>(API_PATHS.ADMINS)
      setAdministrators(data || [])
    } catch (error) {
      console.error("Error fetching administrators:", error)
      setAdministratorError("서버 연결 오류가 발생했습니다.")
      setAdministrators([])
    } finally {
      setIsLoadingAdministrators(false)
    }
  }

  // 회차 목록 가져오기 함수 수정
  const fetchRounds = async () => {
    setIsLoadingRounds(true)
    setRoundError(null)

    try {
      const data = await get<Round[]>(API_PATHS.ROUNDS)
      // 시작일 기준으로 정렬 (빠른순)
      const sortedRounds = (data || []).sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      )
      setRounds(sortedRounds)
    } catch (error) {
      console.error("Error fetching rounds:", error)
      setRoundError("서버 연결 오류가 발생했습니다.")
      // 오류 발생 시 빈 배열로 설정
      setRounds([])
    } finally {
      setIsLoadingRounds(false)
    }
  }

  // 관리자 역할 목록 가져오기 함수 수정
  const fetchAdminRoles = async () => {
    try {
      // API 호출
      const data = await get<AdminRole[]>(API_PATHS.ADMINS_ROLES)
      setAdminRoles(data || [])

      // 첫 번째 역할을 기본값으로 설정
      if (data && data.length > 0) {
        setAdministratorRole(data[0].key)
      }
    } catch (error) {
      console.error("Error fetching admin roles:", error)
      // Keep the default admin roles if there's an error
    }
  }

  // (납부자, 서약서) 목록 CSV 내보내기
  const exportCSVData = async <T extends { id: number }>(
    apiPath: string, type: string, fileNamePrefix: string, setIsExporting: (isExporting: boolean) => void
  ) => {
    setIsExporting(true)
    try {
      const data = await get<T[]>(apiPath)
      const sortedData = data.sort((a, b) => a.id - b.id)
      const csvContent = utilsConvertToCSV(sortedData, type)

      // 한국 시간으로 날짜 및 시간 포맷
      const now = new Date();
      const kstOffset = now.getTimezoneOffset() * 60000; // 분 단위를 밀리초로 변환
      const kstDate = new Date(now.getTime() - kstOffset);
      const formattedDate = kstDate.toISOString().replace("T", "_").replace(/:/g, "-").split(".")[0];

      downloadCSV(csvContent, `${fileNamePrefix}_목록_${formattedDate}.csv`);
      setExportSuccess(true)
    } catch (error) {
      console.error("CSV 내보내기 중 오류 발생:", error)
      setActionMessage({
        type: "error",
        message: `CSV 내보내기 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsExporting(false)
    }
  }

  // 납부자 목록 CSV 내보내기
  const handleExportPayerCSV = () => {
    exportCSVData<Payer>(API_PATHS.PAYMENT, "payers", "납부자", setIsExportingPayers)
  }

  // 서약서 목록 CSV 내보내기
  const handleExportConsentCSV = () => {
    exportCSVData<Consent>(API_PATHS.SURVEY, "consents", "서약서", setIsExportingConsents)
  }

  /**
   * 저장 - 일반, 건물, 관리자, 회차, 사업
   */
    // 일반 탭 - 기본 납부 금액, 구글 시트 ID 저장
  const handleGeneralSave = async () => {
      // 기본 납부 금액 검증
      if (!default_amount || Number.parseInt(default_amount) <= 0) {
        setActionMessage({
          type: "error",
          message: "유효한 기본 납부 금액을 입력해주세요.",
        })
        return
      }

      setIsSaving(true)

      try {
        // 기본 납부 금액 저장
        await post(API_PATHS.CONFIG_DEFAULT_AMOUNT, default_amount)

        // 구글 시트 ID는 값이 있는 경우에만 API를 통해 저장
        if (google_sheet_id && google_sheet_id.trim() !== "") {
          await post(API_PATHS.CONFIG_GOOGLE_SHEET_ID, google_sheet_id.trim())
        }

        setSaveSuccess(true)
        setActionMessage({
          type: "success",
          message: "성공적으로 저장되었습니다.",
        })
      } catch (error) {
        console.error("Error saving settings:", error)
        setActionMessage({
          type: "error",
          message: `설정 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        })
      } finally {
        setIsSaving(false)
      }
    }

  // 건물 추가 버튼 클릭
  const handleAddBuilding = () => {
    // 초기화
    setIsEditMode(false)
    setCurrentBuilding(null)
    setBuildingName("")
    setBuildingType("ALL")
    setBuildingFridgeSlots("0")
    setBuildingFreezerSlots("0")
    setBuildingIntegratedSlots("0")
    setIsBuildingDialogOpen(true)
  }

  // 건물 저장 (추가 또는 수정)
  const handleSaveBuilding = async () => {
    // 입력 검증
    if (!buildingName.trim()) {
      setActionMessage({
        type: "error",
        message: "건물 이름을 입력해주세요.",
      })
      return
    }

    setIsSaving(true)

    try {
      const fridgeSlots = Number.parseInt(buildingFridgeSlots)
      const freezerSlots = Number.parseInt(buildingFreezerSlots)
      const integratedSlots = Number.parseInt(buildingIntegratedSlots)

      if (isEditMode && currentBuilding) {
        // 수정 모드 - PUT 요청
        await put(API_PATHS.BUILDING_BY_ID(currentBuilding.id), {
          name: buildingName,
          type: buildingType,
          fridgeSlots,
          freezerSlots,
          integratedSlots,
        })
      } else {
        // 추가 모드 - POST 요청
        await post(API_PATHS.BUILDING, {
          name: buildingName,
          type: buildingType,
          fridgeSlots,
          freezerSlots,
          integratedSlots,
        })
      }

      // 성공 시 목록 다시 불러오기
      await fetchBuildings()

      // 다이얼로그 닫기
      setIsBuildingDialogOpen(false)
      setActionMessage({
        type: "success",
        message: "건물이 성공적으로 저장되었습니다.",
      })
    } catch (error) {
      console.error("Error saving building:", error)
      setActionMessage({
        type: "error",
        message: `건물 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      })
      // 오류 발생 시 다이얼로그 닫기
      setIsBuildingDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  // 초기화 다이얼로그 열기
  const openResetDialog = (type: "payers" | "consents" | "fridge") => {
    setResetType(type)
    setResetConfirmCount(0)
    if (type === "payers") {
      setIsResetPayersDialogOpen(true)
    } else if (type === "consents") {
      setIsResetConsentsDialogOpen(true)
    } else {
      setIsResetFridgeDialogOpen(true)
    }
  }

  // 초기화 확인 버튼 클릭 처리
  const handleResetConfirm = async () => {
    if (resetConfirmCount < 2) {
      // 아직 3번 클릭하지 않았으면 카운트 증가
      setResetConfirmCount(resetConfirmCount + 1)
      return
    }

    // 3번 클릭했으면 초기화 실행
    setIsResetting(true)

    try {
      let endpoint
      let successMessage

      if (resetType === "payers") {
        endpoint = API_PATHS.PAYMENT
        successMessage = "납부자 목록이 성공적으로 초기화되었습니다."
      } else if (resetType === "consents") {
        endpoint = API_PATHS.SURVEY
        successMessage = "서약서 목록이 성공적으로 초기화되었습니다."
      } else {
        endpoint = API_PATHS.FRIDGE
        successMessage = "냉장고 신청 목록이 성공적으로 초기화되었습니다."
      }

      // 환경에 상관없이 del 함수 호출
      await del(endpoint)

      // 성공 메시지 표시
      setActionMessage({
        type: "success",
        message: successMessage,
      })

      // 다이얼로그 닫기
      if (resetType === "payers") {
        setIsResetPayersDialogOpen(false)
      } else if (resetType === "consents") {
        setIsResetConsentsDialogOpen(false)
      } else {
        setIsResetFridgeDialogOpen(false)
      }
    } catch (error: unknown) {
      console.error("초기화 중 오류 발생:", error)
      setActionMessage({
        type: "error",
        message: `초기화 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
      })

      // 오류 발생 시에도 다이얼로그 닫기
      if (resetType === "payers") {
        setIsResetPayersDialogOpen(false)
      } else if (resetType === "consents") {
        setIsResetConsentsDialogOpen(false)
      } else {
        setIsResetFridgeDialogOpen(false)
      }
    } finally {
      setIsResetting(false)
      setResetConfirmCount(0)
      setResetType(null)
    }
  }

  // 회차 추가 버튼 클릭
  const handleAddRound = () => {
    setIsEditRoundMode(false)
    setCurrentRound(null)
    setRoundName("")
    setRoundStartDate("")
    setRoundEndDate("")
    setRoundPassword("") // 비밀번호 초기화
    setIsRoundDialogOpen(true)
  }

  // 회차 수정 버튼 클릭
  const handleEditRound = (round: Round) => {
    setIsEditRoundMode(true)
    setCurrentRound(round)
    setRoundName(round.name || "")
    setRoundStartDate(round.startDate || "")
    setRoundEndDate(round.endDate || "")
    setRoundPassword(round.password || "")
    setIsRoundDialogOpen(true)
  }

  // 건물 수정 버튼 클릭
  const handleEditBuilding = (building: Building) => {
    setIsEditMode(true)
    setCurrentBuilding(building)
    setBuildingName(building.name || "")
    setBuildingType(building.type || "ALL")
    setBuildingFridgeSlots(building.fridgeSlots?.toString() || "0")
    setBuildingFreezerSlots(building.freezerSlots?.toString() || "0")
    setBuildingIntegratedSlots(building.integratedSlots?.toString() || "0")
    setIsBuildingDialogOpen(true)
  }

  // 건물 삭제 버튼 클릭
  const handleDeleteBuilding = (building: Building) => {
    setBuildingToDelete(building)
    setIsDeleteBuildingDialogOpen(true)
  }

  // 회차 삭제 버튼 클릭
  const handleDeleteRound = (round: Round) => {
    setRoundToDelete(round)
    setIsDeleteRoundDialogOpen(true)
  }

  // 관리자 수정 버튼 클릭
  const handleEditAdministrator = (administrator: Administrator) => {
    setIsEditAdminMode(true)
    setCurrentAdministrator(administrator)
    setAdministratorEmail(administrator.email || "")
    setAdministratorName(administrator.name || "")
    setAdministratorRole(administrator.role || "")
    setIsAdministratorDialogOpen(true)
  }

  // 관리자 추가 버튼 클릭 함수 수정
  const handleAddAdministrator = () => {
    setIsEditAdminMode(false)
    setCurrentAdministrator(null)
    setAdministratorEmail("")
    setAdministratorName("")
    // 첫 번째 역할 선택 (기본값)
    setAdministratorRole(adminRoles.length > 0 ? adminRoles[0].key : "")
    setIsAdministratorDialogOpen(true)
  }

  // 관리자 삭제 버튼 클릭
  const handleDeleteAdministrator = (administrator: Administrator) => {
    setAdministratorToDelete(administrator)
    setIsDeleteAdministratorDialogOpen(true)
  }

  // 건물 삭제 확인
  const confirmDeleteBuilding = async () => {
    if (!buildingToDelete) return

    setIsDeletingBuilding(true)

    try {
      // 환경에 상없이 del 함수 호출
      await del(API_PATHS.BUILDING_BY_ID(buildingToDelete.id))

      // 성공 시 목록 다시 불러오기
      await fetchBuildings()

      // 다이얼로그 닫기
      setIsDeleteBuildingDialogOpen(false)
      setBuildingToDelete(null)
      setActionMessage({
        type: "success",
        message: "건물이 성공적으로 삭제되었습니다.",
      })
    } catch (error) {
      console.error("Error deleting building:", error)
      setActionMessage({
        type: "error",
        message: `건물 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsDeletingBuilding(false)
    }
  }

  // 회차 삭제 확인
  const confirmDeleteRound = async () => {
    if (!roundToDelete) return

    setIsDeletingRound(true)

    try {
      // 환경에 상관없이 del 함수 호출
      await del(API_PATHS.ROUNDS_BY_ID(roundToDelete.id))

      // 성공 시 목록 다시 불러오기
      await fetchRounds()

      // 다이얼로그 닫기
      setIsDeleteRoundDialogOpen(false)
      setRoundToDelete(null)
      setActionMessage({
        type: "success",
        message: "회차가 성공적으로 삭제되었습니다.",
      })
    } catch (error) {
      console.error("Error deleting round:", error)
      setActionMessage({
        type: "error",
        message: `회차 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsDeletingRound(false)
    }
  }

  // 관리자 삭제 확인 함수 수정
  const confirmDeleteAdministrator = async () => {
    if (!administratorToDelete || administratorToDelete.id === undefined) return

    setIsDeletingAdministrator(true)

    try {
      // 환경에 상관없이 del 함수 호출
      await del(API_PATHS.ADMINS_BY_ID(administratorToDelete.id))

      // 성공 시 목록 다시 불러오기
      setAdministrators((prevAdmins) => prevAdmins.filter((a) => a.id !== administratorToDelete.id))
      setActionMessage({
        type: "success",
        message: "관리자가 성공적으로 삭제되었습니다.",
      })
    } catch (error) {
      console.error("Error deleting administrator:", error)
      setActionMessage({
        type: "error",
        message: `관리자 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsDeletingAdministrator(false)
    }

    // 다이얼로그 닫기
    setIsDeleteAdministratorDialogOpen(false)
    setAdministratorToDelete(null)
  }

  // 회차 저장 (추가 또는 수정)
  const handleSaveRound = async () => {
    // 입력 검증
    if (!roundName.trim()) {
      setActionMessage({
        type: "error",
        message: "회차 이름을 입력해주세요.",
      })
      return
    }

    if (!roundStartDate) {
      setActionMessage({
        type: "error",
        message: "시작일을 입력해주세요.",
      })
      return
    }

    if (!roundEndDate) {
      setActionMessage({
        type: "error",
        message: "종료일을 입력해주세요.",
      })
      return
    }

    if (!roundPassword || roundPassword.trim() === "") {
      setActionMessage({
        type: "error",
        message: "비밀번호를 입력해주세요.",
      })
      return
    }

    // 시작일이 종료일보다 이후인지 확인
    if (new Date(roundStartDate) > new Date(roundEndDate)) {
      setActionMessage({
        type: "error",
        message: "시작일은 종료일보다 이전이어야 합니다.",
      })
      return
    }

    setIsSaving(true)

    try {
      if (isEditRoundMode && currentRound) {
        // roun variable was undeclared.
        await put(API_PATHS.ROUNDS_BY_ID(currentRound.id), {
          name: roundName,
          startDate: roundStartDate,
          endDate: roundEndDate,
          password: roundPassword,
        })
      } else {
        // 추가 모드 - POST 요청
        await post(API_PATHS.ROUNDS, {
          name: roundName,
          startDate: roundStartDate,
          endDate: roundEndDate,
          password: roundPassword,
        })
      }

      // 성공 시 목록 다시 불러오기
      await fetchRounds()

      // 다이얼로그 닫기
      setIsRoundDialogOpen(false)
      setActionMessage({
        type: "success",
        message: "회차가 성공적으로 저장되었습니다.",
      })
    } catch (error) {
      console.error("Error saving round:", error)
      setActionMessage({
        type: "error",
        message: `회차 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      })
      // 오류 발생 시 다이얼로그 닫기
      setIsRoundDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  // 관리자 저장 함수 수정
  const handleSaveAdministrator = async () => {
    // 입력 검증
    if (!administratorEmail.trim()) {
      setActionMessage({
        type: "error",
        message: "이메일을 입력해주세요.",
      })
      return
    }

    if (!administratorName.trim()) {
      setActionMessage({
        type: "error",
        message: "이름을 입력해주세요.",
      })
      return
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(administratorEmail)) {
      setActionMessage({
        type: "error",
        message: "유효한 이메일 주소를 입력해주세요.",
      })
      return
    }

    setIsSaving(true)

    try {
      if (isEditAdminMode && currentAdministrator && currentAdministrator.id !== undefined) {
        // 수정 모드 - PUT 요청
        await put(API_PATHS.ADMINS_BY_ID(currentAdministrator.id), {
          email: administratorEmail,
          name: administratorName,
          role: administratorRole,
        })
      } else {
        // 추가 모드 - POST 요청
        await post(API_PATHS.ADMINS, {
          email: administratorEmail,
          name: administratorName,
          role: administratorRole,
        })
      }

      // 다이얼로그 닫기
      setIsAdministratorDialogOpen(false)

      // 성공 시 목록 다시 불러오기
      await fetchAdministrators()
      setActionMessage({
        type: "success",
        message: "관리자가 성공적으로 저장되었습니다.",
      })
    } catch (error) {
      console.error("Error saving administrator:", error)
      setActionMessage({
        type: "error",
        message: `관리자 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      })
      // 오류 발생 시 다이얼로그 닫기
      setIsAdministratorDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  // 건물 총 슬롯 계산 함수
  const calculateTotalSlots = (building: Building) => {
    return utilsCalculateTotalSlots(building)
  }

  // 건물 타입 텍스트 변환 함수
  const getBuildingTypeText = utilsGetBuildingTypeText

  useEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = `
    @keyframes shrinkLeftSuccess {
      0% {
        width: 100%;
      }
      100% {
        width: 0%;
      }
    }

    @keyframes shrinkLeftError {
      0% {
        width: 100%;
      }
      100% {
        width: 0%;
      }
    }
  `
    const styleElement = document.createElement("style")
    styleElement.innerHTML = style.innerHTML
    document.head.appendChild(styleElement)

    // Clean up
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  useEffect(() => {
    setShowFridgeSlots(buildingType === "REFRIGERATOR" || buildingType === "ALL")
    setShowFreezerSlots(buildingType === "FREEZER" || buildingType === "ALL")
    setShowIntegratedSlots(buildingType === "COMBINED" || buildingType === "ALL")
  }, [buildingType])

  // useEffect 내에서 API를 통해 역할 목록을 가져오는 코드 추가
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await get<AdminRole[]>(API_PATHS.ADMINS_ROLES)
        setAdminRoles(data || [])
      } catch (error) {
        console.error("Failed to fetch admin roles:", error)
      }
    }

    fetchRoles()
  }, [])

  // getRoleTitleByKey 함수 추가
  const getRoleTitleByKey = (key: string, adminRoles: AdminRole[]): string => {
    const role = adminRoles.find((role) => role.key === key)
    return role ? role.title : key
  }

  // 사업 목록 가져오기 함수
  const fetchBusinesses = async () => {
    setIsLoadingBusinesses(true)
    setBusinessError(null)

    try {
      const data = await get<Business[]>(API_PATHS.BUSINESS)
      setBusinesses(data || [])
    } catch (error) {
      console.error("Error fetching businesses:", error)
      setBusinessError("서버 연결 오류가 발생했습니다.")
      setBusinesses([])
    } finally {
      setIsLoadingBusinesses(false)
    }
  }

  // 사업 추가 버튼 클릭
  const handleAddBusiness = () => {
    setBusinessName("")
    setIsBusinessDialogOpen(true)
  }

  // 사업 저장
  const handleSaveBusiness = async () => {
    // 입력 검증
    if (!businessName.trim()) {
      setActionMessage({
        type: "error",
        message: "사업 이름을 입력해주세요.",
      })
      return
    }

    setIsSaving(true)

    try {
      // 추가 모드 - POST 요청 (사업 이름만 문자열로 전송)
      await post(API_PATHS.BUSINESS, businessName)

      // 성공 시 목록 다시 불러오기
      await fetchBusinesses()

      // 다이얼로그 닫기
      setIsBusinessDialogOpen(false)
      setActionMessage({
        type: "success",
        message: "사업이 성공적으로 저장되었습니다.",
      })
    } catch (error) {
      console.error("Error saving business:", error)
      setActionMessage({
        type: "error",
        message: `사업 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      })
      // 오류 발생 시 다이얼로그 닫기
      setIsBusinessDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  // 사업 삭제 버튼 클릭
  const handleDeleteBusiness = (business: Business) => {
    setBusinessToDelete(business)
    setIsDeleteBusinessDialogOpen(true)
  }

  // 사업 삭제 확인
  const confirmDeleteBusiness = async () => {
    if (!businessToDelete) return

    setIsDeletingBusiness(true)

    try {
      // 환경에 상관없이 del 함수 호출
      await del(API_PATHS.BUSINESS_BY_ID(businessToDelete.id))

      // 성공 시 목록 다시 불러오기
      await fetchBusinesses()

      // 다이얼로그 닫기
      setIsDeleteBusinessDialogOpen(false)
      setBusinessToDelete(null)
      setActionMessage({
        type: "success",
        message: "사업이 성공적으로 삭제되었습니다.",
      })
    } catch (error) {
      console.error("Error deleting business:", error)
      setActionMessage({
        type: "error",
        message: `사업 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsDeletingBusiness(false)
    }
  }

  return (
    <>
      {actionMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md transition-opacity duration-300 overflow-hidden ${
            actionMessage.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : actionMessage.type === "info"
                ? "bg-blue-100 text-blue-800 border border-blue-200"
                : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            {actionMessage.type === "info" && (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>{actionMessage.message}</span>
              </div>
            )}
            {actionMessage.type !== "info" && <span>{actionMessage.message}</span>}
            <button onClick={() => setActionMessage(null)} className="ml-4 text-gray-500 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          {actionMessage.type !== "info" && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 mt-2">
              <div
                className={`h-full ${
                  actionMessage.type === "success"
                    ? "bg-green-500 animate-shrink-left-success"
                    : "bg-red-500 animate-shrink-left-error"
                }`}
              ></div>
            </div>
          )}
        </div>
      )}
      <div className="max-w-3xl mx-auto">
        {/* 제목 부분에 md:block hidden 클래스 추가하여 모바일에서 숨기기 */}
        <h1 className="text-2xl font-semibold mb-4 md:block hidden">설정</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">일반</TabsTrigger>
            <TabsTrigger value="buildings">건물</TabsTrigger>
            <TabsTrigger value="administrators">관리자</TabsTrigger>
            <TabsTrigger value="rounds">회차</TabsTrigger>
            <TabsTrigger value="business">사업</TabsTrigger>
            <TabsTrigger value="system">시스템</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <Card className="border bg-card text-card-foreground">
              <CardContent className="space-y-6 px-4">
                <div className="flex items-center gap-4 mt-4">
                  <Label htmlFor="default_amount" className="w-1/3">
                    기본 납부 금액
                  </Label>
                  <Input
                    id="default_amount"
                    type="number"
                    value={default_amount || ""}
                    onChange={handleDefaultAmountChange}
                    className="w-2/3"
                  />
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <Label htmlFor="google_sheet_id" className="w-1/3">
                    서약서 구글 시트 ID
                  </Label>
                  <Input
                    id="google_sheet_id"
                    type="text"
                    placeholder="예: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    value={google_sheet_id || ""}
                    onChange={handleGoogleSheetIdChange}
                    className="w-2/3"
                    autoComplete="off"
                  />
                </div>

                <div className="pt-6 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleExportPayerCSV}
                    disabled={isExportingPayers}
                  >
                    {isExportingPayers ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        내보내는 중...
                      </>
                    ) : (
                      <>
                        <FileExport className="mr-2 h-4 w-4" />
                        납부자 목록 CSV 내보내기
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleExportConsentCSV}
                    disabled={isExportingConsents}
                  >
                    {isExportingConsents ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        내보내는 중...
                      </>
                    ) : (
                      <>
                        <FileExport className="mr-2 h-4 w-4" />
                        서약서 목록 CSV 내보내기
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => openResetDialog("payers")}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    납부자 목록 초기화
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => openResetDialog("consents")}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    서약서 목록 초기화
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => openResetDialog("fridge")}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    냉장고 신청 목록 초기화
                  </Button>
                </div>

                <div className="px-4 py-4 border-t">
                  <Button className="w-full" onClick={handleGeneralSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      "저장"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buildings" className="mt-6">
            <Card className="border bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-end">
                <Button onClick={handleAddBuilding} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  건물 추가
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingBuildings ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : buildingError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{buildingError}</AlertDescription>
                  </Alert>
                ) : buildings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 건물이 없습니다. 건물을 추가해주세요.
                  </div>
                ) : (
                  <div className="overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[60px] hidden">ID</TableHead>
                          <TableHead className="text-center">이름</TableHead>
                          <TableHead className="text-center">유형</TableHead>
                          <TableHead className="text-center">냉장 슬롯</TableHead>
                          <TableHead className="text-center">냉동 슬롯</TableHead>
                          <TableHead className="text-center">통합 슬롯</TableHead>
                          <TableHead className="text-center">총 슬롯</TableHead>
                          <TableHead className="text-center">작업</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {buildings &&
                          buildings.length > 0 &&
                          buildings.map((building) => {
                            return (
                              <TableRow key={building.id} className="hover:bg-muted/30">
                                <TableCell className="font-medium hidden">{building.id}</TableCell>
                                <TableCell className="font-medium text-center">{building.name}</TableCell>
                                <TableCell className="text-center">{getBuildingTypeText(building.type)}</TableCell>
                                <TableCell className="text-center">{building.fridgeSlots}</TableCell>
                                <TableCell className="text-center">{building.freezerSlots}</TableCell>
                                <TableCell className="text-center">{building.integratedSlots}</TableCell>
                                <TableCell className="text-center">{calculateTotalSlots(building)}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditBuilding(building)}
                                      title="수정"
                                      className="h-8 px-2 text-xs"
                                    >
                                      <Pencil className="h-3.5 w-3.5 mr-1" />
                                      수정
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteBuilding(building)}
                                      title="삭제"
                                      className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                                      삭제
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="administrators" className="mt-6">
            <Card className="border bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-end">
                <Button onClick={handleAddAdministrator} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  관리자 추가
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingAdministrators ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : administratorError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{administratorError}</AlertDescription>
                  </Alert>
                ) : administrators.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 관리자가 없습니다. 관리자를 추가해주세요.
                  </div>
                ) : (
                  <div className="overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[60px] hidden">ID</TableHead>
                          <TableHead className="text-center">이메일</TableHead>
                          <TableHead className="text-center">이름</TableHead>
                          <TableHead className="text-center">역할</TableHead>
                          <TableHead className="text-center">등록일</TableHead>
                          <TableHead className="text-center">작업</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {administrators &&
                          administrators.length > 0 &&
                          administrators.map((administrator) => {
                            return (
                              <TableRow key={administrator.id} className="hover:bg-muted/30">
                                <TableCell className="font-medium hidden">{administrator.id}</TableCell>
                                <TableCell className="text-center">{administrator.email}</TableCell>
                                <TableCell className="text-center">{administrator.name}</TableCell>
                                <TableCell className="text-center">
                                  {getRoleTitleByKey(administrator.role, adminRoles)}
                                </TableCell>
                                <TableCell className="text-center">
                                  {administrator.creationDate ? formatDate(administrator.creationDate) : "-"}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditAdministrator(administrator)}
                                      title="수정"
                                      className="h-8 px-2 text-xs"
                                    >
                                      <Pencil className="h-3.5 w-3.5 mr-1" />
                                      수정
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteAdministrator(administrator)}
                                      title="삭제"
                                      className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                                      삭제
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rounds" className="mt-6">
            <Card className="border bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-end">
                <Button onClick={handleAddRound} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  회차 추가
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingRounds ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : roundError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{roundError}</AlertDescription>
                  </Alert>
                ) : rounds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 회차가 없습니다. 회차를 추가해주세요.
                  </div>
                ) : (
                  <div className="overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[60px] hidden">ID</TableHead>
                          <TableHead className="text-center">이름</TableHead>
                          <TableHead className="text-center">시작일</TableHead>
                          <TableHead className="text-center">종료일</TableHead>
                          <TableHead className="text-center">비밀번호</TableHead>
                          <TableHead className="text-center">작업</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rounds &&
                          rounds.length > 0 &&
                          rounds.map((round) => {
                            return (
                              <TableRow key={round.id} className="hover:bg-muted/30">
                                <TableCell className="font-medium hidden">{round.id}</TableCell>
                                <TableCell className="text-center">{round.name}</TableCell>
                                <TableCell className="text-center">{round.startDate}</TableCell>
                                <TableCell className="text-center">{round.endDate}</TableCell>
                                <TableCell className="text-center">{round.password}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditRound(round)}
                                      title="수정"
                                      className="h-8 px-2 text-xs"
                                    >
                                      <Pencil className="h-3.5 w-3.5 mr-1" />
                                      수정
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteRound(round)}
                                      title="삭제"
                                      className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                                      삭제
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="mt-6">
            <Card className="border bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-end">
                <Button onClick={handleAddBusiness} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  사업 추가
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingBusinesses ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : businessError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{businessError}</AlertDescription>
                  </Alert>
                ) : businesses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 사업이 없습니다. 사업을 추가해주세요.
                  </div>
                ) : (
                  <div className="overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[60px] hidden">ID</TableHead>
                          <TableHead className="text-center">사업 이름</TableHead>
                          <TableHead className="text-center">작업</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {businesses.map((business) => (
                          <TableRow key={business.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium hidden">{business.id}</TableCell>
                            <TableCell className="text-center">{business.name}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBusiness(business)}
                                  title="삭제"
                                  className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  삭제
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="mt-6">
            <Card className="border bg-card text-card-foreground">
              <CardContent className="space-y-6 px-4">
                <div className="pt-4">
                  <h3 className="text-lg font-semibold mb-4">개발자 정보</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Label className="flex w-full items-center">
                        홍길동 / 010-1234-5678 /<span>&nbsp;</span>
                        <a
                          href="https://github.com/hyotatoFrappuccino/dormManagementSystem"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Github
                        </a>
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">업데이트 내역</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Label className="flex w-full items-center">2025.09.01 v1.0.0 정식 출시</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {/* 건물 추가/수정 다이얼로그 */}
        <Dialog open={isBuildingDialogOpen} onOpenChange={(open) => setIsBuildingDialogOpen(open)}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditMode ? "건물 수정" : "건물 추가"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="buildingName" className="text-right">
                  건물 이름
                </Label>
                <Input
                  id="buildingName"
                  value={buildingName || ""}
                  onChange={(e) => setBuildingName(e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="buildingType" className="text-right">
                  건물 유형
                </Label>
                <Select
                  value={buildingType}
                  onValueChange={(value) => setBuildingType(value as "REFRIGERATOR" | "FREEZER" | "COMBINED" | "ALL")}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="건물 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">냉장 + 냉동</SelectItem>
                    <SelectItem value="REFRIGERATOR">냉장 전용</SelectItem>
                    <SelectItem value="FREEZER">냉동 전용</SelectItem>
                    <SelectItem value="COMBINED">통합형</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showFridgeSlots && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="buildingFridgeSlots" className="text-right">
                    냉장 슬롯 수
                  </Label>
                  <Input
                    id="buildingFridgeSlots"
                    type="number"
                    value={buildingFridgeSlots || ""}
                    onChange={(e) => setBuildingFridgeSlots(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              )}

              {showFreezerSlots && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="buildingFreezerSlots" className="text-right">
                    냉동 슬롯 수
                  </Label>
                  <Input
                    id="buildingFreezerSlots"
                    type="number"
                    value={buildingFreezerSlots || ""}
                    onChange={(e) => setBuildingFreezerSlots(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              )}

              {showIntegratedSlots && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="buildingIntegratedSlots" className="text-right">
                    통합 슬롯 수
                  </Label>
                  <Input
                    id="buildingIntegratedSlots"
                    type="number"
                    value={buildingIntegratedSlots || ""}
                    onChange={(e) => setBuildingIntegratedSlots(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBuildingDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveBuilding} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isRoundDialogOpen} onOpenChange={(open) => setIsRoundDialogOpen(open)}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditRoundMode ? "회차 수정" : "회차 추가"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roundName" className="text-right">
                  회차 이름
                </Label>
                <Input
                  id="roundName"
                  value={roundName || ""}
                  onChange={(e) => setRoundName(e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roundStartDate" className="text-right">
                  시작일
                </Label>
                <Input
                  id="roundStartDate"
                  type="date"
                  value={roundStartDate || ""}
                  onChange={(e) => setRoundStartDate(e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roundEndDate" className="text-right">
                  종료일
                </Label>
                <Input
                  id="roundEndDate"
                  type="date"
                  value={roundEndDate || ""}
                  onChange={(e) => setRoundEndDate(e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roundPassword" className="text-right">
                  비밀번호
                </Label>
                <Input
                  id="roundPassword"
                  type="text"
                  value={roundPassword || ""}
                  onChange={(e) => setRoundPassword(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRoundDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveRound} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 관리자 추가/수정 다이얼로그 */}
        <Dialog open={isAdministratorDialogOpen} onOpenChange={(open) => setIsAdministratorDialogOpen(open)}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditAdminMode ? "관리자 수정" : "관리자 추가"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="administratorEmail" className="text-right">
                  이메일
                </Label>
                <Input
                  id="administratorEmail"
                  type="email"
                  value={administratorEmail || ""}
                  onChange={(e) => setAdministratorEmail(e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="administratorName" className="text-right">
                  이름
                </Label>
                <Input
                  id="administratorName"
                  type="text"
                  value={administratorName || ""}
                  onChange={(e) => setAdministratorName(e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="administratorRole" className="text-right">
                  역할
                </Label>
                <Select value={administratorRole} onValueChange={setAdministratorRole}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="관리자 역할 선택" />
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdministratorDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveAdministrator} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 건물 삭제 확인 다이얼로그 */}
        <Dialog open={isDeleteBuildingDialogOpen} onOpenChange={(open) => setIsDeleteBuildingDialogOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>건물 삭제 확인</DialogTitle>
              <DialogDescription>정말로 이 건물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteBuildingDialogOpen(false)}>
                취소
              </Button>
              <Button variant="destructive" onClick={confirmDeleteBuilding} disabled={isDeletingBuilding}>
                {isDeletingBuilding ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  "삭제"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 회차 삭제 확인 다이얼로그 */}
        <Dialog open={isDeleteRoundDialogOpen} onOpenChange={(open) => setIsDeleteRoundDialogOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>회차 삭제 확인</DialogTitle>
              <DialogDescription>
                정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                <br />
                <span className="text-red-600 font-bold">★이 회차에 등록된 모든 냉장고 신청 정보가 삭제됩니다.★</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteRoundDialogOpen(false)}>
                취소
              </Button>
              <Button variant="destructive" onClick={confirmDeleteRound} disabled={isDeletingRound}>
                {isDeletingRound ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  "삭제"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 관리자 삭제 확인 다이얼로그 */}
        <Dialog
          open={isDeleteAdministratorDialogOpen}
          onOpenChange={(open) => setIsDeleteAdministratorDialogOpen(open)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>관리자 삭제 확인</DialogTitle>
              <DialogDescription>정말로 이 관리자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteAdministratorDialogOpen(false)}>
                취소
              </Button>
              <Button variant="destructive" onClick={confirmDeleteAdministrator} disabled={isDeletingAdministrator}>
                {isDeletingAdministrator ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  "삭제"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 납부자 목록 초기화 확인 다이얼로그 */}
        <Dialog open={isResetPayersDialogOpen} onOpenChange={(open) => setIsResetPayersDialogOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>납부자 목록 초기화</DialogTitle>
              <DialogDescription>
                정말로 납부자 목록을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                <br />
                <br />
                <b>경고:</b> 초기화를 진행하려면 아래 "초기화" 버튼을 3번 클릭해야 합니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResetPayersDialogOpen(false)}>
                취소
              </Button>
              <Button variant="destructive" onClick={handleResetConfirm} disabled={isResetting}>
                {isResetting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    초기화 중...
                  </>
                ) : (
                  <>초기화 ({resetConfirmCount}/3)</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 서약서 목록 초기화 확인 다이얼로그 */}
        <Dialog open={isResetConsentsDialogOpen} onOpenChange={(open) => setIsResetConsentsDialogOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>서약서 목록 초기화</DialogTitle>
              <DialogDescription>
                정말로 서약서 목록을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                <br />
                <br />
                <b>경고:</b> 초기화를 진행하려면 아래 "초기화" 버튼을 3번 클릭해야 합니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResetConsentsDialogOpen(false)}>
                취소
              </Button>
              <Button variant="destructive" onClick={handleResetConfirm} disabled={isResetting}>
                {isResetting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    초기화 중...
                  </>
                ) : (
                  <>초기화 ({resetConfirmCount}/3)</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 냉장고 신청 목록 초기화 확인 다이얼로그 */}
        <Dialog open={isResetFridgeDialogOpen} onOpenChange={(open) => setIsResetFridgeDialogOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>냉장고 신청 목록 초기화</DialogTitle>
              <DialogDescription>
                정말로 냉장고 신청 목록을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                <br />
                <br />
                <b>경고:</b> 초기화를 진행하려면 아래 "초기화" 버튼을 3번 클릭해야 합니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResetFridgeDialogOpen(false)}>
                취소
              </Button>
              <Button variant="destructive" onClick={handleResetConfirm} disabled={isResetting}>
                {isResetting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    초기화 중...
                  </>
                ) : (
                  <>초기화 ({resetConfirmCount}/3)</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 사업 추가 다이얼로그 */}
        <Dialog open={isBusinessDialogOpen} onOpenChange={(open) => setIsBusinessDialogOpen(open)}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>사업 추가</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="businessName" className="text-right">
                  사업 이름
                </Label>
                <Input
                  id="businessName"
                  value={businessName || ""}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBusinessDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveBusiness} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 사업 삭제 확인 다이얼로그 */}
        <Dialog open={isDeleteBusinessDialogOpen} onOpenChange={(open) => setIsDeleteBusinessDialogOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>사업 삭제 확인</DialogTitle>
              <DialogDescription>
                정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                <br />
                <span className="text-red-600 font-bold">★이 사업에 등록된 모든 신청 정보가 삭제됩니다.★</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteBusinessDialogOpen(false)}>
                취소
              </Button>
              <Button variant="destructive" onClick={confirmDeleteBusiness} disabled={isDeletingBusiness}>
                {isDeletingBusiness ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  "삭제"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
