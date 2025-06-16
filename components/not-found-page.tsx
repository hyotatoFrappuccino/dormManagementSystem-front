"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Home } from "lucide-react"

export default function NotFoundPage() {
  const handleGoHome = () => {
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-modern-lg border-0">
        <CardContent className="p-8 text-center">
          {/* 아이콘 영역 */}
          <div className="mb-6">
            <div className="relative mx-auto w-24 h-24 mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                <Search className="w-12 h-12 text-blue-500" />
              </div>
            </div>
          </div>

          {/* 메인 메시지 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없어요 😕</h1>
            <p className="text-gray-600 leading-relaxed">
              <span className="font-semibold text-blue-600">요청하신 페이지가 존재하지 않습니다</span>
            </p>
          </div>

          {/* 추가 설명 */}
          <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <p className="text-sm text-gray-700">
              💡 <strong>무엇이 잘못되었나요?</strong>
              <br />
              URL을 잘못 입력했거나
              <br />
              페이지가 이동 또는 삭제되었을 수 있습니다
            </p>
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            <Button variant="outline" onClick={handleGoHome} className="w-full border-gray-200 hover:bg-gray-50">
              <Home className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
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
