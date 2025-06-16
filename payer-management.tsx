"use client"

import type React from "react"

// ===== 임포트 및 컴포넌트 의존성 =====
import { DialogFooter } from "@/components/ui/dialog"

import { useEffect, useRef, useCallback, useState, useReducer, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus, Check, X, Filter, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import MobilePayerForm from "./mobile-payer-form"
import { API_PATHS } from "@/lib/api-config"
import { put, del, get, post } from "@/lib/api-client"
import { Switch } from "@/components/ui/switch"
import type { Payer, Business, BusinessParticipation } from "@/lib/interfaces"
import PayerRow from "./components/payer-row"

// 상태 타입 정의
interface PayerState {
  // 데이터 상태
  payers: Payer[]
  filteredPayers: Payer[]
  defaultAmount: string
  recentlyUpdated: string[]

  // UI 상태
  isLoading: boolean
  isRefreshing: boolean // 새로고침 상태 추가
  selectedPayer: Payer | null

  dialogState: {
    edit: boolean
    delete: boolean
    new: boolean
  }

  mobileForm: {
    show: boolean
    mode: "new" | "edit"
  }

  actionMessage: {
    type: "success" | "error"
    message: string
  } | null

  // 필터 상태
  isFilterOpen: boolean
  searchTerm: string
  statusFilter: string | null
  typeFilter: string | null
  startDateFilter: string
  endDateFilter: string

  // 폼 상태
  newPayerForm: {
    id: string
    amount: string
    date: string
    type: string
  }

  formErrors: {
    id: boolean
    amount: boolean
    date: boolean
    type: boolean
  }

  editForm: {
    id: string
    amount: string
    date: string
    type: string
    status: string
  }

  bulkRegistration: {
    show: boolean
    rows: Array<{
      id: string
      name: string
      amount: string
      date: string
      type: string
      errors: {
        name: boolean
        amount: boolean
        date: boolean
      }
    }>
  }
}

// 액션 타입 정의
type PayerAction =
  | { type: "SET_PAYERS"; payload: Payer[] }
  | { type: "SET_FILTERED_PAYERS"; payload: Payer[] }
  | { type: "SET_DEFAULT_AMOUNT"; payload: string }
  | { type: "ADD_RECENTLY_UPDATED"; payload: string }
  | { type: "REMOVE_RECENTLY_UPDATED"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_REFRESHING"; payload: boolean } // 새로고침 상태 액션 추가
  | { type: "SET_SELECTED_PAYER"; payload: Payer | null }
  | { type: "SET_DIALOG"; payload: { key: "edit" | "delete" | "new"; value: boolean } }
  | { type: "SET_MOBILE_FORM"; payload: { show: boolean; mode: "new" | "edit" } }
  | { type: "SET_ACTION_MESSAGE"; payload: { type: "success" | "error"; message: string } | null }
  | { type: "SET_FILTER_OPEN"; payload: boolean }
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "SET_STATUS_FILTER"; payload: string | null }
  | { type: "SET_TYPE_FILTER"; payload: string | null }
  | { type: "SET_START_DATE_FILTER"; payload: string }
  | { type: "SET_END_DATE_FILTER"; payload: string }
  | { type: "SET_NEW_PAYER_FORM"; payload: Partial<PayerState["newPayerForm"]> }
  | { type: "RESET_NEW_PAYER_FORM" }
  | { type: "SET_FORM_ERRORS"; payload: Partial<PayerState["formErrors"]> }
  | { type: "SET_EDIT_FORM"; payload: Partial<PayerState["editForm"]> }
  | { type: "INIT_EDIT_FORM"; payload: Payer }
  | { type: "ADD_PAYER"; payload: Payer }
  | { type: "UPDATE_PAYER"; payload: { id: number; data: Partial<Payer> } }
  | { type: "DELETE_PAYER"; payload: number }
  | { type: "RESET_FILTERS" }
  | { type: "SET_BULK_REGISTRATION"; payload: { show: boolean } }
  | { type: "ADD_BULK_ROW" }
  | { type: "REMOVE_BULK_ROW"; payload: number }
  | { type: "UPDATE_BULK_ROW"; payload: { index: number; field: string; value: string } }
  | { type: "SET_BULK_ROW_ERROR"; payload: { index: number; field: string; value: boolean } }
  | { type: "RESET_BULK_REGISTRATION" }

// 리듀서 함수
function payerReducer(state: PayerState, action: PayerAction): PayerState {
  switch (action.type) {
    case "SET_PAYERS":
      return { ...state, payers: action.payload }
    case "SET_FILTERED_PAYERS":
      return { ...state, filteredPayers: action.payload }
    case "SET_DEFAULT_AMOUNT":
      return { ...state, defaultAmount: action.payload }
    case "ADD_RECENTLY_UPDATED":
      return { ...state, recentlyUpdated: [...state.recentlyUpdated, action.payload] }
    case "REMOVE_RECENTLY_UPDATED":
      return {
        ...state,
        recentlyUpdated: state.recentlyUpdated.filter((id) => id !== action.payload),
      }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_REFRESHING":
      return { ...state, isRefreshing: action.payload }
    case "SET_SELECTED_PAYER":
      return { ...state, selectedPayer: action.payload }
    case "SET_DIALOG":
      return {
        ...state,
        dialogState: {
          ...state.dialogState,
          [action.payload.key]: action.payload.value,
        },
      }
    case "SET_MOBILE_FORM":
      return { ...state, mobileForm: action.payload }
    case "SET_ACTION_MESSAGE":
      return { ...state, actionMessage: action.payload }
    case "SET_FILTER_OPEN":
      return { ...state, isFilterOpen: action.payload }
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload }
    case "SET_STATUS_FILTER":
      return { ...state, statusFilter: action.payload }
    case "SET_TYPE_FILTER":
      return { ...state, typeFilter: action.payload }
    case "SET_START_DATE_FILTER":
      return { ...state, startDateFilter: action.payload }
    case "SET_END_DATE_FILTER":
      return { ...state, endDateFilter: action.payload }
    case "SET_NEW_PAYER_FORM":
      return {
        ...state,
        newPayerForm: { ...state.newPayerForm, ...action.payload },
      }
    case "RESET_NEW_PAYER_FORM":
      return {
        ...state,
        newPayerForm: {
          id: "",
          amount: state.defaultAmount,
          date: new Date().toISOString().split("T")[0],
          type: "계좌이체",
        },
      }
    case "SET_FORM_ERRORS":
      return {
        ...state,
        formErrors: { ...state.formErrors, ...action.payload },
      }
    case "SET_EDIT_FORM":
      return {
        ...state,
        editForm: { ...state.editForm, ...action.payload },
      }
    case "INIT_EDIT_FORM":
      return {
        ...state,
        editForm: {
          id: action.payload.name,
          amount: action.payload.amount.toString(),
          date: action.payload.date || new Date().toISOString().split("T")[0],
          type: action.payload.type === "BANK_TRANSFER" ? "계좌이체" : "현장납부",
          status: action.payload.status === "PAID" ? "PAID" : "REFUNDED",
        },
      }
    case "ADD_PAYER":
      return {
        ...state,
        payers: [...state.payers, action.payload],
      }
    case "UPDATE_PAYER":
      return {
        ...state,
        payers: state.payers.map((payer) =>
          payer.id === action.payload.id ? { ...payer, ...action.payload.data } : payer,
        ),
      }
    case "DELETE_PAYER":
      return {
        ...state,
        payers: state.payers.filter((payer) => payer.id !== action.payload),
      }
    case "RESET_FILTERS":
      return {
        ...state,
        searchTerm: "",
        statusFilter: null,
        typeFilter: null,
        startDateFilter: "",
        endDateFilter: "",
      }
    case "SET_BULK_REGISTRATION":
      return { ...state, bulkRegistration: { ...state.bulkRegistration, show: action.payload.show } }
    case "ADD_BULK_ROW":
      return {
        ...state,
        bulkRegistration: {
          ...state.bulkRegistration,
          rows: [
            ...state.bulkRegistration.rows,
            {
              id: `row-${Date.now()}`,
              name: "",
              amount: state.defaultAmount,
              date: new Date().toISOString().split("T")[0],
              type: "계좌이체",
              errors: { name: false, amount: false, date: false },
            },
          ],
        },
      }
    case "REMOVE_BULK_ROW":
      return {
        ...state,
        bulkRegistration: {
          ...state.bulkRegistration,
          rows: state.bulkRegistration.rows.filter((_, index) => index !== action.payload),
        },
      }
    case "UPDATE_BULK_ROW":
      return {
        ...state,
        bulkRegistration: {
          ...state.bulkRegistration,
          rows: state.bulkRegistration.rows.map((row, index) =>
            index === action.payload.index ? { ...row, [action.payload.field]: action.payload.value } : row,
          ),
        },
      }
    case "SET_BULK_ROW_ERROR":
      return {
        ...state,
        bulkRegistration: {
          ...state.bulkRegistration,
          rows: state.bulkRegistration.rows.map((row, index) =>
            index === action.payload.index
              ? {
                  ...row,
                  errors: { ...row.errors, [action.payload.field]: action.payload.value },
                }
              : row,
          ),
        },
      }
    case "RESET_BULK_REGISTRATION":
      return {
        ...state,
        bulkRegistration: {
          show: false,
          rows: [
            {
              id: `row-${Date.now()}`,
              name: "",
              amount: state.defaultAmount,
              date: new Date().toISOString().split("T")[0],
              type: "계좌이체",
              errors: { name: false, amount: false, date: false },
            },
          ],
        },
      }
    default:
      return state
  }
}

// 초기 상태
const initialState: PayerState = {
  payers: [],
  filteredPayers: [],
  defaultAmount: "7000",
  recentlyUpdated: [],
  isLoading: false,
  isRefreshing: false,
  selectedPayer: null,
  dialogState: {
    edit: false,
    delete: false,
    new: false,
  },
  mobileForm: {
    show: false,
    mode: "new",
  },
  actionMessage: null,
  isFilterOpen: false,
  searchTerm: "",
  statusFilter: null,
  typeFilter: null,
  startDateFilter: "",
  endDateFilter: "",
  newPayerForm: {
    id: "",
    amount: "7000",
    date: new Date().toISOString().split("T")[0],
    type: "계좌이체",
  },
  formErrors: {
    id: false,
    amount: false,
    date: false,
    type: false,
  },
  editForm: {
    id: "",
    amount: "",
    date: "",
    type: "계좌이체",
    status: "PAID",
  },
  bulkRegistration: {
    show: false,
    rows: [
      {
        id: `row-${Date.now()}`,
        name: "",
        amount: "7000",
        date: new Date().toISOString().split("T")[0],
        type: "계좌이체",
        errors: { name: false, amount: false, date: false },
      },
    ],
  },
}

// ===== 메인 컴포넌트 =====
const PayerManagement = () => {
  // 상태 관리를 위한 리듀서 사용
  const [state, dispatch] = useReducer(payerReducer, initialState)

  // 상태 구조 분해 할당
  const {
    payers,
    filteredPayers,
    defaultAmount,
    recentlyUpdated,
    isLoading,
    isRefreshing,
    selectedPayer,
    dialogState,
    mobileForm,
    actionMessage,
    isFilterOpen,
    searchTerm,
    statusFilter,
    typeFilter,
    startDateFilter,
    endDateFilter,
    newPayerForm,
    formErrors,
    editForm,
    bulkRegistration,
  } = state

  // 모바일 상태 확인
  const isMobile = useIsMobile()
  const [isNarrowScreen, setIsNarrowScreen] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [visibleBusinesses, setVisibleBusinesses] = useState<Record<number, boolean>>({})
  const [showAllBusinesses, setShowAllBusinesses] = useState(true)
  const [isUpdatingBusiness, setIsUpdatingBusiness] = useState<{ payerId: number; businessId: number } | null>(null)

  // 테이블 컨테이너 참조
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // 검색어 디바운싱을 위한 상태 추가 (useState 아래에 추가)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")

  // 액션 헬퍼 함수들
  const setActionMessage = useCallback((type: "success" | "error", message: string) => {
    dispatch({
      type: "SET_ACTION_MESSAGE",
      payload: { type, message },
    })
  }, [])

  const setDialog = useCallback((key: "edit" | "delete" | "new", value: boolean) => {
    dispatch({ type: "SET_DIALOG", payload: { key, value } })
  }, [])

  const setMobileForm = useCallback((show: boolean, mode: "new" | "edit" = "new") => {
    dispatch({ type: "SET_MOBILE_FORM", payload: { show, mode } })
  }, [])

  const setFilter = useCallback((key: string, value: any) => {
    switch (key) {
      case "searchTerm":
        dispatch({ type: "SET_SEARCH_TERM", payload: value })
        break
      case "statusFilter":
        dispatch({ type: "SET_STATUS_FILTER", payload: value })
        break
      case "typeFilter":
        dispatch({ type: "SET_TYPE_FILTER", payload: value })
        break
      case "startDateFilter":
        dispatch({ type: "SET_START_DATE_FILTER", payload: value })
        break
      case "endDateFilter":
        dispatch({ type: "SET_END_DATE_FILTER", payload: value })
        break
      case "isFilterOpen":
        dispatch({ type: "SET_FILTER_OPEN", payload: value })
        break
    }
  }, [])

  const resetFilters = useCallback(() => {
    dispatch({ type: "RESET_FILTERS" })
  }, [])

  const setNewPayerForm = useCallback((data: Partial<PayerState["newPayerForm"]>) => {
    dispatch({ type: "SET_NEW_PAYER_FORM", payload: data })
  }, [])

  const resetNewPayerForm = useCallback(() => {
    dispatch({ type: "RESET_NEW_PAYER_FORM" })
  }, [])

  const setFormErrors = useCallback((errors: Partial<PayerState["formErrors"]>) => {
    dispatch({ type: "SET_FORM_ERRORS", payload: errors })
  }, [])

  const setEditForm = useCallback((data: Partial<PayerState["editForm"]>) => {
    dispatch({ type: "SET_EDIT_FORM", payload: data })
  }, [])

  const initEditForm = useCallback((payer: Payer) => {
    dispatch({ type: "INIT_EDIT_FORM", payload: payer })
  }, [])

  const updatePayer = useCallback((id: number, data: Partial<Payer>) => {
    dispatch({ type: "UPDATE_PAYER", payload: { id, data } })
  }, [])

  const deletePayer = useCallback((id: number) => {
    dispatch({ type: "DELETE_PAYER", payload: id })
  }, [])

  const addRecentlyUpdated = useCallback((id: string) => {
    dispatch({ type: "ADD_RECENTLY_UPDATED", payload: id })
  }, [])

  const removeRecentlyUpdated = useCallback((id: string) => {
    dispatch({ type: "REMOVE_RECENTLY_UPDATED", payload: id })
  }, [])

  const setSelectedPayer = useCallback((payer: Payer | null) => {
    dispatch({ type: "SET_SELECTED_PAYER", payload: payer })
  }, [])

  // API 호출 함수들
  const fetchPayers = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const data = await get<Payer[]>(API_PATHS.PAYMENT)

      // 날짜 최신순으로 정렬 (날짜가 없는 경우는 가장 마지막에 배치)
      const sortedData = [...data].sort((a, b) => {
        // 둘 다 날짜가 있는 경우 비교
        if (a.date && b.date) {
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        }
        // a만 날짜가 없는 경우
        if (!a.date && b.date) {
          return 1
        }
        // b만 날짜가 없는 경우
        if (a.date && !b.date) {
          return -1
        }
        // 둘 다 날짜가 없는 경우 순서 유지
        return 0
      })

      dispatch({ type: "SET_PAYERS", payload: sortedData })
      return sortedData
    } catch (error) {
      console.error("Error fetching payers:", error)
      setActionMessage(
        "error",
        `납부자 목록을 불러오는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      )
      return []
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [setActionMessage])

  const fetchDefaultAmount = useCallback(async () => {
    try {
      const amount = await get<string>(API_PATHS.CONFIG_DEFAULT_AMOUNT)
      dispatch({ type: "SET_DEFAULT_AMOUNT", payload: amount })
      dispatch({
        type: "SET_NEW_PAYER_FORM",
        payload: { amount },
      })
      return amount
    } catch (error) {
      console.error("Error fetching default amount:", error)
      setActionMessage(
        "error",
        `기본 납부 금액을 불러오는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      )
      return "7000"
    }
  }, [setActionMessage])

  const fetchBusinesses = useCallback(async () => {
    try {
      const response = await get<Business[]>(API_PATHS.BUSINESS)

      // Set the businesses state
      setBusinesses(response)

      // Initialize visible businesses
      const initialVisibility: Record<number, boolean> = {}
      response.forEach((business) => {
        if (business.id !== undefined) {
          initialVisibility[business.id] = true
        }
      })
      setVisibleBusinesses(initialVisibility)
      return response
    } catch (error) {
      console.error("Error fetching businesses:", error)
      setBusinesses([])
      setActionMessage(
        "error",
        `사업 목록을 불러오는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      )
      return []
    }
  }, [setActionMessage])

  // 복합 액션 함수들
  const openEditForm = useCallback(
    (payer: Payer) => {
      setSelectedPayer(payer)
      initEditForm(payer)
      setDialog("edit", true)
    },
    [setSelectedPayer, initEditForm, setDialog],
  )

  const openNewForm = useCallback(() => {
    resetNewPayerForm()
    setDialog("new", true)
  }, [resetNewPayerForm, setDialog])

  // ===== 생명주기 훅 =====
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    const fetchData = () => {
      dispatch({ type: "SET_LOADING", payload: true })

      Promise.all([fetchPayers(), fetchDefaultAmount(), fetchBusinesses()])
        .then(([payersData]) => {
          dispatch({ type: "SET_FILTERED_PAYERS", payload: payersData })
        })
        .catch((error) => {
          setActionMessage("error", `데이터 불러오기 실패: ${error instanceof Error ? error.message : String(error)}`)
        })
        .finally(() => {
          dispatch({ type: "SET_LOADING", payload: false })
        })
    }

    fetchData()
  }, [fetchPayers, fetchDefaultAmount, fetchBusinesses, setActionMessage])

  // 액션 메시지 자동 제거 로직 추가 (useEffect 섹션에 추가)
  // 기존 useEffect 아래에 추가
  useEffect(() => {
    if (!actionMessage) return

    const timeout = setTimeout(
      () => dispatch({ type: "SET_ACTION_MESSAGE", payload: null }),
      actionMessage.type === "error" ? 60000 : 3000,
    )

    return () => clearTimeout(timeout) // 기존 타이머 정리
  }, [actionMessage])

  // 검색어 디바운싱 효과 추가 (useEffect 섹션에 추가)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // 300ms 디바운스

    return () => clearTimeout(timer)
  }, [searchTerm])

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsNarrowScreen(window.innerWidth <= 450)
    }

    // 초기 체크
    checkScreenSize()

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener("resize", checkScreenSize)

    // 클린업
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  // CSS 애니메이션 스타일 추가
  useEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = `
    @keyframes slideFromRight {
      0% {
        transform: translateX(100%);
      }
      100% {
        transform: translateX(0%);
      }
    }
    
    .update-animation::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(34, 197, 94, 0.2);
      z-index: -1;
      animation: slideFromRight 1s ease-out forwards;
    }
  
  @keyframes shrinkLeftSuccess {
    0% {
      width: 100%;
    }
    100% {
      width: 0%;
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

  .animate-shrink-left-success {
    animation: shrinkLeftSuccess 3s linear forwards;
  }

  .animate-shrink-left-error {
    animation: shrinkLeftError 60s linear forwards;
  }
`
    const styleElement = document.createElement("style")
    styleElement.innerHTML = style.innerHTML
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // ===== 필터링 로직 =====
  // useEffect를 사용한 필터링 최적화
  //기존 useEffect 내의 applyFilters 함수를 제거하고 아래 코드로 대체
  const applyFilters = useCallback(
    (payersToFilter = payers) => {
      // 필터가 없는 경우 전체 데이터 반환
      if (!debouncedSearchTerm && statusFilter === null && typeFilter === null && !startDateFilter && !endDateFilter) {
        return payersToFilter
      }

      // 필터 적용
      return payersToFilter.filter((payer) => {
        // 검색어 필터
        if (
          debouncedSearchTerm &&
          !(payer.id.toString().includes(debouncedSearchTerm) || payer.name.includes(debouncedSearchTerm))
        ) {
          return false
        }

        // 상태 필터
        if (statusFilter !== null && payer.status !== statusFilter) {
          return false
        }

        // 유형 필터
        if (typeFilter !== null && payer.type !== typeFilter) {
          return false
        }

        // 날짜 필터
        if (startDateFilter || endDateFilter) {
          if (!payer.date) return false

          if (startDateFilter && endDateFilter) {
            return payer.date >= startDateFilter && payer.date <= endDateFilter
          } else if (startDateFilter) {
            return payer.date >= startDateFilter
          } else if (endDateFilter) {
            return payer.date <= endDateFilter
          }
        }

        return true
      })
    },
    [debouncedSearchTerm, statusFilter, typeFilter, startDateFilter, endDateFilter],
  )

  // 필터링된 결과를 useMemo로 메모이제이션 (기존 useEffect 대체)
  const filteredPayersData = useMemo(() => {
    return applyFilters(payers)
  }, [applyFilters, payers])

  // 활성 필터 개수 계산을 useMemo로 최적화
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchTerm !== "") count++
    if (statusFilter !== null) count++
    if (typeFilter !== null) count++
    if (startDateFilter !== "") count++
    if (endDateFilter !== "") count++

    // 비활성화된 사업 개수 계산
    const hiddenBusinessCount = Object.values(visibleBusinesses).filter((visible) => !visible).length
    if (hiddenBusinessCount > 0) count++

    return count
  }, [searchTerm, statusFilter, typeFilter, startDateFilter, endDateFilter, visibleBusinesses])

  // 필터 활성화 여부 확인을 useMemo로 최적화
  const isFilterActive = useCallback(() => {
    // 비활성화된 사업이 있는지 확인
    const hasHiddenBusiness = Object.values(visibleBusinesses).some((visible) => !visible)

    return (
      searchTerm !== "" ||
      statusFilter !== null ||
      typeFilter !== null ||
      startDateFilter !== "" ||
      endDateFilter !== "" ||
      hasHiddenBusiness
    )
  }, [searchTerm, statusFilter, typeFilter, startDateFilter, endDateFilter, visibleBusinesses])

  // 활성 납부자 수 계산을 useMemo로 최적화
  const totalActivePayers = useMemo(() => {
    return payers.filter((payer) => payer.status === "PAID").length
  }, [payers])

  // 총 납부 금액 계산을 useMemo로 최적화
  const totalAmount = useMemo(() => {
    return payers.filter((payer) => payer.status === "PAID").reduce((total, payer) => total + Number(payer.amount), 0)
  }, [payers])

  // 필터링된 납부자 중 활성 납부자(PAID 상태) 수를 계산하는 useMemo 추가
  // 활성 납부자 수 계산을 useMemo로 최적화 코드 아래에 추가
  const filteredActivePayers = useMemo(() => {
    return filteredPayers.filter((payer) => payer.status === "PAID").length
  }, [filteredPayers])

  useEffect(() => {
    dispatch({ type: "SET_FILTERED_PAYERS", payload: filteredPayersData })
  }, [filteredPayersData])

  // ===== 이벤트 핸들러 =====

  // 납부자 수정 다이얼로그 열기
  const handleEdit = useCallback(
    (payer: Payer) => {
      if (isMobile) {
        setSelectedPayer(payer)
        initEditForm(payer)
        setMobileForm(true, "edit")
      } else {
        openEditForm(payer)
      }
    },
    [isMobile, openEditForm, setMobileForm, setSelectedPayer, initEditForm],
  )

  // 납부자 삭제 다이얼로그 열기
  const handleDelete = useCallback(() => {
    if (selectedPayer) {
      setDialog("delete", true)
    }
  }, [selectedPayer, setDialog])

  // 납부자 삭제 확인
  const confirmDelete = useCallback(async () => {
    if (selectedPayer) {
      try {
        // 환경에 상관없이 동일한 방식으로 삭제 요청
        await del(API_PATHS.PAYMENT_BY_ID(selectedPayer.id))

        // 성공 시 로컬 상태 업데이트 (함수형 업데이트 사용)
        deletePayer(selectedPayer.id)
        setActionMessage("success", "납부자가 성공적으로 삭제되었습니다.")

        setDialog("delete", false)
        setDialog("edit", false)
      } catch (error) {
        console.error("Error deleting payment:", error)
        setActionMessage("error", "서버 연결 중 오류가 발생했습니다.")
      }
    }
  }, [selectedPayer, deletePayer, setActionMessage, setDialog])

  // 납부자 정보 수정 저장
  const saveEdit = useCallback(async () => {
    if (selectedPayer) {
      try {
        const paymentData = {
          name: editForm.id,
          amount: Number(editForm.amount),
          date: editForm.date || new Date().toISOString().split("T")[0],
          status: editForm.status === "PAID" ? "PAID" : "REFUNDED",
          type: editForm.type === "계좌이체" ? "BANK_TRANSFER" : "ON_SITE",
        }

        await put(API_PATHS.PAYMENT + "/" + selectedPayer.id, paymentData)

        const updatedPayer = {
          name: editForm.id,
          amount: Number(editForm.amount),
          status: (editForm.status === "PAID" ? "PAID" : "REFUNDED") as "PAID" | "REFUNDED",
          type: (editForm.type === "계좌이체" ? "BANK_TRANSFER" : "ON_SITE") as "BANK_TRANSFER" | "ON_SITE",
          date: editForm.date,
        }

        updatePayer(selectedPayer.id, updatedPayer)
        setActionMessage("success", "납부자 정보가 성공적으로 수정되었습니다.")

        setDialog("edit", false)
        if (selectedPayer.id !== undefined) {
          addRecentlyUpdated(String(selectedPayer.id))
        }

        setTimeout(() => {
          if (selectedPayer.id !== undefined) {
            removeRecentlyUpdated(String(selectedPayer.id))
          }
        }, 3000)
      } catch (error) {
        console.error("Error updating payment:", error)
        setActionMessage("error", "서버 연결 중 오류가 발생했습니다.")
      }
    }
  }, [selectedPayer, editForm, updatePayer, setActionMessage, setDialog, addRecentlyUpdated, removeRecentlyUpdated])

  // 날짜 최신순으로 정렬하는 함수
  const sortPayersByDate = useCallback((payersToSort: Payer[]) => {
    return [...payersToSort].sort((a, b) => {
      // 둘 다 날짜가 있는 경우 비교
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      // a만 날짜가 없는 경우
      if (!a.date && b.date) {
        return 1
      }
      // b만 날짜가 없는 경우
      if (a.date && !b.date) {
        return -1
      }
      // 둘 다 날짜가 없는 경우 순서 유지
      return 0
    })
  }, [])

  // 신규 납부자 추가
  const addNewPayer = useCallback(async () => {
    const errors = {
      id: !newPayerForm.id,
      amount: !newPayerForm.amount,
      date: !newPayerForm.date,
      type: !newPayerForm.type,
    }

    setFormErrors(errors)

    if (errors.id || errors.amount || errors.date || errors.type) {
      return
    }

    try {
      const apitype = newPayerForm.type === "계좌이체" ? "BANK_TRANSFER" : "ON_SITE"

      const paymentData = {
        name: newPayerForm.id,
        amount: Number(newPayerForm.amount),
        date: newPayerForm.date,
        status: "PAID",
        type: apitype,
      }

      const result = await post<Payer>(API_PATHS.PAYMENT, paymentData)

      if (result && result.id) {
        setActionMessage("success", "납부자가 성공적으로 등록되었습니다.")
        setDialog("new", false)

        const newPayer = {
          id: result.id,
          name: newPayerForm.id,
          amount: Number(newPayerForm.amount),
          date: newPayerForm.date,
          status: "PAID" as const,
          type: apitype as "BANK_TRANSFER" | "ON_SITE",
        }

        // 새 납부자를 추가하고 날짜 최신순으로 정렬
        const updatedPayers = sortPayersByDate([...payers, newPayer])

        // 정렬된 배열로 상태 업데이트
        dispatch({ type: "SET_PAYERS", payload: updatedPayers })

        // 필터링된 목록도 업데이트
        const filteredUpdatedPayers = applyFilters(updatedPayers)
        dispatch({ type: "SET_FILTERED_PAYERS", payload: filteredUpdatedPayers })

        if (newPayer.id !== undefined) {
          addRecentlyUpdated(String(newPayer.id))
        }

        setTimeout(() => {
          removeRecentlyUpdated(String(newPayer.id))
        }, 3000)

        resetNewPayerForm()
      } else {
        setActionMessage("error", "API 요청 중 오류가 발생했습니다.")
      }
    } catch (error) {
      console.error("예상치 못한 오류:", error)
      setActionMessage("error", "예상치 못한 오류가 발생했습니다.")
    }
  }, [
    newPayerForm,
    setFormErrors,
    setActionMessage,
    setDialog,
    payers,
    applyFilters,
    addRecentlyUpdated,
    removeRecentlyUpdated,
    resetNewPayerForm,
    sortPayersByDate,
  ])

  const addBulkRow = useCallback(() => {
    dispatch({ type: "ADD_BULK_ROW" })
    // 다음 렌더링 사이클에서 refs 배열 크기 조정
    setTimeout(() => {
      const currentLength = bulkInputRefs.current.length
      if (currentLength < bulkRegistration.rows.length + 1) {
        bulkInputRefs.current.push([])
      }
    }, 0)
  }, [bulkRegistration.rows.length])

  // 일괄 등록 입력 필드 키보드 이벤트 처리
  const handleBulkInputKeyDown = useCallback(
    (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
      // 화살표 키 처리
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          if (rowIndex > 0) {
            // 위쪽 행의 같은 열로 이동
            bulkInputRefs.current[rowIndex - 1]?.[colIndex]?.focus()
          }
          break
        case "ArrowDown":
          e.preventDefault()
          if (rowIndex < bulkRegistration.rows.length - 1) {
            // 아래쪽 행의 같은 열로 이동
            bulkInputRefs.current[rowIndex + 1]?.[colIndex]?.focus()
          }
          break
        case "ArrowLeft":
          // 왼쪽 열로 이동 (입력 필드 내에서 커서가 맨 앞에 있을 때만)
          if (colIndex > 0 && (e.target as HTMLInputElement).selectionStart === 0) {
            e.preventDefault()
            bulkInputRefs.current[rowIndex]?.[colIndex - 1]?.focus()
          }
          break
        case "ArrowRight":
          // 오른쪽 열로 이동 (입력 필드 내에서 커서가 맨 뒤에 있을 때만)
          const target = e.target as HTMLInputElement
          if (colIndex < 4 && target.selectionStart === target.value.length) {
            e.preventDefault()
            bulkInputRefs.current[rowIndex]?.[colIndex + 1]?.focus()
          }
          break
        case "Enter":
          // Enter 키를 누르면 다음 행의 같은 열로 이동
          e.preventDefault()
          if (rowIndex < bulkRegistration.rows.length - 1) {
            bulkInputRefs.current[rowIndex + 1]?.[colIndex]?.focus()
          } else {
            // 마지막 행이면 새 행 추가
            addBulkRow()
            // 새 행이 추가된 후 다음 프레임에서 포커스 이동
            setTimeout(() => {
              bulkInputRefs.current[rowIndex + 1]?.[colIndex]?.focus()
            }, 0)
          }
          break
      }
    },
    [bulkRegistration.rows.length, addBulkRow],
  )

  // Add function to toggle business participation
  const toggleBusinessParticipation = useCallback(
    async (payerId: number | undefined, businessId: number | undefined, isParticipating: boolean) => {
      // 함수 시작 부분에 가드 추가
      if (payerId === undefined || businessId === undefined) {
        console.error("PayerId or BusinessId is undefined")
        return
      }
      setIsUpdatingBusiness({ payerId, businessId })

      try {
        if (isParticipating) {
          // Remove participation
          const response = await del(`${API_PATHS.PAYMENT}/${payerId}/business`, businessId)

          // 204 응답이면 성공으로 처리하고 로컬 상태만 업데이트
          if (response) {
            // 로컬 상태 업데이트 - 해당 납부자의 businessParticipations에서 제거
            const updatedPayers = payers.map((payer) => {
              if (payer.id !== undefined && payer.id === payerId && payer.businessParticipations) {
                return {
                  ...payer,
                  businessParticipations: payer.businessParticipations.filter((bp) => bp.businessId !== businessId),
                }
              }
              return payer
            })

            // 상태 업데이트
            dispatch({ type: "SET_PAYERS", payload: updatedPayers })
            setActionMessage("success", "사업 참여가 취소되었습니다.")
          }
        } else {
          // Add participation
          const response = await post(`${API_PATHS.PAYMENT}/${payerId}/business`, businessId)

          // 204 응답이면 성공으로 처리하고 로컬 상태만 업데이트
          if (response) {
            // 로컬 상태 업데이트 - 해당 납부자의 businessParticipations에 추가
            const updatedPayers = payers.map((payer) => {
              if (payer.id === payerId) {
                const newParticipation: BusinessParticipation = {
                  id: 0,
                  businessId,
                }
                return {
                  ...payer,
                  businessParticipations: payer.businessParticipations
                    ? [...payer.businessParticipations, newParticipation]
                    : [newParticipation],
                } as Payer
              }
              return payer
            })

            // 상태 업데이트
            dispatch({ type: "SET_PAYERS", payload: updatedPayers })
            setActionMessage("success", "사업에 참여되었습니다.")
          }
        }
      } catch (error) {
        console.error("Error updating business participation:", error)
        setActionMessage("error", "사업 참여 상태 변경 중 오류가 발생했습니다.")
      } finally {
        setIsUpdatingBusiness(null)
      }
    },
    [payers, setActionMessage],
  )

  // 사업 참여 여부 확인 함수를 useCallback으로 최적화
  const isParticipatingInBusiness = useCallback((payer: Payer, businessId: number) => {
    if (!payer.businessParticipations) return false
    return payer.businessParticipations.some((bp: any) => bp.businessId === businessId)
  }, [])

  // 모바일 폼 저장 처리
  const handleMobileFormSave = useCallback(
    async (formData: any) => {
      if (mobileForm.mode === "new") {
        try {
          const apitype = formData.type === "계좌이체" ? "BANK_TRANSFER" : "ON_SITE"

          const paymentData = {
            name: formData.id,
            amount: Number(formData.amount),
            date: formData.date,
            status: "PAID",
            type: apitype,
          }

          const result = await post<Payer>(API_PATHS.PAYMENT, paymentData)

          if (result && result.id) {
            const newPayer = {
              id: result.id,
              name: formData.id,
              amount: Number(formData.amount),
              date: formData.date,
              status: "PAID" as const,
              type: apitype as "BANK_TRANSFER" | "ON_SITE",
            }

            resetNewPayerForm()

            // 새 납부자를 추가하고 날짜 최신순으로 정렬
            const updatedPayers = sortPayersByDate([...payers, newPayer])

            // 정렬된 배열로 상태 업데이트
            dispatch({ type: "SET_PAYERS", payload: updatedPayers })

            // 필링된 목록도 업데이트
            const filteredUpdatedPayers = applyFilters(updatedPayers)
            dispatch({ type: "SET_FILTERED_PAYERS", payload: filteredUpdatedPayers })

            addRecentlyUpdated(String(newPayer.id))

            setTimeout(() => {
              removeRecentlyUpdated(String(newPayer.id))
            }, 3000)

            setMobileForm(false)
            setActionMessage("success", "납부자가 성공적으로 등록되었습니다.")

            return { success: true, message: "납부자가 성공적으로 등록되었습니다." }
          } else {
            return { success: false, message: "API 요청 중 오류가 발생했습니다." }
          }
        } catch (error) {
          console.error("예상치 못한 오류:", error)
          return { success: false, message: "예상치 못한 오류가 발생했습니다." }
        }
      } else {
        // 수정 모드
        if (selectedPayer) {
          try {
            const paymentData = {
              name: formData.id,
              amount: Number(formData.amount),
              date: formData.date,
              status: formData.status === "PAID" ? "PAID" : "REFUNDED",
              type: formData.type === "계좌이체" ? "BANK_TRANSFER" : "ON_SITE",
            }

            const result = await put(API_PATHS.PAYMENT + "/" + selectedPayer.id, paymentData)

            if (result) {
              const updatedPayer = {
                name: formData.id,
                amount: Number(formData.amount),
                status: (formData.status === "PAID" ? "PAID" : "REFUNDED") as "PAID" | "REFUNDED",
                type: (formData.type === "계좌이체" ? "BANK_TRANSFER" : "ON_SITE") as "BANK_TRANSFER" | "ON_SITE",
                date: formData.date,
              }

              updatePayer(selectedPayer.id, updatedPayer)
              addRecentlyUpdated(String(selectedPayer.id))

              setTimeout(() => {
                removeRecentlyUpdated(String(selectedPayer.id))
              }, 3000)

              setMobileForm(false)
              setActionMessage("success", "납부자 정보가 성공적으로 수정되었습니다.")

              return { success: true, message: "납부자 정보가 성공적으로 수정되었습니다." }
            } else {
              return { success: false, message: "서버 연결 중 오류가 발생했습니다." }
            }
          } catch (error) {
            console.error("Error updating payment:", error)
            return { success: false, message: "서버 연결 중 오류가 발생했습니다." }
          }
        }
        return { success: false, message: "선택된 납부자가 없습니다." }
      }
    },
    [
      mobileForm.mode,
      selectedPayer,
      resetNewPayerForm,
      payers,
      applyFilters,
      addRecentlyUpdated,
      removeRecentlyUpdated,
      setMobileForm,
      setActionMessage,
      updatePayer,
      sortPayersByDate,
    ],
  )

  // 모바일 폼에서 납부자 삭제
  const handleMobileFormDelete = useCallback(async () => {
    if (selectedPayer) {
      try {
        // 환경에 상관없이 동일한 방식으로 삭제 요청
        await del(API_PATHS.PAYMENT_BY_ID(selectedPayer.id))

        // 성공 시 로컬 상태 업데이트
        deletePayer(selectedPayer.id)
        setMobileForm(false)
        setActionMessage("success", "납부자가 성공적으로 삭제되었습니다.")

        return { success: true, message: "납부자가 성공적으로 삭제되었습니다." }
      } catch (error) {
        console.error("Error deleting payment:", error)
        setMobileForm(false)
        setActionMessage("error", "서버 연결 중 오류가 발생했습니다.")

        return { success: false, message: "서버 연결 중 오류가 발생했습니다." }
      }
    }
    return { success: false, message: "선택된 납부자가 없습니다." }
  }, [selectedPayer, deletePayer, setMobileForm, setActionMessage])

  // 상태에 따른 표시 형식 반환
  useCallback((status: "PAID" | "REFUNDED") => {
    switch (status) {
      case "PAID":
        return (
          <div className="flex justify-center">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Check className="h-3 w-3" />
            </span>
          </div>
        )
      case "REFUNDED":
        return (
          <div className="flex justify-center">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <RefreshCw className="h-3 w-3" />
            </span>
          </div>
        )
      default:
        return null
    }
  }, [])

  // 필터 초기화 함수 오버라이드
  const handleResetFilters = useCallback(() => {
    // 기존 필터 초기화
    resetFilters()

    // 사업 표시 상태 초기화 - 모든 사업 표시
    setShowAllBusinesses(true)
    const resetVisibility: Record<number, boolean> = {}
    businesses.forEach((business) => {
      if (business.id !== undefined) {
        resetVisibility[business.id] = true
      }
    })
    setVisibleBusinesses(resetVisibility)
  }, [resetFilters, businesses])

  const toggleAllBusinesses = useCallback(
    (checked: boolean) => {
      setShowAllBusinesses(checked)
      const newVisibility: Record<number, boolean> = {}
      businesses.forEach((business) => {
        if (business.id !== undefined) {
          newVisibility[business.id] = checked
        }
      })
      setVisibleBusinesses(newVisibility)
    },
    [businesses],
  )

  const toggleBusinessVisibility = useCallback((businessId: number) => {
    setVisibleBusinesses((prevVisibility) => ({
      ...prevVisibility,
      [businessId]: !prevVisibility[businessId],
    }))
  }, [])

  const visibleBusinessList = useMemo(() => {
    return businesses.filter((business) => business.id !== undefined && visibleBusinesses[business.id])
  }, [businesses, visibleBusinesses])

  const refreshDashboardData = useCallback(async () => {
    dispatch({ type: "SET_REFRESHING", payload: true })

    try {
      const [payersData] = await Promise.all([fetchPayers(), fetchDefaultAmount(), fetchBusinesses()])

      dispatch({ type: "SET_FILTERED_PAYERS", payload: payersData })
      setActionMessage("success", "납부자 목록이 새로고침되었습니다.")
    } catch (error) {
      console.error("Error refreshing data:", error)
      setActionMessage(
        "error",
        `데이터 새로고침 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      )
    } finally {
      dispatch({ type: "SET_REFRESHING", payload: false })
    }
  }, [fetchPayers, fetchDefaultAmount, fetchBusinesses, setActionMessage])

  // 일괄 등록 입력 필드 참조를 위한 ref 배열
  const bulkInputRefs = useRef<Array<Array<HTMLInputElement | HTMLButtonElement | null>>>([])

  const removeBulkRow = useCallback((index: number) => {
    dispatch({ type: "REMOVE_BULK_ROW", payload: index })
  }, [])

  const updateBulkRow = useCallback((index: number, field: string, value: string) => {
    dispatch({ type: "UPDATE_BULK_ROW", payload: { index, field, value } })
  }, [])

  const setBulkRowError = useCallback((index: number, field: string, value: boolean) => {
    dispatch({ type: "SET_BULK_ROW_ERROR", payload: { index, field, value } })
  }, [])

  const saveBulkRegistration = useCallback(async () => {
    // 유효성 검사
    let hasErrors = false
    bulkRegistration.rows.forEach((row, index) => {
      const errors = {
        name: !row.name.trim(),
        amount: !row.amount || Number(row.amount) <= 0,
        date: !row.date,
      }

      Object.entries(errors).forEach(([field, hasError]) => {
        if (hasError) {
          setBulkRowError(index, field, true)
          hasErrors = true
        }
      })
    })

    if (hasErrors) {
      setActionMessage("error", "모든 필드를 올바르게 입력해주세요.")
      return
    }

    try {
      const promises = bulkRegistration.rows.map(async (row) => {
        const apitype = row.type === "계좌이체" ? "BANK_TRANSFER" : "ON_SITE"

        const paymentData = {
          name: row.name,
          amount: Number(row.amount),
          date: row.date,
          status: "PAID",
          type: apitype,
        }

        return await post<Payer>(API_PATHS.PAYMENT, paymentData)
      })

      const results = await Promise.all(promises)

      // 성공한 결과들을 상태에 추가
      const newPayers = results.map((result, index) => ({
        id: result.id,
        name: bulkRegistration.rows[index].name,
        amount: Number(bulkRegistration.rows[index].amount),
        date: bulkRegistration.rows[index].date,
        status: "PAID" as const,
        type: (bulkRegistration.rows[index].type === "계좌이체" ? "BANK_TRANSFER" : "ON_SITE") as
          | "BANK_TRANSFER"
          | "ON_SITE",
      }))

      // 새 납부자들을 추가하고 날짜 최신순으로 정렬
      const updatedPayers = sortPayersByDate([...payers, ...newPayers])
      dispatch({ type: "SET_PAYERS", payload: updatedPayers })

      // 필터링된 목록도 업데이트
      const filteredUpdatedPayers = applyFilters(updatedPayers)
      dispatch({ type: "SET_FILTERED_PAYERS", payload: filteredUpdatedPayers })

      // 성공 메시지 및 다이얼로그 닫기
      setActionMessage("success", `${results.length}명의 납부자가 성공적으로 등록되었습니다.`)
      dispatch({ type: "RESET_BULK_REGISTRATION" })
      dispatch({ type: "SET_BULK_REGISTRATION", payload: { show: false } })

      // 애니메이션 효과
      newPayers.forEach((payer) => {
        addRecentlyUpdated(String(payer.id))
        setTimeout(() => {
          removeRecentlyUpdated(String(payer.id))
        }, 3000)
      })
    } catch (error) {
      console.error("일괄 등록 중 오류:", error)
      setActionMessage("error", "일괄 등록 중 오류가 발생했습니다.")
    }
  }, [
    bulkRegistration.rows,
    setBulkRowError,
    setActionMessage,
    payers,
    sortPayersByDate,
    applyFilters,
    addRecentlyUpdated,
    removeRecentlyUpdated,
  ])

  // ===== 렌더링 =====
  return (
    <div className="max-w-3xl mx-auto">
      {/* 알림 메시지 */}
      {actionMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md transition-opacity duration-300 overflow-hidden ${
            actionMessage.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{actionMessage.message}</span>
            <button
              onClick={() => dispatch({ type: "SET_ACTION_MESSAGE", payload: null })}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 mt-2">
            <div
              className={`h-full ${
                actionMessage.type === "success"
                  ? "bg-green-500 animate-shrink-left-success"
                  : "bg-red-500 animate-shrink-left-error"
              }`}
            ></div>
          </div>
        </div>
      )}

      {/* 헤더 영역 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold md:block hidden">납부자 관리</h1>
      </div>

      {/* 검색 및 필터 영 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="학번 검색"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setFilter("searchTerm", e.target.value.trim())}
              />
            </div>
            <Button
              onClick={() => (isMobile ? setMobileForm(true, "new") : openNewForm())}
              variant="outline"
              className="gap-2 w-12 h-10 md:w-auto md:h-auto"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">등록</span>
            </Button>
            <Popover open={isFilterOpen} onOpenChange={(open) => setFilter("isFilterOpen", open)}>
              <PopoverTrigger asChild>
                <Button
                  variant={isFilterActive() ? "default" : "outline"}
                  className="gap-2 relative w-12 h-10 md:w-auto md:h-auto"
                  onClick={() => setFilter("isFilterOpen", !isFilterOpen)}
                >
                  <Filter className={`h-4 w-4 ${isFilterActive() ? "text-primary-foreground" : ""}`} />
                  <span className="hidden md:inline">필터</span>
                  {isFilterActive() && (
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 max-h-[80vh] overflow-auto z-[100]">
                <div className="space-y-4">
                  <h4 className="font-medium">필터 옵션</h4>

                  <div className="space-y-2">
                    <Label>상태</Label>
                    <Select
                      value={statusFilter === null ? "all" : statusFilter}
                      onValueChange={(value) => setFilter("statusFilter", value === "all" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                      <SelectContent className="z-[150]">
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="PAID">납부 완료</SelectItem>
                        <SelectItem value="REFUNDED">환불 완료</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>유형</Label>
                    <Select
                      value={typeFilter === null ? "all" : typeFilter}
                      onValueChange={(value) => setFilter("typeFilter", value === "all" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="유형 선택" />
                      </SelectTrigger>
                      <SelectContent className="z-[150]">
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="BANK_TRANSFER">계좌이체</SelectItem>
                        <SelectItem value="ON_SITE">현장납부</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>날짜</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="start-date" className="text-xs">
                          시작일
                        </Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={startDateFilter}
                          onChange={(e) => setFilter("startDateFilter", e.target.value)}
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
                          onChange={(e) => setFilter("endDateFilter", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 사업 표시 여부 필터 추가 */}
                  <div className="space-y-2 border-t pt-2">
                    <div className="flex items-center justify-between">
                      <Label>사업 표시 여부</Label>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="show-all-businesses" className="text-xs">
                          {Object.values(visibleBusinesses).every((v) => v) ? "모두 표시" : "선택 표시"}
                        </Label>
                        <Switch
                          id="show-all-businesses"
                          checked={showAllBusinesses}
                          onCheckedChange={toggleAllBusinesses}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {businesses.map(
                        (business) =>
                          business.id !== undefined && (
                            <div key={business.id} className="flex items-center justify-between">
                              <Label htmlFor={`business-${business.id}`} className="text-sm cursor-pointer">
                                {business.name}
                              </Label>
                              <Switch
                                id={`business-${business.id}`}
                                checked={visibleBusinesses[business.id] || false}
                                onCheckedChange={() => toggleBusinessVisibility(business.id!)}
                                disabled={!showAllBusinesses}
                              />
                            </div>
                          ),
                      )}
                      {businesses.length === 0 && <div className="text-center text-gray-500 py-2">사업이 없습니다</div>}
                    </div>
                  </div>

                  <div className="flex justify-end sticky bottom-0 pt-2 bg-popover">
                    <Button variant="outline" size="sm" onClick={handleResetFilters}>
                      필터 초기화
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              onClick={refreshDashboardData}
              disabled={isLoading || isRefreshing}
              className="w-12 h-10 md:w-auto md:h-auto"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""} ${isMobile ? "" : "mr-2"}`} />
              <span className="hidden md:inline">{isRefreshing ? "새로고침 중..." : "새로고침"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 납부자 목록 테이블 */}
      <Card>
        <CardContent className="p-0 sm:p-2">
          <div className="relative">
            <div
              ref={tableContainerRef}
              className="overflow-auto h-[calc(100vh-290px)] min-h-[410px] w-full rounded-lg"
            >
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                      날짜
                    </th>
                    <th className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                      학번
                    </th>
                    <th className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                      상태
                    </th>
                    <th className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                      유형
                    </th>
                    <th className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                      금액
                    </th>
                    {/* Add business columns - 필터링된 사업만 표시 */}
                    {visibleBusinessList.map((business) => (
                      <th
                        key={`business-header-${business.id}`}
                        className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs md:text-sm whitespace-nowrap"
                      >
                        {business.name}
                      </th>
                    ))}
                    <th className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && !isRefreshing ? (
                    <tr>
                      <td colSpan={6 + visibleBusinessList.length} className="text-center py-12">
                        <div className="flex justify-center items-center h-64">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPayers.length === 0 ? (
                    <tr>
                      <td colSpan={6 + visibleBusinessList.length} className="text-center py-4 text-gray-500">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredPayers.map((payer, index) => (
                      <PayerRow
                        key={`payer-${payer.id}-${index}`}
                        payer={payer}
                        index={index}
                        isRecentlyUpdated={recentlyUpdated.includes(String(payer.id))}
                        visibleBusinesses={visibleBusinessList}
                        isUpdatingBusiness={isUpdatingBusiness}
                        onEdit={handleEdit}
                        toggleBusinessParticipation={toggleBusinessParticipation}
                        isParticipatingInBusiness={isParticipatingInBusiness}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 페이지네이션 제거 */}
          <div className={`text-sm text-gray-500 text-center mt-2 pb-4`}>
            총{" "}
            {isFilterActive() || debouncedSearchTerm ? (
              <>
                <span className="font-medium text-gray-700">
                  {filteredActivePayers}({totalActivePayers})
                </span>
              </>
            ) : (
              <span className="font-medium text-gray-700">{totalActivePayers}</span>
            )}
            명의 납부자가 있습니다.
            {isNarrowScreen && <br />}
            {!isNarrowScreen && " "}
            (총 <span className="font-medium text-gray-700">{totalAmount.toLocaleString()}</span>원 | 환불자 제외)
          </div>
        </CardContent>
      </Card>

      {/* 납부자 수정 다이얼로그 */}
      <Dialog open={dialogState.edit} onOpenChange={(open) => setDialog("edit", open)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>납부자 정보 수정</DialogTitle>
            <DialogDescription>{selectedPayer?.name}님의 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="id" className="text-right">
                학번
              </Label>
              <Input
                id="id"
                value={editForm.id}
                onChange={(e) => setEditForm({ id: e.target.value })}
                className="col-span-3"
                autoFocus={false}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                금액
              </Label>
              <Input
                id="amount"
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm({ amount: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment-date" className="text-right">
                날짜
              </Label>
              <Input
                id="payment-date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ date: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">유형</Label>
              <div className="flex items-center col-span-3 gap-2">
                <Button
                  type="button"
                  variant={editForm.type === "계좌이체" ? "default" : "outline"}
                  onClick={() => setEditForm({ type: "계좌이체" })}
                >
                  계좌이체
                </Button>
                <Button
                  type="button"
                  variant={editForm.type === "현장납부" ? "default" : "outline"}
                  onClick={() => setEditForm({ type: "현장납부" })}
                >
                  현장납부
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">상태</Label>
              <div className="flex items-center col-span-3 gap-2">
                <Button
                  type="button"
                  variant={editForm.status === "PAID" ? "default" : "outline"}
                  onClick={() => setEditForm({ status: "PAID" })}
                >
                  <Check className="h-4 w-4 mr-2" />
                  납부 완료
                </Button>
                <Button
                  type="button"
                  variant={editForm.status === "REFUNDED" ? "default" : "outline"}
                  onClick={() => setEditForm({ status: "REFUNDED" })}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  환불 완료
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-end mt-4">
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
            <DialogFooter className="flex justify-end p-0">
              <Button variant="outline" onClick={() => setDialog("edit", false)} className="mr-2">
                취소
              </Button>
              <Button onClick={saveEdit}>저장</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 납부자 삭제 확인 다이얼로그 */}
      <Dialog open={dialogState.delete} onOpenChange={(open) => setDialog("delete", open)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>납부자 삭제</DialogTitle>
            <DialogDescription>
              정말로 {selectedPayer?.name} 납부자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialog("delete", false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 신규 납부자 등록 다이얼로그 */}
      <Dialog open={dialogState.new} onOpenChange={(open) => setDialog("new", open)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>신규 납부자 등록</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-id" className="text-right">
                학번
              </Label>
              <Input
                id="new-id"
                value={newPayerForm.id}
                onChange={(e) => {
                  setNewPayerForm({ id: e.target.value })
                  if (formErrors.id) setFormErrors({ id: false })
                }}
                className={cn("col-span-3", formErrors.id && "border-red-500 focus-visible:ring-red-500")}
                placeholder="이름으로 입금하였을 경우 입금자명 입력"
                autoComplete="off"
              />
              {formErrors.id && <p className="text-red-500 text-xs col-start-2 col-span-3 mt-1">학번을 입력해주세요</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-amount" className="text-right">
                금액
              </Label>
              <Input
                id="new-amount"
                type="number"
                value={newPayerForm.amount}
                onChange={(e) => {
                  setNewPayerForm({ amount: e.target.value })
                  if (formErrors.amount) setFormErrors({ amount: false })
                }}
                className={cn("col-span-3", formErrors.amount && "border-red-500 focus-visible:ring-red-500")}
              />
              {formErrors.amount && (
                <p className="text-red-500 text-xs col-start-2 col-span-3 mt-1">금액을 입력해주세요</p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-payment-type" className="text-right">
                유형
              </Label>
              <div className="flex items-center col-span-3 gap-2">
                <Button
                  type="button"
                  variant={newPayerForm.type === "계좌이체" ? "default" : "outline"}
                  onClick={() => {
                    setNewPayerForm({ type: "계좌이체" })
                    if (formErrors.type) setFormErrors({ type: false })
                  }}
                >
                  계좌이체
                </Button>
                <Button
                  type="button"
                  variant={newPayerForm.type === "현장납부" ? "default" : "outline"}
                  onClick={() => {
                    setNewPayerForm({ type: "현장납부" })
                    if (formErrors.type) setFormErrors({ type: false })
                  }}
                >
                  현장납부
                </Button>
              </div>
              {formErrors.type && (
                <p className="text-red-500 text-xs col-start-2 col-span-3 mt-1">유형을 선택해주세요</p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-date" className="text-right">
                날짜
              </Label>
              <Input
                id="new-date"
                type="date"
                value={newPayerForm.date}
                onChange={(e) => {
                  setNewPayerForm({ date: e.target.value })
                  if (formErrors.date) setFormErrors({ date: false })
                }}
                className={cn("col-span-3", formErrors.date && "border-red-500 focus-visible:ring-red-500")}
              />
              {formErrors.date && (
                <p className="text-red-500 text-xs col-start-2 col-span-3 mt-1">날짜를 입력해주세요</p>
              )}
            </div>
          </div>
          <DialogFooter className="flex justify-between items-center w-full">
            <div className="flex-1">
              <button
                onClick={() => {
                  setDialog("new", false)
                  dispatch({ type: "SET_BULK_REGISTRATION", payload: { show: true } })
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 hover:underline-offset-4 transition-all duration-200"
              >
                일괄 등록
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialog("new", false)}>
                취소
              </Button>
              <Button onClick={addNewPayer}>등록</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 모바일 폼 */}
      {mobileForm.show && (
        <MobilePayerForm
          mode={mobileForm.mode}
          payerId={selectedPayer?.id}
          payerName={selectedPayer?.name}
          initialData={
            mobileForm.mode === "edit"
              ? {
                  id: editForm.id,
                  amount: editForm.amount,
                  date: editForm.date,
                  type: editForm.type as "계좌이체" | "현장납부",
                  status: editForm.status as "PAID" | "REFUNDED",
                }
              : {
                  id: "",
                  amount: defaultAmount,
                  date: new Date().toISOString().split("T")[0],
                  type: "계좌이체" as "계좌이체" | "현장납부",
                }
          }
          onSave={handleMobileFormSave}
          onDelete={mobileForm.mode === "edit" ? handleMobileFormDelete : undefined}
          onCancel={() => setMobileForm(false)}
        />
      )}

      {/* 일괄 납부자 등록 다이얼로그 */}
      <Dialog
        open={bulkRegistration.show}
        onOpenChange={(open) => dispatch({ type: "SET_BULK_REGISTRATION", payload: { show: open } })}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>일괄 납부자 등록</DialogTitle>
            <DialogDescription>
              여러 명의 납부자를 한 번에 등록할 수 있습니다. 행/열 간 이동 단축키 : TAB/ENTER/방향키
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">총 {bulkRegistration.rows.length}명</span>
                <Button variant="outline" size="sm" onClick={addBulkRow} className="gap-2">
                  <Plus className="h-4 w-4" />행 추가
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          학번/이름
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          금액
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          날짜
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          유형
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          삭제
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bulkRegistration.rows.map((row, rowIndex) => (
                        <tr key={row.id}>
                          <td className="px-3 py-2">
                            <Input
                              value={row.name}
                              onChange={(e) => {
                                updateBulkRow(rowIndex, "name", e.target.value)
                                if (row.errors.name) setBulkRowError(rowIndex, "name", false)
                              }}
                              className={cn(
                                "h-8 text-sm",
                                row.errors.name && "border-red-500 focus-visible:ring-red-500",
                              )}
                              placeholder="학번 또는 이름"
                              ref={(el) => {
                                if (!bulkInputRefs.current[rowIndex]) {
                                  bulkInputRefs.current[rowIndex] = []
                                }
                                bulkInputRefs.current[rowIndex][0] = el
                              }}
                              onKeyDown={(e) => handleBulkInputKeyDown(e, rowIndex, 0)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={newPayerForm.amount}
                              onChange={(e) => {
                                updateBulkRow(rowIndex, "amount", e.target.value)
                                if (row.errors.amount) setBulkRowError(rowIndex, "amount", false)
                              }}
                              className={cn(
                                "h-8 text-sm",
                                row.errors.amount && "border-red-500 focus-visible:ring-red-500",
                              )}
                              ref={(el) => {
                                if (!bulkInputRefs.current[rowIndex]) {
                                  bulkInputRefs.current[rowIndex] = []
                                }
                                bulkInputRefs.current[rowIndex][1] = el
                              }}
                              onKeyDown={(e) => handleBulkInputKeyDown(e, rowIndex, 1)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="date"
                              value={row.date}
                              onChange={(e) => {
                                updateBulkRow(rowIndex, "date", e.target.value)
                                if (row.errors.date) setBulkRowError(rowIndex, "date", false)
                              }}
                              className={cn(
                                "h-8 text-sm",
                                row.errors.date && "border-red-500 focus-visible:ring-red-500",
                              )}
                              ref={(el) => {
                                if (!bulkInputRefs.current[rowIndex]) {
                                  bulkInputRefs.current[rowIndex] = []
                                }
                                bulkInputRefs.current[rowIndex][2] = el
                              }}
                              onKeyDown={(e) => handleBulkInputKeyDown(e, rowIndex, 2)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Select value={row.type} onValueChange={(value) => updateBulkRow(rowIndex, "type", value)}>
                              <SelectTrigger
                                className="h-8 text-sm"
                                ref={(el) => {
                                  if (!bulkInputRefs.current[rowIndex]) {
                                    bulkInputRefs.current[rowIndex] = []
                                  }
                                  bulkInputRefs.current[rowIndex][3] = el
                                }}
                                onKeyDown={(e) => handleBulkInputKeyDown(e, rowIndex, 3)}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="계좌이체">계좌이체</SelectItem>
                                <SelectItem value="현장납부">현장납부</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBulkRow(rowIndex)}
                              disabled={bulkRegistration.rows.length === 1}
                              className="h-8 w-8 p-0"
                              ref={(el) => {
                                if (!bulkInputRefs.current[rowIndex]) {
                                  bulkInputRefs.current[rowIndex] = []
                                }
                                bulkInputRefs.current[rowIndex][4] = el
                              }}
                              onKeyDown={(e) => handleBulkInputKeyDown(e, rowIndex, 4)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                dispatch({ type: "RESET_BULK_REGISTRATION" })
                dispatch({ type: "SET_BULK_REGISTRATION", payload: { show: false } })
                bulkInputRefs.current = [] // refs 초기화 추가
              }}
            >
              취소
            </Button>
            <Button onClick={saveBulkRegistration}>{bulkRegistration.rows.length}명 등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PayerManagement
