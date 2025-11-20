"use client"

import type React from "react"

import {useState, useEffect, useCallback} from "react"

// lib
import type {Building, Administrator, AdminRole, Round, Payer, Consent, Business} from "@/lib/interfaces"
import {API_PATHS} from "@/lib/api-config"
import {get, post, put, del} from "@/lib/api-client"
import {
  getBuildingTypeText as utilsGetBuildingTypeText,
  calculateTotalSlots as utilsCalculateTotalSlots,
  convertToCSV as utilsConvertToCSV,
  downloadCSV,
  setStorageValue,
  formatDate, handleError, handleSuccess
} from "@/lib/utils"

// components ui
import {Label} from "@/components/ui/label"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"

import {
  AlertCircle,
  RefreshCw,
  FileOutputIcon as FileExport,
  AlertTriangle,
  Pencil,
  Trash2,
  Plus
} from "lucide-react"

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [default_amount, setDefaultAmount] = useState("7000")
  const [google_sheet_id, setGoogleSheetId] = useState("")
  const [isExportingPayers, setIsExportingPayers] = useState(false)
  const [isExportingConsents, setIsExportingConsents] = useState(false)

  // 초기화 관련 상태
  const [resetConfirmCount, setResetConfirmCount] = useState(0)
  const [resetType, setResetType] = useState<"payers" | "consents" | "fridge" | null>(null)

  // 다이얼로그 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"addBuilding" | "deleteBuilding" | "addAdministrator" | "addRound" | "resetPayers" | "resetConsents" | "resetFridge" | "building" | "administrator" | "round" | "addBusiness" | "deleteRound" | "deleteBusiness" | "deleteAllFridge" | "deleteAllConsents" | "deleteAllPayers" | "deleteAdministrator" | null>(null);

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
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null)
  const [buildingName, setBuildingName] = useState("")
  const [buildingType, setBuildingType] = useState<"REFRIGERATOR" | "FREEZER" | "COMBINED" | "ALL">("ALL")
  const [buildingFridgeSlots, setBuildingFridgeSlots] = useState("")
  const [buildingFreezerSlots, setBuildingFreezerSlots] = useState("")
  const [buildingIntegratedSlots, setBuildingIntegratedSlots] = useState("")

  // 관리자 다이얼로그 관련 상태
  const [administratorEmail, setAdministratorEmail] = useState("")
  const [administratorName, setAdministratorName] = useState("")
  const [administratorRole, setAdministratorRole] = useState("")
  const [isEditAdminMode, setIsEditAdminMode] = useState(false)
  const [currentAdministrator, setCurrentAdministrator] = useState<Administrator | null>(null)

  // 회차 추가/수정 다이얼로그 관련 상태
  const [isEditRoundMode, setIsEditRoundMode] = useState(false)
  const [currentRound, setCurrentRound] = useState<Round | null>(null)
  const [roundName, setRoundName] = useState("")
  const [roundStartDate, setRoundStartDate] = useState("")
  const [roundEndDate, setRoundEndDate] = useState("")
  const [roundPassword, setRoundPassword] = useState("")

  // 건물 삭제 관련 상태
  const [buildingToDelete, setBuildingToDelete] = useState<Building | null>(null)

  // 관리자 삭제 관련 상태
  const [administratorToDelete, setAdministratorToDelete] = useState<Administrator | null>(null)

  // 회차 삭제 관련 상태
  const [roundToDelete, setRoundToDelete] = useState<Round | null>(null)

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
  const [businessName, setBusinessName] = useState("")
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null)

  // 오류
  const [defaultAmountError, setDefaultAmountError] = useState<string | null>(null);
  const [googleSheetIdError, setGoogleSheetIdError] = useState<string | null>(null);

  const handleDefaultAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDefaultAmount(e.target.value)
    setStorageValue("default_amount", e.target.value)
  }, [])

  const handleGoogleSheetIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGoogleSheetId(e.target.value)
    setStorageValue("google_sheet_id", e.target.value)
  }, [])

  // 기본 납부 금액 가져오기 및 구글 시트 ID 가져오기
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
      setDefaultAmountError(null)

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
      setGoogleSheetIdError(null)

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

  // 건물 목록 가져오기
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

  // 관리자 목록 가져오기
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

  // 회차 목록 가져오기
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

  // 관리자 역할 목록 가져오기
  const fetchAdminRoles = async () => {
    try {
      const data = await get<AdminRole[]>(API_PATHS.ADMINS_ROLES)
      setAdminRoles(data || [])

      // 첫 번째 역할을 기본값으로 설정
      if (data && data.length > 0) {
        setAdministratorRole(data[0].key)
      }
    } catch (error) {
      console.error("Error fetching admin roles:", error)
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
    } catch (error) {
      handleError(error, "CSV 내보내기")
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

  // 초기화 다이얼로그 열기
  const openResetDialog = (type: "payers" | "consents" | "fridge") => {
    setResetType(type)
    setResetConfirmCount(0)
    if (type === "payers") {
      setIsDialogOpen(true);
      setDialogType("deleteAllPayers");
    } else if (type === "consents") {
      setIsDialogOpen(true);
      setDialogType("deleteAllConsents");
    } else {
      setIsDialogOpen(true);
      setDialogType("deleteAllFridge");
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
    setIsSubmitting(true)

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

      await del(endpoint)

      handleSuccess(successMessage)
    } catch (error: unknown) {
      handleError(error, "초기화")
    } finally {
      // 다이얼로그 닫기
      setIsDialogOpen(false)
      setDialogType(null)
      setIsSubmitting(false)

      setResetConfirmCount(0)
      setResetType(null)
    }
  }

  /**
   * 저장 - 일반, 건물, 관리자, 회차, 사업
   */
    // 일반 탭 - 기본 납부 금액, 구글 시트 ID 저장
  const handleGeneralSave = async () => {
      // 입력 검증
      if (!default_amount || Number.parseInt(default_amount) <= 0) {
        setDefaultAmountError("금액을 입력하여주세요.")
      } else {
        setDefaultAmountError(null)
      }

      if (google_sheet_id.trim() === "") {
        setGoogleSheetIdError("시트 ID를 입력하여주세요.")
      } else {
        setGoogleSheetIdError(null)
      }

      if (defaultAmountError || googleSheetIdError) {
        return
      }

      setIsSubmitting(true)

      try {
        // 기본 납부 금액 저장
        await post(API_PATHS.CONFIG_DEFAULT_AMOUNT, default_amount)

        // 구글 시트 ID는 값이 있는 경우에만 API를 통해 저장
        if (google_sheet_id && google_sheet_id.trim() !== "") {
          await post(API_PATHS.CONFIG_GOOGLE_SHEET_ID, google_sheet_id.trim())
        }

        handleSuccess("성공적으로 반영되었습니다.")
      } catch (error) {
        handleError(error, "설정 저장")
      } finally {
        setIsDialogOpen(false)
        setDialogType(null)
        setIsSubmitting(false)
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
    setIsDialogOpen(true);
    setDialogType("addBuilding");
  }

  // 건물 저장 (추가 또는 수정)
  const handleSaveBuilding = async () => {
    // 입력 검증
    if (!buildingName.trim()) {
      return
    }

    setIsSubmitting(true)

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

      handleSuccess("성공적으로 반영되었습니다.")
    } catch (error) {
      handleError(error, "건물 추가(수정)")
    } finally {
      setIsDialogOpen(false)
      setDialogType(null)
      setIsSubmitting(false)
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
    setIsDialogOpen(true);
    setDialogType("addRound");
  }

  // 회차 수정 버튼 클릭
  const handleEditRound = (round: Round) => {
    setIsEditRoundMode(true)
    setCurrentRound(round)
    setRoundName(round.name || "")
    setRoundStartDate(round.startDate || "")
    setRoundEndDate(round.endDate || "")
    setRoundPassword(round.password || "")
    setIsDialogOpen(true);
    setDialogType("addRound");
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
    setIsDialogOpen(true)
    setDialogType("addBuilding")
  }

  // 건물 삭제 버튼 클릭
  const handleDeleteBuilding = (building: Building) => {
    setBuildingToDelete(building)
    setIsDialogOpen(true);
    setDialogType("deleteBuilding");
  }

  // 회차 삭제 버튼 클릭
  const handleDeleteRound = (round: Round) => {
    setRoundToDelete(round)
    setIsDialogOpen(true);
    setDialogType("deleteRound");
  }

  // 관리자 수정 버튼 클릭
  const handleEditAdministrator = (administrator: Administrator) => {
    setIsEditAdminMode(true)
    setCurrentAdministrator(administrator)
    setAdministratorEmail(administrator.email || "")
    setAdministratorName(administrator.name || "")
    setAdministratorRole(administrator.role || "")
    setIsDialogOpen(true)
    setDialogType("addAdministrator")
  }

  // 관리자 추가 버튼 클릭
  const handleAddAdministrator = () => {
    setIsEditAdminMode(false)
    setCurrentAdministrator(null)
    setAdministratorEmail("")
    setAdministratorName("")
    // 첫 번째 역할 선택 (기본값)
    setAdministratorRole(adminRoles.length > 0 ? adminRoles[0].key : "")
    setIsDialogOpen(true)
    setDialogType("addAdministrator")
  }

  // 관리자 삭제 버튼 클릭
  const handleDeleteAdministrator = (administrator: Administrator) => {
    setAdministratorToDelete(administrator)
    setIsDialogOpen(true);
    setDialogType("deleteAdministrator");
  }

  // 건물 삭제 확인
  const confirmDeleteBuilding = async () => {
    if (!buildingToDelete) return

    setIsSubmitting(true)

    try {
      await del(API_PATHS.BUILDING_BY_ID(buildingToDelete.id))

      // 성공 시 목록 다시 불러오기
      await fetchBuildings()

      handleSuccess("성공적으로 삭제되었습니다.")
    } catch (error) {
      handleError(error, "건물 삭제")
    } finally {
      setIsDialogOpen(false)
      setDialogType(null)
      setIsSubmitting(false)

      setBuildingToDelete(null)
    }
  }

  // 회차 삭제 확인
  const confirmDeleteRound = async () => {
    if (!roundToDelete) return

    setIsSubmitting(true)

    try {
      // 환경에 상관없이 del 함수 호출
      await del(API_PATHS.ROUNDS_BY_ID(roundToDelete.id))

      // 성공 시 목록 다시 불러오기
      await fetchRounds()

      setRoundToDelete(null)
      handleSuccess("성공적으로 삭제되었습니다.")
    } catch (error) {
      handleError(error, "회차 삭제")
    } finally {
      setIsDialogOpen(false)
      setDialogType(null)
      setIsSubmitting(false)
    }
  }

  // 관리자 삭제 확인
  const confirmDeleteAdministrator = async () => {
    if (!administratorToDelete || administratorToDelete.id === undefined) return

    setIsSubmitting(true)

    try {
      // 환경에 상관없이 del 함수 호출
      await del(API_PATHS.ADMINS_BY_ID(administratorToDelete.id))

      // 성공 시 목록 다시 불러오기
      setAdministrators((prevAdmins) => prevAdmins.filter((a) => a.id !== administratorToDelete.id))
      handleSuccess("성공적으로 삭제되었습니다.")
    } catch (error) {
      handleError(error, "관리자 삭제")
    } finally {
      setIsDialogOpen(false)
      setDialogType(null)
      setIsSubmitting(false)

      setAdministratorToDelete(null)
    }
  }

  // 회차 저장 (추가 또는 수정)
  const handleSaveRound = async () => {
    // 입력 검증
    if (!roundName.trim() || !roundStartDate || !roundEndDate || !roundPassword || roundPassword.trim() === "" || new Date(roundStartDate) > new Date(roundEndDate)) {
      return
    }

    setIsSubmitting(true)

    try {
      // 수정 모드 - PUT 요청
      if (isEditRoundMode && currentRound) {
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

      handleSuccess("성공적으로 반영되었습니다.")
    } catch (error) {
      handleError(error, "회차 추가(수정)")
    } finally {
      setIsDialogOpen(false)
      setDialogType(null)
      setIsSubmitting(false)
    }
  }

  // 관리자 저장 함수 수정
  const handleSaveAdministrator = async () => {
    // 입력 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!administratorEmail.trim() || !administratorName.trim() || !emailRegex.test(administratorEmail)) {
      return
    }

    setIsSubmitting(true)

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

      // 성공 시 목록 다시 불러오기
      await fetchAdministrators()

      handleSuccess("성공적으로 반영되었습니다.")
    } catch (error) {
      handleError(error, "관리자 추가")
    } finally {
      setIsDialogOpen(false)
      setDialogType(null)
      setIsSubmitting(false)
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
    setShowIntegratedSlots(buildingType === "COMBINED")
  }, [buildingType])

  // useEffect 내에서 API를 통해 역할 목록을 가져오는 코드
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

  // getRoleTitleByKey
  const getRoleTitleByKey = (key: string, adminRoles: AdminRole[]): string => {
    const role = adminRoles.find((role) => role.key === key)
    return role ? role.title : key
  }

  // 사업 목록 가져오기
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
    setIsDialogOpen(true);
    setDialogType("addBusiness");
  }

  // 사업 저장
  const handleSaveBusiness = async () => {
    // 입력 검증
    if (!businessName.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      await post(API_PATHS.BUSINESS, {name: businessName})

      // 성공 시 목록 다시 불러오기
      await fetchBusinesses()

      handleSuccess("성공적으로 반영되었습니다.")
    } catch (error) {
      handleError(error, "사업 추가")
    } finally {
      setIsSubmitting(false)
      setDialogType(null)
      setIsDialogOpen(false)
    }
  }

  // 사업 삭제 버튼 클릭
  const handleDeleteBusiness = (business: Business) => {
    setBusinessToDelete(business)
    setIsDialogOpen(true)
    setDialogType("deleteBusiness")
  }

  // 사업 삭제 확인
  const confirmDeleteBusiness = async () => {
    if (!businessToDelete) return

    setIsSubmitting(true)

    try {
      // 환경에 상관없이 del 함수 호출
      await del(API_PATHS.BUSINESS_BY_ID(businessToDelete.id))

      // 성공 시 목록 다시 불러오기
      await fetchBusinesses()

      handleSuccess("성공적으로 삭제되었습니다.")
    } catch (error) {
      handleError(error, "사업 삭제")
    } finally {
      setIsDialogOpen(false)
      setDialogType(null)
      setIsSubmitting(false)

      setBusinessToDelete(null)
    }
  }

  return (
    <>
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
                    className={defaultAmountError ? "border-red-500" : ""}
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
                    className={googleSheetIdError ? "border-red-500" : ""}
                    autoComplete="off"
                  />
                </div>

                <details>
                  <summary className="cursor-pointer text-sm">서약서 양식 안내</summary>
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
                    <img src="/img/img1.png" alt="응답 시트 위치" className="block w-[40%]"/>
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
                    <img src="/img/img2.png" alt="구글 시트 공유 버튼" className="block w-[25%]"/>
                  </div>
                  <p className="text-xs mb-2">구글 시트 우측 상단의 "공유" 버튼을 클릭합니다.</p>

                  <div className="mb-2 border rounded-md p-2 bg-gray-50">
                    <img src="/img/img3.png" alt="이메일 입력" className="block w-[50%]"/>
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
                    <img src="/img/img4.png" alt="권한 설정" className="block w-[50%]"/>
                  </div>
                  <p className="text-xs mb-4">권한을 "뷰어"로 변경 후 "전송" 버튼을 클릭합니다.</p>

                  <p className="mb-2 font-semibold text-base" id="3">
                    3. 시트 ID 저장
                  </p>

                  <div className="mb-2 border rounded-md p-2 bg-gray-50">
                    <img src="/img/img5.png" alt="시트 ID 복사" className="block w-[100%]"/>
                  </div>
                  <p className="text-xs mb-2">
                    설문지와 연결된 구글 시트의 링크에서 위 사진과 같이 시트ID를 복사합니다.
                  </p>

                  <div className="mb-2 border rounded-md p-2 bg-gray-50">
                    <img src="/img/img6.png" alt="시트 ID 저장" className="block w-[100%]"/>
                  </div>
                  <p className="text-xs mb-4">설정에서 복사한 ID를 붙여놓고 설정을 저장합니다.</p>
                </details>

                <div className="pt-6 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleExportPayerCSV}
                    disabled={isExportingPayers}
                  >
                    {isExportingPayers ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                        내보내는 중...
                      </>
                    ) : (
                      <>
                        <FileExport className="mr-2 h-4 w-4"/>
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
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                        내보내는 중...
                      </>
                    ) : (
                      <>
                        <FileExport className="mr-2 h-4 w-4"/>
                        서약서 목록 CSV 내보내기
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => openResetDialog("payers")}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4"/>
                    납부자 목록 초기화
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => openResetDialog("consents")}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4"/>
                    서약서 목록 초기화
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => openResetDialog("fridge")}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4"/>
                    냉장고 신청 목록 초기화
                  </Button>
                </div>

                <div className="px-4 py-4 border-t">
                  <Button className="w-full" onClick={handleGeneralSave} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
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
                  <Plus className="mr-2 h-4 w-4"/>
                  건물 추가
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingBuildings ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground"/>
                  </div>
                ) : buildingError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4"/>
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
                                      <Pencil className="h-3.5 w-3.5 mr-1"/>
                                      수정
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteBuilding(building)}
                                      title="삭제"
                                      className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-1"/>
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
                  <Plus className="mr-2 h-4 w-4"/>
                  관리자 추가
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingAdministrators ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground"/>
                  </div>
                ) : administratorError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4"/>
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
                                      <Pencil className="h-3.5 w-3.5 mr-1"/>
                                      수정
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteAdministrator(administrator)}
                                      title="삭제"
                                      className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-1"/>
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
                  <Plus className="mr-2 h-4 w-4"/>
                  회차 추가
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingRounds ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground"/>
                  </div>
                ) : roundError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4"/>
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
                                      <Pencil className="h-3.5 w-3.5 mr-1"/>
                                      수정
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteRound(round)}
                                      title="삭제"
                                      className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-1"/>
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
                  <Plus className="mr-2 h-4 w-4"/>
                  사업 추가
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingBusinesses ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground"/>
                  </div>
                ) : businessError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4"/>
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
                                  <Trash2 className="h-3.5 w-3.5 mr-1"/>
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
                        이효재 / 010-8431-5880 /<span>&nbsp;</span>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 납부자 목록 초기화 다이얼로그 */}
        <Dialog open={isDialogOpen && dialogType === "deleteAllPayers"}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsDialogOpen(false);
                    setDialogType(null);
                  }
                }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>납부자 목록 초기화</DialogTitle>
              <DialogDescription>
                정말로 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                <br/>
                <br/>
                초기화를 진행하려면 아래 "초기화" 버튼을 3번 클릭해야 합니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setDialogType(null);
              }}>
                취소
              </Button>
              <Button variant="destructive" onClick={handleResetConfirm} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                    초기화 중...
                  </>
                ) : (
                  <>초기화 ({resetConfirmCount}/3)</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 서약서 목록 초기화 다이얼로그 */}
        <Dialog open={isDialogOpen && dialogType === "deleteAllConsents"}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsDialogOpen(false);
                    setDialogType(null);
                  }
                }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>서약서 목록 초기화</DialogTitle>
              <DialogDescription>
                정말로 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                <br/>
                <br/>
                초기화를 진행하려면 아래 "초기화" 버튼을 3번 클릭해야 합니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setDialogType(null);
              }}>
                취소
              </Button>
              <Button variant="destructive" onClick={handleResetConfirm} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                    초기화 중...
                  </>
                ) : (
                  <>초기화 ({resetConfirmCount}/3)</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 냉장고 신청 목록 초기화 다이얼로그 */}
        <Dialog open={isDialogOpen && dialogType === "deleteAllFridge"}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsDialogOpen(false);
                    setDialogType(null);
                  }
                }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>냉장고 신청 목록 초기화</DialogTitle>
              <DialogDescription>
                정말로 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                <br/>
                <br/>
                초기화를 진행하려면 아래 "초기화" 버튼을 3번 클릭해야 합니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setDialogType(null);
              }}>
                취소
              </Button>
              <Button variant="destructive" onClick={handleResetConfirm} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                    초기화 중...
                  </>
                ) : (
                  <>초기화 ({resetConfirmCount}/3)</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 건물 추가/수정 다이얼로그 */}
        <Dialog open={isDialogOpen && dialogType === "addBuilding"}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsDialogOpen(false);
                    setDialogType(null);
                  }
                }}>
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

              <div className="grid grid-cols-1">
                <Label htmlFor="buildingDescription" className="text-right">
                  서약서에서 응답받는 건물 이름과 완전히 일치해야 합니다.
                </Label>
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
                    <SelectValue placeholder="건물 유형 선택"/>
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
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setDialogType(null);
              }}>
                취소
              </Button>
              <Button onClick={handleSaveBuilding} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
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
        <Dialog open={isDialogOpen && dialogType === "deleteBuilding"}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsDialogOpen(false);
                    setDialogType(null);
                  }
                }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>건물 삭제 확인</DialogTitle>
              <DialogDescription>정말로 이 건물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setDialogType(null);
              }}>
                취소
              </Button>
              <Button variant="destructive" onClick={confirmDeleteBuilding} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                    삭제 중...
                  </>
                ) : (
                  "삭제"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 관리자 추가/수정 다이얼로그 */}
        <Dialog open={isDialogOpen && dialogType === "addAdministrator"}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsDialogOpen(false);
                    setDialogType(null);
                  }
                }}>
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
                    <SelectValue placeholder="관리자 역할 선택"/>
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
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setDialogType(null);
              }}>
                취소
              </Button>
              <Button onClick={handleSaveAdministrator} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 관리자 삭제 다이얼로그 */}
        <Dialog open={isDialogOpen && dialogType === "deleteAdministrator"}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsDialogOpen(false);
                    setDialogType(null);
                  }
                }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>관리자 삭제 확인</DialogTitle>
              <DialogDescription>정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setDialogType(null);
              }}>
                취소
              </Button>
              <Button variant="destructive" onClick={confirmDeleteAdministrator} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                    삭제 중...
                  </>
                ) : (
                  "삭제"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 회차 추가/수정 다이얼로그 */}
        <Dialog open={isDialogOpen && dialogType === "addRound"}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsDialogOpen(false);
                    setDialogType(null);
                  }
                }}>
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
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setDialogType(null);
              }}>
                취소
              </Button>
              <Button onClick={handleSaveRound} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 회차 삭제 다이얼로그 */}
        <Dialog open={isDialogOpen && dialogType === "deleteRound"}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsDialogOpen(false);
                    setDialogType(null);
                  }
                }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>회차 삭제 확인</DialogTitle>
              <DialogDescription>
                정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                <br/>
                <span className="text-red-600 font-bold">★이 회차에 등록된 모든 냉장고 신청 정보가 삭제됩니다.★</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setDialogType(null);
              }}>
                취소
              </Button>
              <Button variant="destructive" onClick={confirmDeleteRound} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                    삭제 중...
                  </>
                ) : (
                  "삭제"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 사업 추가 다이얼로그 */}
        <Dialog open={isDialogOpen && dialogType === "addBusiness"}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsDialogOpen(false);
                    setDialogType(null);
                  }
                }}>
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
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setDialogType(null);
              }}>
                취소
              </Button>
              <Button onClick={handleSaveBusiness} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 사업 삭제 다이얼로그 */}
        <Dialog open={isDialogOpen && dialogType === "deleteBusiness"}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsDialogOpen(false);
                    setDialogType(null);
                  }
                }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>사업 삭제 확인</DialogTitle>
              <DialogDescription>
                정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                <br/>
                <span className="text-red-600 font-bold">★이 사업에 등록된 모든 신청 정보가 삭제됩니다.★</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setDialogType(null);
              }}>
                취소
              </Button>
              <Button variant="destructive" onClick={confirmDeleteBusiness} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
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