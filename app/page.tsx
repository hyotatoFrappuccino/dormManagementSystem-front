"use client"

import {useEffect, useState} from "react"
import {isAuthenticated} from "@/lib/auth"
import {isV0Preview} from "@/lib/utils"
import {initMockData} from "@/lib/mock-data"
import Dashboard from "@/dashboard"

export default function HomePage() {
  const [loading, setLoading] = useState(true)

  const runAll = async () => {
    if (!isAuthenticated()) {
      window.location.href = "/login"
      return
    }

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

  // 항상 Dashboard 렌더링
  return <Dashboard/>
}