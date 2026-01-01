"use client"

import {useState, useEffect, useRef, useCallback, useMemo} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Card, CardContent} from "@/components/ui/card"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog"
import {Search, Filter, AlertCircle, Download} from "lucide-react"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {API_PATHS} from "@/lib/api-config"
import {Alert, AlertDescription} from "@/components/ui/alert"
import type {Building, Consent} from "@/lib/interfaces"
import {get, del, post} from "@/lib/api-client"
import ConsentRow from "@/components/consent-row"
import {handleError, handleInfo, handleSuccess} from "@/lib/utils";

const ConsentManagement = () => {
  // 건물 목록 상태
  const [buildings, setBuildings] = useState<Building[]>([])

  // 페이저 관련 상태
  const [consents, setConsents] = useState<Consent[]>([])
  const [filteredConsents, setFilteredConsents] = useState<Consent[]>([])
  const [selectedConsent, setSelectedConsent] = useState<Consent | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // 업데이트 애니메이션 관련 상태
  const [recentlyUpdated] = useState<string[]>([])

  // 필터 상태
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [buildingFilter, setBuildingFilter] = useState<string | null>(null)
  const [roomFilter, setRoomFilter] = useState("")
  const [consentStatusFilter, setConsentStatusFilter] = useState<string | null>(null)
  const [startDateFilter, setStartDateFilter] = useState<string>("")
  const [endDateFilter, setEndDateFilter] = useState<string>("")

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 테이블 컨테이너 참조
  const tableBodyRef = useRef<HTMLDivElement>(null)

  // 검색어 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // 300ms 디바운스

    return () => clearTimeout(timer)
  }, [searchTerm, setDebouncedSearchTerm])

  // 서약서 데이터를 가져오는 함수
  const fetchConsents = useCallback(async () => {
    try {
      const data = await get<Consent[]>(API_PATHS.SURVEY)
      const sorted = (Array.isArray(data) ? data : []).sort((a, b) => (b.id || 0) - (a.id || 0))
      setConsents(sorted)
      return sorted
    } catch (error) {
      handleError(error, "서약서 데이터 가져오기")
    }
  }, [])

  // 건물 목록을 가져오는 함수
  const fetchBuildings = useCallback(async () => {
    try {
      const buildingsData = await get<Building[]>(API_PATHS.BUILDING)
      setBuildings(buildingsData)
      return buildingsData
    } catch (error) {
      handleError(error, "건물 목록 가져오기")
    }
  }, [])

  // 컴포넌트 마운트 시 건물, 서약서 로드
  useEffect(() => {
    setIsLoading(true)

    // Modify fetchData to not return a Promise
    const fetchData = () => {
      Promise.all([fetchBuildings(), fetchConsents()])
        .then(([, consentsData]) => {
          if (consentsData) {
            setFilteredConsents(consentsData)
          }
        })
        .catch((error) => {
          handleError(error, "건물, 서약서 불러오기")
        })
        .finally(() => {
          setIsLoading(false)
        })
    }

    // Call fetchData without returning its result
    fetchData()

    // No need to return anything from useEffect
  }, [fetchBuildings, fetchConsents])

  // 필터링 로직을 별도 함수로 분리
  const applyFilters = useCallback(
    (raw: Consent[]): Consent[] => {
      return raw.filter((consent) => {
        const matchesSearch =
          !debouncedSearchTerm ||
          [consent.studentId, consent.name, consent.phoneNumber].some((v) => v.includes(debouncedSearchTerm))
        const matchesBuilding = !buildingFilter || consent.buildingName === buildingFilter
        const matchesRoom = !roomFilter || consent.roomNumber.includes(roomFilter)
        const matchesStatus = consentStatusFilter === null || consent.agreed === (consentStatusFilter === "true")
        const consentDate = consent.dateTime.split("T")[0]
        const matchesStart = !startDateFilter || consentDate >= startDateFilter
        const matchesEnd = !endDateFilter || consentDate <= endDateFilter

        return matchesSearch && matchesBuilding && matchesRoom && matchesStatus && matchesStart && matchesEnd
      })
    },
    [debouncedSearchTerm, buildingFilter, roomFilter, consentStatusFilter, startDateFilter, endDateFilter],
  )

  // 필터링된 결과를 메모이제이션
  const filteredConsentsData = useMemo(() => {
    return applyFilters(consents)
  }, [consents, applyFilters])

  // 필터링된 결과 업데이트
  useEffect(() => {
    setFilteredConsents(filteredConsentsData)
  }, [filteredConsentsData])

  const handleDelete = useCallback((consent: Consent) => {
    setSelectedConsent(consent)
    setIsDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (selectedConsent) {
      try {
        // 환경에 상관없이 동일한 방식으로 삭제 요청
        if (selectedConsent.id === undefined) {
          throw new Error("서약서 ID가 없습니다.")
        }
        await del(API_PATHS.SURVEY_BY_ID(selectedConsent.id))

        // 성공 시 로컬 상태 업데이트
        setConsents((prevConsents) => prevConsents.filter((c) => c.id !== selectedConsent.id))

        handleSuccess("성공적으로 삭제되었습니다.")
      } catch (error) {
        handleError(error, "서약서 삭제")
      } finally {
        setIsDeleteDialogOpen(false)
      }
    }
  }, [selectedConsent])

  const resetFilters = useCallback(() => {
    setSearchTerm("")
    setBuildingFilter(null)
    setRoomFilter("")
    setConsentStatusFilter(null)
    setStartDateFilter("")
    setEndDateFilter("")
    setIsFilterOpen(false) // 필터 초기화 후 팝오버 닫기
  }, [])

  // 필 적용 여부 확인 함수
  const isFilterActive = useCallback(() => {
    return (
      debouncedSearchTerm !== "" ||
      buildingFilter !== null ||
      roomFilter !== "" ||
      consentStatusFilter !== null ||
      startDateFilter !== "" ||
      endDateFilter !== ""
    )
  }, [debouncedSearchTerm, buildingFilter, roomFilter, consentStatusFilter, startDateFilter, endDateFilter])

  // 적용된 필터 개수 계산 함수
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchTerm !== "") count++
    if (buildingFilter !== null) count++
    if (roomFilter !== "") count++
    if (consentStatusFilter !== null) count++
    if (startDateFilter !== "") count++
    if (endDateFilter !== "") count++
    return count
  }, [searchTerm, buildingFilter, roomFilter, consentStatusFilter, startDateFilter, endDateFilter])

  const refreshData = useCallback(async () => {
    setIsRefreshing(true)

    handleInfo("구글 시트에서 데이터를 불러오는 중... 수 초 정도가 소요됩니다.")

    try {
      // 먼저 POST 요청을 보냄
      const postResponse = await post(API_PATHS.SURVEY)

      // POST 요청이 성공하면 GET 요청으로 데이터를 가져옴
      if (postResponse) {
        const refreshedConsents = await fetchConsents()
        if (refreshedConsents) {
          setFilteredConsents(refreshedConsents)
        }

        handleSuccess("성공적으로 불러와졌습니다.")
      }
    } catch (error) {
      handleError(error, "구글 시트 서약서 불러오기")
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchConsents])

  // 모바일 화면 감지
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768) // Adjust the breakpoint as needed
    }

    // Set initial value
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up event listener
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
      <div className="max-w-[870px] mx-auto">
      <h1 className="text-2xl font-semibold mb-4 md:block hidden">서약서 관리</h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
              <Input
                placeholder="학번, 이름 또는 전화번호 검색"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.trim())}
              />
            </div>
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={isFilterActive() ? "default" : "outline"}
                  className="gap-2 relative w-12 h-10 md:w-auto md:h-auto"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <Filter className="h-5 w-5"/>
                  <span className="hidden md:inline">필터</span>
                  {isFilterActive() && (
                    <span
                      className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 max-h-[80vh] overflow-auto z-[100]">
                <div className="space-y-4">
                  <h4 className="font-medium">필터 옵션</h4>

                  <div className="space-y-2">
                    <Label>건물</Label>
                    <Select
                      value={buildingFilter || "all"}
                      onValueChange={(value) => setBuildingFilter(value === "all" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="건물 선택"/>
                      </SelectTrigger>
                      <SelectContent className="z-[150]">
                        <SelectItem value="all">전체</SelectItem>
                        {buildings.map((building) => (
                          <SelectItem key={building.id} value={building.name}>
                            {building.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>호실</Label>
                    <Input placeholder="호실 검색" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}/>
                  </div>

                  <div className="space-y-2">
                    <Label>동의 상태</Label>
                    <Select
                      value={consentStatusFilter === null ? "all" : consentStatusFilter}
                      onValueChange={(value) => setConsentStatusFilter(value === "all" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="상태 선택"/>
                      </SelectTrigger>
                      <SelectContent className="z-[150]">
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="true">동의</SelectItem>
                        <SelectItem value="false">미동의</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>제출일 기간</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="start-date" className="text-xs">
                          시작일
                        </Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={startDateFilter}
                          onChange={(e) => setStartDateFilter(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date" className="text-xs">
                          종료일
                        </Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={endDateFilter}
                          onChange={(e) => setEndDateFilter(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end sticky bottom-0 pt-2 bg-popover">
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      필터 초기화
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={isLoading || isRefreshing}
              className="w-12 h-10 md:w-auto md:h-auto"
            >
              <Download className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""} ${isMobile ? "" : "mr-2"}`}/>
              <span className="hidden md:inline">{isRefreshing ? "불러오는 중..." : "불러오기"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 서약서 목록 테이블 */}
      <Card>
        <CardContent className="p-0 sm:p-2">
          {/* Replace the entire table container with the fridge-management style */}
          <div className="relative">
            <div ref={tableBodyRef} className="overflow-auto h-[calc(100vh-260px)] min-h-[410px] w-full rounded-lg">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th
                    className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                    제출일
                  </th>
                  <th
                    className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                    학번
                  </th>
                  <th
                    className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                    이름
                  </th>
                  <th
                    className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                    전화번호
                  </th>
                  <th
                    className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                    건물
                  </th>
                  <th
                    className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                    호실
                  </th>
                  <th
                    className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                    동의 여부
                  </th>
                  <th
                    className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                    관리
                  </th>
                </tr>
                </thead>
                <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredConsents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredConsents.map((consent, index) => (
                    <ConsentRow
                      key={consent.id}
                      consent={consent}
                      index={index}
                      onDelete={handleDelete}
                      isUpdated={recentlyUpdated.includes(String(consent.id))}
                    />
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>
          {/* End of table replacement */}
          <div className="text-sm text-gray-500 text-center mt-2 pb-4">
            총{" "}
            {isFilterActive() && filteredConsents.length !== consents.length ? (
              <>
                <span className="font-medium text-gray-700">{filteredConsents.length}</span>(
                <span className="font-medium text-gray-700">{consents.length}</span>)
              </>
            ) : (
              <span className="font-medium text-gray-700">{filteredConsents.length}</span>
            )}
            개의 서약서가 있습니다.
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2"/>
              서약서 삭제
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4"/>
              <AlertDescription>
                '{selectedConsent?.name}' 서약서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ConsentManagement