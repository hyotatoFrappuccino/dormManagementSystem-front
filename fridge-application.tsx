"use client"

import type React from "react"
import {useEffect, useRef, useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardFooter} from "@/components/ui/card"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {AlertCircle, CheckCircle, Loader2} from "lucide-react"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {API_PATHS} from "@/lib/api-config"
import type {Building, DashboardData, FridgeApplication, Round, StudentInfo} from "@/lib/interfaces"
import {
  getAgreementStatusColor,
  getAgreementStatusText,
  getPaymentStatusColor,
  getPaymentStatusText,
  getSlotStatusColor,
  validateStudentId,
} from "@/lib/utils"
import {get, post} from "@/lib/api-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// 컴포넌트 내부 상태 추가
export default function RefrigeratorApplication() {
  const [studentId, setStudentId] = useState("")
  const [lastSearchedId, setLastSearchedId] = useState("") // 마지막으로 검색한 학번 저장
  const [displayedStudentId, setDisplayedStudentId] = useState("")
  const [userData, setUserData] = useState<StudentInfo | null>(null)
  const [applicationType, setApplicationType] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedType, setSubmittedType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // 제출 중 상태 추가

  const [inputRef] = useState(useRef<HTMLInputElement>(null))

  // 학번 유효성 검사를 위한 상태 변수 추가
  const [studentIdError, setStudentIdError] = useState<string | null>(null)

  // 신청 현황 상태 추가
  const [applications, setApplications] = useState<FridgeApplication[]>([])

  // 회차 관련 상태 추가
  const [rounds, setRounds] = useState<Round[]>([])
  const [selectedRound, setSelectedRound] = useState<Round | null>(null)
  const [isLoadingRounds, setIsLoadingRounds] = useState(false)
  const [preserveSelectedRound, setPreserveSelectedRound] = useState(false) // 회차 선택 유지 플래그

  // 성공 메시지에 표시할 회차 정보를 별도로 관리
  const [submittedRound, setSubmittedRound] = useState<Round | null>(null)

  // 건물 슬롯 정보 상태 추가
  const [buildingData, setBuildingData] = useState<Building | null>(null)
  const [userBuildingId, setUserBuildingId] = useState<number | null>(null)
  const [dashboardData, setDashboardData] = useState<Building[]>([]) // 대시보드 데이터 추가

  // 신청 유형 상태 추가
  const [fridgeType, setFridgeType] = useState<string | null>(null)

  // 마감 팝업 관련 상태 추가
  const [showClosedDialog, setShowClosedDialog] = useState(false)
  const [closedDialogType, setClosedDialogType] = useState<string>("")

  // 이미 신청한 회차 ID 목록 생성
  const appliedRoundIds = applications.filter((app) => app.round?.id).map((app) => app.round!.id)

  // 회차가 이미 신청되었는지 확인하는 함수
  const isRoundApplied = (roundId: number) => {
    return appliedRoundIds.includes(roundId)
  }

  // 이미 신청한 회차인지 확인하는 상태
  const isSelectedRoundApplied = selectedRound ? isRoundApplied(selectedRound.id) : false

  // 대시보드 데이터 가져오기 함수
  const fetchDashboardData = async () => {
    try {
      const response = await get<DashboardData>(API_PATHS.DASHBOARD)

      if (response && response.buildings) {
        setDashboardData(response.buildings)
      } else {
        console.error("대시보드 데이터 조회 실패")
      }
    } catch (error) {
      console.error("대시보드 데이터 조회 중 오류:", error)
    }
  }

  // 회차 목록 가져오기 함수
  const fetchRounds = async () => {
    setIsLoadingRounds(true)

    try {
      const response = await get<Round[]>(API_PATHS.ROUNDS)

      if (response) {
        // 시작일 기준으로 정렬 (빠른순)
        const sortedRounds = response.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        setRounds(sortedRounds)

        // 현재 날짜에 속하는 회차 또는 가장 가까운 미래 회차 찾기
        const currentRound = findCurrentOrNextRound(sortedRounds)
        setSelectedRound(currentRound)
      } else {
        console.error("회차 목록을 불러오는데 실패했습니다.")
      }
    } catch (error) {
      console.error("Error fetching rounds:", error)
    } finally {
      setIsLoadingRounds(false)
    }
  }

  // 현재 날짜에 속하는 회차 또는 가장 가까운 미래 회차 찾기
  const findCurrentOrNextRound = (rounds: Round[]): Round | null => {
    if (!rounds.length) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 현재 날짜에 속하는 회차 찾기
    const currentRound = rounds.find((round) => {
      const startDate = new Date(round.startDate)
      const endDate = new Date(round.endDate)
      return today >= startDate && today <= endDate
    })

    if (currentRound) return currentRound

    // 가장 가까운 미래 회차 찾기
    const futureRounds = rounds.filter((round) => new Date(round.startDate) > today)
    if (futureRounds.length) {
      return futureRounds.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0]
    }

    // 미래 회차가 없으면 가장 최근 회차 반환
    return rounds.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0]
  }

  // ID로 회차 찾기
  const findRoundById = (roundId: number): Round | null => {
    return rounds.find((round) => round.id === roundId) || null
  }

  // 건물 이름으로 건물 ID 찾기
  const getBuildingIdByName = (buildingName: string): number | null => {
    const building = dashboardData.find(
      (b) =>
        b.name === buildingName ||
        b.name.replace("T", "") === buildingName ||
        buildingName.includes(b.name) ||
        b.name.includes(buildingName),
    )
    return building ? (building.id ?? null) : null
  }

  // 회차 선택 시 건물별 이용자 수를 가져오는 함수
  const fetchBuildingUsageByRound = async (roundId: number, buildingId: number): Promise<Building | null> => {

    try {
      const response = await get<any>(API_PATHS.ROUNDS_FRIDGE_APPLICATIONS(roundId))

      // 대시보드 데이터에서 건물 정보 찾기
      const buildingInfo = dashboardData.find((b) => b.id === buildingId)

      if (buildingInfo) {
        let building: Building

        // API 응답이 있는 경우
        if (response && response[buildingId]) {
          const buildingUsage = response[buildingId]

          building = {
            ...buildingInfo,
            fridgeUsage: buildingUsage.REFRIGERATOR || 0,
            freezerUsage: buildingUsage.FREEZER || 0,
            integratedUsage: buildingUsage.COMBINED || 0,
          }
        }
        // API 응답이 없는 경우 (신청 수 0으로 처리)
        else {
          building = {
            ...buildingInfo,
            fridgeUsage: 0,
            freezerUsage: 0,
            integratedUsage: 0,
          }
        }

        setBuildingData(building)
        return building // 최신 데이터 반환
      } else {
        setBuildingData(null)
        return null
      }
    } catch (error) {
      console.error("건물별 이용자 수 조회 중 오류:", error)
      setBuildingData(null)
      return null
    }
  }

  // 마감 여부 확인 함수 - building 파라미터 추가
  const isTypeClosed = (type: string, building: Building | null = buildingData): boolean => {
    if (!building) {
      console.log("isTypeClosed: building 데이터가 없음")
      return false
    }

    switch (type) {
      case "냉장고":
        return (building.fridgeUsage || 0) >= building.fridgeSlots
      case "냉동고":
        return (building.freezerUsage || 0) >= building.freezerSlots
      case "통합형":
        return (building.integratedUsage || 0) >= building.integratedSlots
      default:
        return false
    }
  }

  // 컴포넌트 마운트 시 회차 목록 져오기
  useEffect(() => {
    fetchRounds()
  }, [])

  // 컴포넌트 마운트 시 대시보드 데이터 가져오기
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // 회차 선택 시 건물 슬롯 정보 가져오기
  useEffect(() => {
    if (selectedRound && userBuildingId) {
      fetchBuildingUsageByRound(selectedRound.id, userBuildingId)
    }
  }, [selectedRound, userBuildingId])

  // 회차 신청 유형 가져오기
  const getAppliedType = (roundId: number) => {
    const application = applications.find((app) => app.round?.id === roundId)
    if (!application) return null

    switch (application.type) {
      case "REFRIGERATOR":
        return "냉장"
      case "FREEZER":
        return "냉동"
      case "COMBINED":
        return "통합"
      default:
        return application.type
    }
  }

  // 회차 선택 시 이미 신청된 회차인 경우 해당 유형을 자동으로 선택
  useEffect(() => {
    if (selectedRound && isRoundApplied(selectedRound.id)) {
      const application = applications.find((app) => app.round?.id === selectedRound.id)
      if (application) {
        switch (application.type) {
          case "REFRIGERATOR":
            setApplicationType("냉장고")
            setFridgeType("REFRIGERATOR")
            break
          case "FREEZER":
            setApplicationType("냉동고")
            setFridgeType("FREEZER")
            break
          case "COMBINED":
            setApplicationType("통합형")
            setFridgeType("COMBINED")
            break
        }
      }
    }
  }, [selectedRound, applications])

  // 신청 정보 회차 정보 매핑 - 이제 API에서 이미 round 객체를 제공하므로 단순화
  const mapApplicationsWithRounds = (apps: FridgeApplication[]): FridgeApplication[] => {
    return apps.map((app) => {
      // round가 없는 경우 (이전 버전 호환성을 위해)
      if (!app.round && app.roundName) {
        // 회차 이름으로 회차 정보 찾기
        const round = rounds.find(
          (r) => r.name && app.roundName && (r.name.includes(app.roundName) || app.roundName.includes(r.name)),
        )

        if (round) {
          return {
            ...app,
            round: round,
          }
        }
      }
      return app
    })
  }

  // handleSearch 함수
  const handleSearch = async () => {
    // 띄어쓰기 제거
    const trimmedStudentId = studentId.replace(/\s/g, "")

    // 학번 유효성 검사
    if (!validateStudentId(trimmedStudentId)) {
      const isValidLength = trimmedStudentId.length === 9 || trimmedStudentId.length === 10
      const isValidCharacters = /^[0-9a-zA-Z]+$/.test(trimmedStudentId)

      if (!isValidLength) {
        setStudentIdError("학번은 9자 또는 10자여야 합니다.")
      } else if (!isValidCharacters) {
        setStudentIdError("학번은 숫자와 영문자만 포함해야 합니다.")
      } else {
        setStudentIdError("유효하지 않은 학번 형식입니다.")
      }
      return
    }

    // 학번 변경된 경우에만 성공 메시지 초기화
    if (trimmedStudentId !== lastSearchedId) {
      setIsSubmitted(false)
      setSubmittedType(null)
      setSubmittedRound(null) // 성공 메시지의 회차 정보도 초기화
    }

    // 현재 선택된 회차 ID 저장
    const currentSelectedRoundId = selectedRound?.id

    setLastSearchedId(trimmedStudentId)
    setStudentIdError(null)
    setIsLoading(true)
    setError(null)

    try {
      const response = await get<any>(API_PATHS.FRIDGE_BY_ID(trimmedStudentId))

      if (response && response.defaultInfo) {
        // 데이터 구조 검증 및 안전한 매핑
        try {
          const studentInfo: StudentInfo = {
            name: response.defaultInfo.name || "이름 없음",
            isPaid: response.defaultInfo.isPaid || "NONE", // 변경된 값 형식 처리
            isAgreed: response.defaultInfo.isAgreed,
            building: response.defaultInfo.building || "건물 정보 없음",
            roomNumber: response.defaultInfo.roomNumber || "호실 정보 없음",
          }

          setUserData(studentInfo)
          setDisplayedStudentId(trimmedStudentId)

          // 건물 ID 설정
          const buildingId = getBuildingIdByName(studentInfo.building)
          setUserBuildingId(buildingId)

          // 신청 현황 데이터가 있으면 설정
          if (response.fridgeApplyInfo && Array.isArray(response.fridgeApplyInfo)) {
            // API 응답에 이미 round 객체가 포함되어 있으므로 매핑이 필요 없음
            setApplications(response.fridgeApplyInfo)

            // 회차 선택 처리
            if (preserveSelectedRound && currentSelectedRoundId) {
              // 이전에 선택한 회차를 유지
              const roundToSelect = findRoundById(currentSelectedRoundId)
              if (roundToSelect) {
                setSelectedRound(roundToSelect)
              } else {
                // 현재 날짜가 속한 회차 찾기
                const currentRound = findCurrentOrNextRound(rounds)
                setSelectedRound(currentRound)
              }
              setPreserveSelectedRound(false) // 플래그 초기화
            } else {
              // 현재 날짜가 속한 회차 찾기
              const currentRound = findCurrentOrNextRound(rounds)
              if (currentRound) {
                setSelectedRound(currentRound)
              }
              // 현재 회차가 없고 신청된 회차가 있으면 첫 번째 신청 회차 선택
              else if (response.fridgeApplyInfo.length > 0 && response.fridgeApplyInfo[0].round) {
                setSelectedRound(response.fridgeApplyInfo[0].round)
              }
            }
          } else {
            setApplications([])

            // 회차 선택 처리
            if (preserveSelectedRound && currentSelectedRoundId) {
              // 이전에 선택한 회차를 유지
              const roundToSelect = findRoundById(currentSelectedRoundId)
              if (roundToSelect) {
                setSelectedRound(roundToSelect)
              } else {
                // 현재 날짜가 속한 회차 찾기
                const currentRound = findCurrentOrNextRound(rounds)
                setSelectedRound(currentRound)
              }
              setPreserveSelectedRound(false) // 플래그 초기화
            } else {
              // 현재 날짜가 속한 회차 찾기
              const currentRound = findCurrentOrNextRound(rounds)
              setSelectedRound(currentRound)
            }
          }
        } catch (parseError) {
          console.error("API 응답 데이터 파싱 오류:", parseError)
          setError("학생 정보 형식이 올바르지 않습니다. 관리자에게 문의하세요.")
          setUserData(null)
          setDisplayedStudentId("")
          setApplications([])
          setUserBuildingId(null)
          setBuildingData(null)
        }
      } else {
        setError("해당 학번의 정보를 찾을 수 없습니다.")
        setUserData(null)
        setDisplayedStudentId("")
        setApplications([])
        setUserBuildingId(null)
        setBuildingData(null)
      }
    } catch (error) {
      console.error("Error fetching student data:", error)
      setError("학생 정보를 불러오는 중 오류가 발생했습니다.")
      setUserData(null)
      setDisplayedStudentId("")
      setUserBuildingId(null)
      setBuildingData(null)
    } finally {
      setIsLoading(false)
    }
  }

  // handleSubmit 함수 수정 - 마감 체크 로직 개선
  const handleSubmit = async (forceSubmit = false) => {
    if (!userData) {
      setError("납부자 정보를 먼저 조회해주세요.")
      return
    }

    // 납부 상태 확인 로직 변경
    if (userData.isPaid !== "PAID") {
      setError("납부 상태가 확인되지 않았습니다. 납부 후 신청해주세요.")
      return
    }

    if (!userData.isAgreed) {
      setError("서약서 상태가 확인되지 않았습니다. 서약서 제출 및 동의 후 신청해주세요.")
      return
    }

    if (!applicationType) {
      setError("냉장고 유형을 선택해주세요.")
      return
    }

    if (!selectedRound) {
      setError("회차를 선택해주세요.")
      return
    }

    if (!userBuildingId) {
      setError("건물 정보를 찾을 수 없습니다.")
      return
    }

    setIsSubmitting(true)

    try {
      // 제출 전 실시간으로 마감 체크
      if (!forceSubmit) {
        // 최신 건물 사용량 정보 가져오기
        const latestBuildingData = await fetchBuildingUsageByRound(selectedRound.id, userBuildingId)

        // 최신 데이터로 마감 체크
        const isClosed = isTypeClosed(applicationType, latestBuildingData)

        if (isClosed) {
          setClosedDialogType(applicationType)
          setShowClosedDialog(true)
          setIsSubmitting(false)
          return
        }
      }

      const response = await post<any>(API_PATHS.FRIDGE, {
        roundId: selectedRound.id,
        studentId: displayedStudentId,
        type: fridgeType,
      })

      if (response) {
        // 성공적인 제출 처리
        setIsSubmitted(true)
        setSubmittedType(applicationType)
        setSubmittedRound(selectedRound) // 성공 메시지에 표시할 회차 정보 저장
        setError(null)

        // 신청 정보 다시 조회하되, 선택된 회차는 유지
        const trimmedStudentId = studentId.replace(/\s/g, "")
        setIsLoading(true)

        try {
          const dataResponse = await get<any>(API_PATHS.FRIDGE_BY_ID(trimmedStudentId))

          if (dataResponse && dataResponse.defaultInfo) {
            // 학생 정보 업데이트
            const studentInfo = {
              name: dataResponse.defaultInfo.name,
              isPaid: dataResponse.defaultInfo.isPaid,
              isAgreed: dataResponse.defaultInfo.isAgreed,
              building: dataResponse.defaultInfo.building,
              roomNumber: dataResponse.defaultInfo.roomNumber,
            }
            setUserData(studentInfo)

            // 신청 현황 데이터 업데이트
            if (dataResponse.fridgeApplyInfo && Array.isArray(dataResponse.fridgeApplyInfo)) {
              const mappedApplications = mapApplicationsWithRounds(dataResponse.fridgeApplyInfo)
              setApplications(mappedApplications)
            }
          }
        } catch (error) {
          console.error("Error fetching updated data:", error)
        } finally {
          setIsLoading(false)
        }

        // 선택된 회차 유지 (중요)
        const roundToKeep = rounds.find((r) => r.id === selectedRound.id)
        if (roundToKeep) {
          setSelectedRound(roundToKeep)
        }

        // 제출 후 건물 슬롯 정보 업데이트
        await fetchBuildingUsageByRound(selectedRound.id, userBuildingId)
      } else {
        setError("신청 중 오류가 발생했습니다.")
      }
    } catch (error) {
      console.error("Error submitting application:", error)
      setError("서버 연결 중 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 버튼 비활성화 조건 수정
  const isButtonDisabled =
    !userData || userData.isPaid !== "PAID" || !userData.isAgreed || !applicationType || isSubmitting

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  // 현재 선택된 회차 기준으로 직전에 신청한 회차 찾기
  const getPreviousAppliedRound = () => {
    if (!selectedRound || applications.length === 0) return null

    // 현재 선택된 회차의 시작일
    const currentRoundStartDate = new Date(selectedRound.startDate).getTime()

    // 현재 회차보다 이전에 신청한 회차들 필터링
    const previousApplications = applications.filter(
      (app) => app.round && new Date(app.round.startDate).getTime() < currentRoundStartDate,
    )

    if (previousApplications.length === 0) return null

    // 시작일 기으로 정렬하여 가장 가까운 이전 회차 찾기
    return previousApplications.sort((a, b) => {
      if (!a.round || !b.round) return 0
      return new Date(b.round.startDate).getTime() - new Date(a.round.startDate).getTime()
    })[0]
  }

  // 신청 유형 변경 시
  useEffect(() => {
    switch (applicationType) {
      case "냉장고":
        setFridgeType("REFRIGERATOR")
        break
      case "냉동고":
        setFridgeType("FREEZER")
        break
      case "통합형":
        setFridgeType("COMBINED")
        break
      default:
        setFridgeType(null)
        break
    }
  }, [applicationType])

  return (
    <div className="max-w-3xl mx-auto relative">
      <h2 className="text-2xl font-semibold mb-4 md:block hidden">냉장고 신청/연장</h2>

      {/* 메인 콘텐츠 영역 */}
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="studentId" className="sr-only">
                  학번
                </Label>
                <Input
                  id="studentId"
                  placeholder="학번을 입력하세요"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value)
                    setStudentIdError(null)
                  }}
                  onKeyDown={handleKeyDown}
                  ref={inputRef}
                  disabled={isLoading}
                  autoComplete="off"
                />
                {studentIdError && <p className="text-sm text-red-500 mt-1">{studentIdError}</p>}
              </div>
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    조회 중...
                  </>
                ) : (
                  "조회"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4"/>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSubmitted && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600"/>
            <AlertDescription className="flex flex-col">
              <span>
                {userData?.name}님의 {submittedType} 신청이 {submittedRound?.name} 회차에 완료되었습니다.
              </span>
              {submittedRound?.password && (
                <span className="mt-1 font-medium">비밀번호: {submittedRound.password}</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {userData && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">이름</Label>
                  <p className="font-medium">{userData.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">학번</Label>
                  <p className="font-medium">{displayedStudentId}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">납부 상태</Label>
                  <p className={`font-medium ${getPaymentStatusColor(userData.isPaid)}`}>
                    {getPaymentStatusText(userData.isPaid)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">서약서 상태</Label>
                  <p className={`font-medium ${getAgreementStatusColor(userData.isAgreed)}`}>
                    {getAgreementStatusText(userData.isAgreed)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">건물</Label>
                  <p className="font-medium">{userData.building}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">호실</Label>
                  <p className="font-medium">{userData.roomNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {userData && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* 회차 선택 추가 */}
                <div className="space-y-2">
                  <Label htmlFor="round-select">회차 선택</Label>
                  <Select
                    value={selectedRound?.id?.toString() || ""}
                    onValueChange={(value) => {
                      const round = rounds.find((r) => r.id?.toString() === value)
                      setSelectedRound(round || null)
                    }}
                    disabled={isLoadingRounds}
                  >
                    <SelectTrigger id="round-select" className="w-full pl-3">
                      {isLoadingRounds ? (
                        <div className="flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                          회차 로딩 중...
                        </div>
                      ) : (
                        <SelectValue placeholder="회차를 선택하세요"/>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {rounds.map((round, index) => {
                        const isApplied = isRoundApplied(round.id)
                        const appliedType = getAppliedType(round.id)

                        return (
                          <SelectItem
                            key={round.id ?? index}
                            value={(round.id ?? "").toString()}
                            className={isApplied ? "opacity-70" : ""}
                          >
                            <div>
                              {round.name} ({round.startDate} ~ {round.endDate})
                              {isApplied && (
                                <span className="ml-2 text-blue-600 font-medium">[{appliedType} 신청됨]</span>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* 가로 탭 형태의 유형 선택으로 변경 */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label className="flex-shrink-0">유형 선택</Label>
                    {(() => {
                      const prevRound = getPreviousAppliedRound()
                      if (prevRound) {
                        const prevType =
                          prevRound.type === "REFRIGERATOR" ? "냉장" : prevRound.type === "FREEZER" ? "냉동" : "통합"
                        return (
                          <div className="text-sm text-gray-600 whitespace-nowrap ml-2">
                            [이전 회차: <span className="font-medium text-blue-600">{prevType}</span>]
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                  <div className="grid grid-cols-3 gap-0 border rounded-md overflow-hidden w-full">
                    <div
                      className={`relative border-r ${applicationType === "냉장고" ? "bg-blue-500 text-white" : ""}`}
                    >
                      <input
                        type="radio"
                        id="type-refrigerator"
                        name="applicationType"
                        value="냉장고"
                        checked={applicationType === "냉장고"}
                        onChange={() => setApplicationType("냉장고")}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <label
                        htmlFor="type-refrigerator"
                        className="flex items-center justify-center p-3 text-center h-full cursor-pointer"
                      >
                        <span className="text-sm font-medium">
                          냉장{" "}
                          {buildingData && (
                            <span
                              className={
                                applicationType === "냉장고"
                                  ? "text-white"
                                  : getSlotStatusColor(
                                    buildingData.fridgeSlots - (buildingData.fridgeUsage || 0),
                                    buildingData.fridgeSlots,
                                  )
                              }
                            >
                              ({buildingData.fridgeSlots - (buildingData.fridgeUsage || 0)}/{buildingData.fridgeSlots})
                            </span>
                          )}
                        </span>
                      </label>
                    </div>
                    <div
                      className={`relative border-r ${applicationType === "냉동고" ? "bg-blue-500 text-white" : ""}`}
                    >
                      <input
                        type="radio"
                        id="type-freezer"
                        name="applicationType"
                        value="냉동고"
                        checked={applicationType === "냉동고"}
                        onChange={() => setApplicationType("냉동고")}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <label
                        htmlFor="type-freezer"
                        className="flex items-center justify-center p-3 text-center h-full cursor-pointer"
                      >
                        <span className="text-sm font-medium">
                          냉동{" "}
                          {buildingData && (
                            <span
                              className={
                                applicationType === "냉동고"
                                  ? "text-white"
                                  : getSlotStatusColor(
                                    buildingData.freezerSlots - (buildingData.freezerUsage || 0),
                                    buildingData.freezerSlots,
                                  )
                              }
                            >
                              ({buildingData.freezerSlots - (buildingData.freezerUsage || 0)}/
                              {buildingData.freezerSlots})
                            </span>
                          )}
                        </span>
                      </label>
                    </div>
                    <div className={`relative ${applicationType === "통합형" ? "bg-blue-500 text-white" : ""}`}>
                      <input
                        type="radio"
                        id="type-combined"
                        name="applicationType"
                        value="통합형"
                        checked={applicationType === "통합형"}
                        onChange={() => setApplicationType("통합형")}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <label
                        htmlFor="type-combined"
                        className="flex items-center justify-center p-3 text-center h-full cursor-pointer"
                      >
                        <span className="text-sm font-medium">
                          통합{" "}
                          {buildingData && (
                            <span
                              className={
                                applicationType === "통합형"
                                  ? "text-white"
                                  : getSlotStatusColor(
                                    buildingData.integratedSlots - (buildingData.integratedUsage || 0),
                                    buildingData.integratedSlots,
                                  )
                              }
                            >
                              ({buildingData.integratedSlots - (buildingData.integratedUsage || 0)}/
                              {buildingData.integratedSlots})
                            </span>
                          )}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button onClick={() => handleSubmit()} className="w-full" disabled={isButtonDisabled || !selectedRound}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    {isSelectedRoundApplied ? "수정 중..." : "반영 중..."}
                  </>
                ) : isSelectedRoundApplied ? (
                  "수정하기"
                ) : (
                  "반영하기"
                )}
              </Button>
              {(isButtonDisabled || !selectedRound) && userData && (
                <div className="w-full text-sm text-red-500 text-center">
                  {userData.isPaid !== "PAID" && "납부 상태가 확인되지 않았습니다. 납부 후 신청해주세요."}
                  {userData.isPaid === "PAID" &&
                    !userData.isAgreed &&
                    "서약서 상태가 확인되지 않았습니다. 서약서 제출 및 동의 후 신청해주세요."}
                  {userData.isPaid === "PAID" && userData.isAgreed && !applicationType && "냉장고 유형을 선택해주세요."}
                  {userData.isPaid === "PAID" &&
                    userData.isAgreed &&
                    applicationType &&
                    !selectedRound &&
                    "회차를 선택해주세요."}
                </div>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
      {/* 마감 팝업 Dialog */}
      <Dialog open={showClosedDialog} onOpenChange={setShowClosedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>마감 안내</DialogTitle>
            <DialogDescription>
              해당 회차의 {closedDialogType}은 마감되었습니다. 초과로 신청을 진행하시려면 신청 버튼을 눌러주세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowClosedDialog(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                setShowClosedDialog(false)
                handleSubmit(true) // 강제 제출
              }}
            >
              신청하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}