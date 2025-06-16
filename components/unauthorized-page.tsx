"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, LogOut } from "lucide-react"

export default function UnauthorizedPage() {
  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    window.location.href = "/login"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-modern-lg border-0">
        <CardContent className="p-8 text-center">
          {/* 아이콘 영역 */}
          <div className="mb-6">
            <div className="relative mx-auto w-24 h-24 mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-r from-orange-100 to-red-100 rounded-full">
                <AlertTriangle className="w-12 h-12 text-orange-500" />
              </div>
            </div>
          </div>

          {/* 메인 메시지 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">앗! 접근 권한이 없어요 😅</h1>
            <p className="text-gray-600 leading-relaxed">
              <span className="font-semibold text-orange-600">등록된 관리자가 아닙니다</span>
            </p>
          </div>

          {/* 추가 설명 */}
          <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <p className="text-sm text-gray-700">
              💡 <strong>도움이 필요하신가요?</strong>
              <br />
              관리자에게 권한 요청을 하거나
              <br />
              다른 계정으로 로그인해보세요
            </p>
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            <Button variant="outline" onClick={handleLogout} className="w-full border-gray-200 hover:bg-gray-50">
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>

          {/* 하단 메시지 */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">문제가 지속되면 시스템 관리자에게 연락해주세요</p>
          </div>
        </CardContent>
      </Card>

      {/* 배경 장식 요소들 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-bounce"
          style={{ animationDelay: "0s", animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-3/4 right-1/4 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-bounce"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-pink-200 rounded-full opacity-20 animate-bounce"
          style={{ animationDelay: "2s", animationDuration: "5s" }}
        ></div>
      </div>
    </div>
  )
}
