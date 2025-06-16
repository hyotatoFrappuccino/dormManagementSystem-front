"use client"

import { useState, useEffect } from "react"

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      // 화면 크기 체크
      const isMobileBySize = window.innerWidth < 768

      // 모바일 기기 여부 체크 (User Agent 기반)
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

      // 터치 기능 지원 여부 체크
      const hasTouchSupport = "ontouchstart" in window || navigator.maxTouchPoints > 0

      // 모바일 기기이거나 화면 크기가 작고 터치 지원이 되는 경우 모바일로 판단
      setIsMobile(isMobileDevice || (isMobileBySize && hasTouchSupport))
    }

    // 초기 체크
    checkMobile()

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener("resize", checkMobile)

    // 클린업
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}
