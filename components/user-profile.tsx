"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/lib/auth"
import { post } from "@/lib/api-client"
import { isV0Preview } from "@/lib/utils"

export function UserProfile() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)

      // 서버 API 호출
      if (!isV0Preview()) {
        await post("/api/auth/logout", {})
      }

      // 클라이언트 측 로그아웃 처리
      logout()

      // 로그인 페이지로 리다이렉트
      window.location.href = "/login"
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error)

      // 오류가 발생해도 클라이언트 측 로그아웃은 진행
      logout()
      window.location.href = "/login"
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="p-4 border-t mt-auto">
      <Button
        variant="outline"
        size="sm"
        className="w-full flex items-center justify-center gap-2"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        <LogOut className="h-4 w-4" />
        <span>{isLoggingOut ? "로그아웃 중..." : "로그아웃"}</span>
      </Button>
    </div>
  )
}
