"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function OAuthSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // URL 파라미터에서 accessToken 추출
    const accessToken = searchParams.get("accessToken")

    if (accessToken) {
      // localStorage에 토큰 저장
      localStorage.setItem("accessToken", accessToken)

      // 메인 페이지로 리다이렉트
      router.push("/")
    } else {
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      console.error("Access token not found in URL parameters")
      router.push("/login")
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">로그인 처리 중...</h2>
        <p>잠시만 기다려주세요.</p>
      </div>
    </div>
  )
}
