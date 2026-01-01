"use client"

import Link from "next/link"
import {useState, useEffect} from "react"
import {Home, FileText, Users, Menu, Settings, FileCheck, RefreshCw} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import Snowfall from 'react-snowfall'
import Cookies from 'js-cookie'
import {Snowflake} from "lucide-react";

import RefrigeratorApplication from "./fridge-application"
import FridgeManagement from "./fridge-management"
import PayerManagement from "./payer-management"
import ConsentManagement from "./consent-management"
import SettingsPage from "./settings"
import {UserProfile} from "@/components/user-profile"

import {get} from "./lib/api-client"
import {API_PATHS} from "@/lib/api-config"
import {findCurrentRound, getUsageStatus, initializeNotification} from "@/lib/utils"
import type {Round, Building, DashboardData} from "@/lib/interfaces"

import {NotificationProvider, useNotification} from "@/components/contexts/NotificationContext"
import {Notification} from "@/components/contexts/NotificationComponent"

const menuItems = [
  {name: "대시보드", icon: Home},
  {name: "냉장고 신청/연장", icon: FileText},
  {name: "냉장고 관리", icon: FileCheck},
  {name: "납부자 관리", icon: Users},
  {name: "서약서 관리", icon: FileCheck},
  {name: "설정", icon: Settings},
]

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "여유":
      return "bg-green-100 text-green-700"
    case "임박":
      return "bg-yellow-100 text-yellow-700"
    case "마감":
      return "bg-gray-900 text-white"
    case "초과":
      return "bg-red-100 text-red-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

const getStatusBarColor = (status: string) => {
  switch (status) {
    case "여유":
      return "bg-green-500"
    case "임박":
      return "bg-yellow-500"
    case "마감":
      return "bg-gray-900"
    case "초과":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

function NotificationInitializer() {
  const {showNotification} = useNotification();

  useEffect(() => {
    initializeNotification(showNotification);
  }, [showNotification]);

  return null;
}


export default function Dashboard() {
  //const [현재 상태(초기 상태값이 할당), 상태 값 변경 함수] = useState(초기 상태값)
  const [activeMenu, setActiveMenu] = useState("대시보드")
  const [dashboardData, setDashboardData] = useState<DashboardData>({totalPayers: 0, buildings: []})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [loadTime, setLoadTime] = useState(new Date())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isMobileView, setIsMobileView] = useState(false)
  const [rounds, setRounds] = useState<Round[]>([])
  const [selectedRound, setSelectedRound] = useState<Round | null>(null)
  const [buildingDataLoaded, setBuildingDataLoaded] = useState(false)
  const [showSnow, setShowSnow] = useState<boolean>(true)

  useEffect(() => {
    const winter = isWinterSeason();
    const savedSnowPreference = Cookies.get('show-snow')
    if (savedSnowPreference === 'false') {
        setShowSnow(false)
    } else {
        setShowSnow(winter)
    }
  }, [])
  const toggleSnow = () => {
    const newValue = !showSnow
    setShowSnow(newValue)
    Cookies.set('show-snow', String(newValue), { expires: 3650 })
  }

  const isWinterSeason = () => {
    const currentMonth = new Date().getMonth();
    return currentMonth === 11 || currentMonth === 0;
  };

  // 총 이용자 수를 계산
  const calculateTotalUsers = () => {
    return dashboardData.buildings.reduce((total, building) => {
      let buildingTotal = 0
      if (building.fridgeUsage) buildingTotal += building.fridgeUsage
      if (building.freezerUsage) buildingTotal += building.freezerUsage
      if (building.integratedUsage) buildingTotal += building.integratedUsage
      return total + buildingTotal
    }, 0)
  }

  // 회차 선택 시 건물별 이용자 수를 가져오는 함수
  const fetchBuildingUsageByRound = async (roundId: number) => {
    try {
      setIsLoading(true)
      setBuildingDataLoaded(false)

      // API 호출 - 응답은 { "1": { "FREEZER": 18, "REFRIGERATOR": 43 }, ... } 형식
      const data = await get<Record<string, Record<string, number>>>(
        `${API_PATHS.ROUNDS}/fridgeApplications/${roundId}`,
      )

      if (data && typeof data === "object") {
        // 데이터가 예상 형식인 경우 바로 사용
        updateBuildingUsage(data)
      } else {
        console.error("Unexpected data format:", data)
        // 오류 메시지를 표시하지 않고 빈 데이터로 처리
        updateBuildingUsage({})
      }
    } catch (error) {
      console.error("건물별 이용자 수 조회 중 오류:", error)
      // 오류 메시지를 표시하지 않고 빈 데이터로 처리
      updateBuildingUsage({})
    } finally {
      setIsLoading(false)
      // 데이터 로딩이 완료되었음을 표시
      setTimeout(() => {
        setBuildingDataLoaded(true)
      }, 100) // 약간의 지연을 두어 상태 업데이트가 UI에 반영되도록 함
    }
  }

  // 건물별 이용자 수 업데이트 함수
  const updateBuildingUsage = (usageData: Record<string, Record<string, number>>) => {
    // 현재 상태의 dashboardData를 직접 참조하지 않고 함수형 업데이트 사용
    setDashboardData((prevData) => {
      // 기존 건물 데이터 복사
      const updatedBuildings = [...prevData.buildings]

      // 모든 건물의 이용자 수를 0으로 초기
      updatedBuildings.forEach((building, index) => {
        updatedBuildings[index] = {
          ...building,
          fridgeUsage: 0,
          freezerUsage: 0,
          integratedUsage: 0,
        }
      })

      // API 응답에 포함된 건물의 이용자 수 업데이트
      updatedBuildings.forEach((building, index) => {
        if (building.id && usageData[building.id.toString()]) {
          const buildingUsage = usageData[building.id.toString()]

          updatedBuildings[index] = {
            ...building,
            fridgeUsage: buildingUsage["REFRIGERATOR"] || 0,
            freezerUsage: buildingUsage["FREEZER"] || 0,
            integratedUsage: buildingUsage["COMBINED"] || 0,
          }
        }
      })

      // 새로운 대시보드 데이터 반환
      return {
        totalPayers: prevData.totalPayers, // 기존 totalPayers 값 유지
        buildings: updatedBuildings,
      }
    })

    // 로딩 시간 업데이트
    setLoadTime(new Date())
  }

  // 컴포넌트 마운트 시 회차 목록 가져오기
  useEffect(() => {
    if (activeMenu === "대시보드") {
      // Create a function that doesn't return a Promise
      const loadRounds = () => {
        setIsLoading(true)
        setBuildingDataLoaded(false)

        get<Round[]>(API_PATHS.ROUNDS)
          .then((data) => {
            // 시작일 기준으로 정렬 (빠른순)
            const sortedRounds = data.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            setRounds(sortedRounds)

            // 현재 날짜의 회차 찾기
            const currentDate = new Date()
            const currentRound = findCurrentRound(sortedRounds, currentDate)

            if (currentRound) {
              setSelectedRound(currentRound)
              return get<Record<string, Record<string, number>>>(
                `${API_PATHS.ROUNDS}/fridgeApplications/${currentRound.id}`,
              )
            } else if (sortedRounds.length > 0) {
              // 현재 날짜의 회차가 없으면 첫 번째 회차 선택
              setSelectedRound(sortedRounds[0])
              return get<Record<string, Record<string, number>>>(
                `${API_PATHS.ROUNDS}/fridgeApplications/${sortedRounds[0].id}`,
              )
            }
            return null
          })
          .then((usageData) => {
            if (usageData && typeof usageData === "object") {
              updateBuildingUsage(usageData)
            }
          })
          .catch((error) => {
            console.error("Error fetching rounds or usage data:", error)
          })
          .finally(() => {
            setIsLoading(false)
            // 데이터 로딩이 완료되었음을 표시
            setTimeout(() => {
              setBuildingDataLoaded(true)
            }, 100) // 약간의 지연을 두어 상태 업데이트가 UI에 반영되도록 함
          })
      }

      // Call the function without returning its result
      loadRounds()
    }
  }, [activeMenu])

  // Fetch dashboard data from API
  useEffect(() => {
    if (activeMenu === "대시보드") {
      // Create a function that doesn't return a Promise
      const loadDashboardData = () => {
        setIsLoading(true)
        setBuildingDataLoaded(false)

        get<DashboardData>(API_PATHS.DASHBOARD)
          .then((data) => {
            if (data && data.buildings) {
              // API 응답에 맞게 데이터 포맷팅
              const formattedData: DashboardData = {
                totalPayers: data.totalPayers || 0,
                buildings: data.buildings.map((building: any) => ({
                  ...building,
                  fridgeUsage: 0,
                  freezerUsage: 0,
                  integratedUsage: 0,
                })),
              }

              setDashboardData(formattedData)
              setError(null)
            } else {
              console.error("API call failed or returned invalid data")
              // 기본 대시보드 데이터 설정
              setDashboardData({
                totalPayers: 0,
                buildings: [],
              })
            }
          })
          .catch((fetchError) => {
            console.error("Error fetching from API:", fetchError)
            // 기본 대시보드 데이터 설정
            setDashboardData({
              totalPayers: 0,
              buildings: [],
            })
          })
          .finally(() => {
            setIsLoading(false)
            setLoadTime(new Date())
          })
      }

      // Call the function without returning its result
      loadDashboardData()
    }
  }, [activeMenu])

  // Close sidebar when screen size becomes smaller
  useEffect(() => {
    const handleResize = () => {
      const mobileWidth = 768 // md breakpoint in Tailwind
      if (window.innerWidth < mobileWidth) {
        // 768px is the medium breakpoint in Tailwind
        setIsSidebarOpen(false)
        setIsMobileView(true)
      } else {
        setIsMobileView(false)
      }
    }

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Initial check
    handleResize()

    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Update current time with appropriate interval
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now)

      // Calculate seconds since load
      const diffInSeconds = Math.floor((now.getTime() - loadTime.getTime()) / 1000)

      // Set next update interval - every second if < 60 seconds, otherwise every minute
      const nextUpdateDelay = diffInSeconds < 60 ? 1000 : 60000

      timeoutRef.current = setTimeout(updateTime, nextUpdateDelay)
    }

    // Use ref to store timeout ID for cleanup
    const timeoutRef = {current: null as NodeJS.Timeout | null}

    // Initial update
    updateTime()

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [loadTime])

  // 건물 타입에 따라 표시할 슬롯과 사용량 결정
  const getBuildingDisplayData = (building: Building) => {
    switch (building.type) {
      case "REFRIGERATOR":
        return {
          type: "single",
          slots: building.fridgeSlots,
          usage: building.fridgeUsage || 0,
          label: "냉장",
        }
      case "FREEZER":
        return {
          type: "single",
          slots: building.freezerSlots,
          usage: building.freezerUsage || 0,
          label: "냉동",
        }
      case "COMBINED":
        return {
          type: "single",
          slots: building.integratedSlots,
          usage: building.integratedUsage || 0,
          label: "통합",
        }
      case "ALL":
        // ALL 타입은 냉장, 냉동만 표시 (통합 아님)
        return {
          type: "dual",
          fridgeSlots: building.fridgeSlots,
          fridgeUsage: building.fridgeUsage || 0,
          freezerSlots: building.freezerSlots,
          freezerUsage: building.freezerUsage || 0,
        }
      default:
        return {
          type: "single",
          slots: 0,
          usage: 0,
          label: "",
        }
    }
  }

  // Calculate usage percentage and determine color and status
  const getUsageData = (slots: number, usage: number) => {
    // slots이 0이면 나눗셈에서 NaN이 발생하므로 이 방지
    const usagePercentage = slots > 0 ? (usage / slots) * 100 : 0

    // utils.ts의 getUsageStatus 함수 사용
    const status = getUsageStatus(usage, slots)

    return {
      percentage: Math.min(usagePercentage, 100),
      color: "bg-black", // 이 값은 사용되지 않으므로 그대로 둡니다
      status,
      usagePercentage,
    }
  }

  const formatRelativeTime = () => {
    const diffInSeconds = Math.floor((currentTime.getTime() - loadTime.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return "방금 전"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}분 전`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}시간 전`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}일 전`
    }
  }

  // 대시보드 데이터 새로고침 함수
  const refreshDashboardData = () => {
    if (isLoading) return // 이미 로딩 중이면 중복 요청 방지

    setIsLoading(true)
    setBuildingDataLoaded(false)

    // Get dashboard data
    get<DashboardData>(API_PATHS.DASHBOARD)
      .then((data) => {
        if (data && data.buildings) {
          // API 응답에 맞게 데이터 포맷팅
          const formattedData: DashboardData = {
            totalPayers: data.totalPayers || 0,
            buildings: data.buildings.map((building: any) => ({
              ...building,
              fridgeUsage: 0,
              freezerUsage: 0,
              integratedUsage: 0,
            })),
          }

          setDashboardData(formattedData)
          setError(null)

          // 선택된 회차에 대한 건물 이용 데이터 가져오기
          if (selectedRound) {
            return get<Record<string, Record<string, number>>>(
              `${API_PATHS.ROUNDS}/fridgeApplications/${selectedRound.id}`,
            )
          }
        } else {
          console.error("API call failed during refresh or returned invalid data")
        }
        return null
      })
      .then((usageData) => {
        if (usageData && typeof usageData === "object") {
          updateBuildingUsage(usageData)
        }
      })
      .catch((err) => {
        console.error("Error refreshing dashboard data:", err)
      })
      .finally(() => {
        setIsLoading(false)
        setLoadTime(new Date()) // 로딩 시간 업데이트

        // 데���터 로딩이 완료되었음을 표시
        setTimeout(() => {
          setBuildingDataLoaded(true)
        }, 100) // 약간의 지연을 두어 상태 업데이트가 UI에 반영되도록 함
      })
  }

  // renderContent 함수에 냉장고 관리 케이스 제거
  const renderContent = () => {
    switch (activeMenu) {
      case "냉장고 신청/연장":
        return <RefrigeratorApplication/>
      case "냉장고 관리":
        return <FridgeManagement/>
      case "납부자 관리":
        return <PayerManagement/>
      case "서약서 관리":
        return <ConsentManagement/>
      case "설정":
        return <SettingsPage/>
      default:
        return (
          <div className="max-w-3xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">오류!</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            ) : (
              <>
                {/* Usage status section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-semibold md:block hidden">대시보드</h1>
                    </div>
                    {/* 대시보드 컴포넌트에서 SelectTrigger에 password prop을 전달합니다. */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      {selectedRound?.password && (
                        <div className="bg-gray-100 px-3 py-1 rounded-full text-sm">{selectedRound.password}</div>
                      )}
                      <Select
                        value={selectedRound?.id?.toString() || ""}
                        onValueChange={(value) => {
                          const round = rounds.find((r) => r.id?.toString() === value)
                          if (round) {
                            setSelectedRound(round)
                            fetchBuildingUsageByRound(round.id)
                          }
                        }}
                      >
                        <SelectTrigger className="w-full md:w-[280px] pl-3">
                          <SelectValue placeholder="회차 선택"/>
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(rounds) && rounds.length > 0 ? (
                            rounds.map((round, index) => (
                              <SelectItem key={round.id ?? index} value={(round.id ?? "").toString()}>
                                {round.name} ({round.startDate} ~ {round.endDate})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="0">회차 정보 없음</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-row gap-3 mb-8 w-full">
                    {/* 총 이용자 수 카드 */}
                    <div className="bg-white rounded-lg shadow-sm p-4 flex-1">
                      <h3 className="text-sm text-gray-500 mb-1">총 이용자 수</h3>
                      {isLoading || !buildingDataLoaded ? (
                        <p className="text-3xl font-semibold">-</p>
                      ) : calculateTotalUsers() === 0 ? (
                        <p className="text-3xl font-semibold">0</p>
                      ) : (
                        <p className="text-3xl font-semibold">{calculateTotalUsers()}</p>
                      )}
                    </div>

                    {/* 총 납부자 수 카드 */}
                    <div className="bg-white rounded-lg shadow-sm p-4 flex-1">
                      <h3 className="text-sm text-gray-500 mb-1">총 납부자 수</h3>
                      {isLoading || !buildingDataLoaded ? (
                        <p className="text-3xl font-semibold">-</p>
                      ) : dashboardData.totalPayers === 0 ? (
                        <p className="text-3xl font-semibold">0</p>
                      ) : (
                        <p className="text-3xl font-semibold">{dashboardData.totalPayers}</p>
                      )}
                    </div>
                  </div>

                  {dashboardData.buildings && dashboardData.buildings.length > 0 ? (
                    <div className={`grid gap-4 ${isMobileView ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
                      {dashboardData.buildings.map((building) => {
                        const displayData = getBuildingDisplayData(building)

                        if (displayData.type === "dual") {
                          // ALL 타입은 냉장, 냉동만 표시
                          const fridgeUsage = getUsageData(displayData.fridgeSlots || 0, displayData.fridgeUsage || 0)
                          const freezerUsage = getUsageData(
                            displayData.freezerSlots || 0,
                            displayData.freezerUsage || 0,
                          )

                          return (
                            <div key={building.name} className="bg-white rounded-lg shadow-sm p-3 md:p-5">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium">{building.name}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                {/* 냉장 슬롯 */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-500">냉장</span>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeColor(fridgeUsage.status)}`}
                                    >
                                      {fridgeUsage.status}
                                    </span>
                                  </div>
                                  <div className="relative h-2 bg-black/10 rounded-full mb-1">
                                    <div
                                      className={`absolute left-0 top-0 h-full rounded-full ${getStatusBarColor(fridgeUsage.status)}`}
                                      style={{width: `${fridgeUsage.percentage}%`}}
                                    />
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {!buildingDataLoaded ? (
                                      <>-명/{displayData.fridgeSlots} 명</>
                                    ) : (
                                      <>
                                        {displayData.fridgeUsage}/{displayData.fridgeSlots} 명
                                        <span className="float-right">
                                          {isNaN(fridgeUsage.usagePercentage)
                                            ? "0"
                                            : Math.round(fridgeUsage.usagePercentage)}
                                          %
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* 냉동 슬롯 */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-500">냉동</span>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeColor(freezerUsage.status)}`}
                                    >
                                      {freezerUsage.status}
                                    </span>
                                  </div>
                                  <div className="relative h-2 bg-black/10 rounded-full mb-1">
                                    <div
                                      className={`absolute left-0 top-0 h-full rounded-full ${getStatusBarColor(freezerUsage.status)}`}
                                      style={{width: `${freezerUsage.percentage}%`}}
                                    />
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {!buildingDataLoaded ? (
                                      <>-명/{displayData.freezerSlots} 명</>
                                    ) : (
                                      <>
                                        {displayData.freezerUsage}/{displayData.freezerSlots} 명
                                        <span className="float-right">
                                          {isNaN(freezerUsage.usagePercentage)
                                            ? "0"
                                            : Math.round(freezerUsage.usagePercentage)}
                                          %
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        } else {
                          // 단일 타입 건물 (REFRIGERATOR, FREEZER, COMBINED)
                          const usage = getUsageData(displayData.slots || 0, displayData.usage || 0)

                          return (
                            <div key={building.name} className="bg-white rounded-lg shadow-sm p-3 md:p-5">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{building.name}</span>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeColor(usage.status)}`}
                                  >
                                    {usage.status}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500">{displayData.label}</span>
                              </div>

                              <div className="relative h-2 bg-black/10 rounded-full mb-2">
                                <div
                                  className={`absolute left-0 top-0 h-full rounded-full ${getStatusBarColor(usage.status)}`}
                                  style={{width: `${usage.percentage}%`}}
                                />
                              </div>
                              <div className="text-xs text-gray-500">
                                {!buildingDataLoaded ? (
                                  <>-명/{displayData.slots} 명</>
                                ) : (
                                  <>
                                    {displayData.usage}/{displayData.slots} 명
                                    <span className="float-right">
                                      {isNaN(usage.usagePercentage) ? "0" : Math.round(usage.usagePercentage)}%
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        }
                      })}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <p className="text-gray-500">건물 정보가 없습니다.</p>
                    </div>
                  )}
                </div>

                {/* Page load time reference */}
                <div className="flex items-center text-xs text-gray-500 mt-8">
                  <span>정보 새로고침: {formatRelativeTime()}</span>
                  <button
                    onClick={refreshDashboardData}
                    className="ml-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                    disabled={isLoading}
                    title="새로고침"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-blue-500" : "text-gray-500"}`}
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        )
    }
  }

  return (
    <div style={{ position: 'relative', background: '#282c34' }}>
        {showSnow && (
          <Snowfall
              style={{pointerEvents: 'none'}}
          />
        )}

        <div className="flex h-screen bg-gray-50">
          {/* 모바일 헤더 - 햄버거 메뉴와 제목 */}
          <div
            className="fixed top-0 left-0 right-0 bg-white z-50 md:hidden flex items-center h-14 px-4 border-b shadow-sm">
            <Button variant="ghost" size="icon" className="mr-3" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu className="h-6 w-6"/>
            </Button>
            <h1 className="text-lg font-medium">{activeMenu}</h1>
          </div>

          {/* Sidebar */}
          <div
            className={`fixed inset-y-0 left-0 transform ${
              isSidebarOpen ? "translate-x-0 pt-[70px]" : "-translate-x-full"
            } md:relative md:translate-x-0 md:pt-0 md:h-screen transition duration-200 ease-in-out z-40 w-48 bg-white shadow-md flex flex-col`}
          >
            <div className="p-4 border-b">
              <h1 className="text-lg font-semibold whitespace-nowrap">통합관리시스템</h1>
            </div>

            <nav className="flex flex-col py-4 flex-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    href="#"
                    key={item.name}
                    onClick={(e) => {
                      e.preventDefault()
                      setActiveMenu(item.name)
                      setIsSidebarOpen(false)
                    }}
                    className={`flex items-center gap-3 py-3 px-4 text-sm hover:bg-gray-50 ${
                      activeMenu === item.name ? "bg-gray-50 text-blue-600" : "text-gray-600"
                    }`}
                  >
                    <Icon className="h-4 w-4"/>
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* 사용자 프로필 및 로그아웃 버튼 */}
            <UserProfile/>
          </div>

          {/* Overlay for mobile */}
          {isSidebarOpen && (
            <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}/>
          )}

          {/* Main content */}
          <NotificationProvider>
            <NotificationInitializer/>
            <div className="flex-1 p-6 md:p-8 pt-[70px] md:pt-8 overflow-x-hidden">
              <div className="w-full">{renderContent()}</div>
            </div>
            <Notification/>
          </NotificationProvider>

          {/* 5. 우측 하단 플로팅 토글 버튼 */}
          {isWinterSeason() && (
            <div className="fixed bottom-6 right-6 z-[10000]">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleSnow}
                    className={`rounded-full shadow-lg transition-all duration-300 ${
                        showSnow
                            ? "bg-white/80 backdrop-blur-sm border-blue-100"
                            : "bg-gray-100/50 border-transparent opacity-70"
                    }`}
                    title={showSnow ? "눈 끄기" : "눈 켜기"}
                >
                    <Snowflake
                        className={`h-5 w-5 transition-colors ${
                            showSnow ? "text-blue-400" : "text-gray-400"
                        }`}
                    />
                </Button>
            </div>
          )}
        </div>
    </div>
  )
}