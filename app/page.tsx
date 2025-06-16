"use client"

import { useEffect, useState } from "react"
import { isAuthenticated } from "@/lib/auth"
import Dashboard from "@/dashboard"
import InitialSetup from "@/initial-setup"
import { API_PATHS } from "@/lib/api-config"
import { isV0Preview } from "@/lib/utils"
import { initMockData } from "@/lib/mock-data"
import { get } from "@/lib/api-client"

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(true)

  const runAll = async () => {
    if (!isAuthenticated()) {
      window.location.href = "/login"
      return
    }

    const data = await get<string>(API_PATHS.CONFIG_IS_CONFIGURED)
    setIsConfigured(data === "true")
    if (isV0Preview()) {
      await initMockData()
    }

    setLoading(false)
  }

  useEffect(() => {
    runAll()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // 설정이 완료되지 않았으면 초기 설정 페이지로 이동
  if (!isConfigured) {
    return <InitialSetup />
  }

  // 항상 Dashboard 렌더링
  return <Dashboard />
}
