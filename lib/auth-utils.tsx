import type React from "react"
import type { ReactNode } from "react"
import UnauthorizedPage from "@/components/unauthorized-page"

/**
 * 관리자 권한을 체크하고 권한이 없으면 에러 페이지를 보여주는 HOC
 */
export function withAdminAuth<T extends {}>(
  WrappedComponent: React.ComponentType<T>,
  checkAdminPermission: () => boolean = () => true, // 실제 권한 체크 로직으로 교체
) {
  return function AdminProtectedComponent(props: T) {
    const isAdmin = checkAdminPermission()

    if (!isAdmin) {
      return <UnauthorizedPage />
    }

    return <WrappedComponent {...props} />
  }
}

/**
 * 관리자 권한 체크 컴포넌트
 */
interface AdminGuardProps {
  children: ReactNode
  fallback?: ReactNode
  checkPermission?: () => boolean
}

export function AdminGuard({
  children,
  fallback = <UnauthorizedPage />,
  checkPermission = () => true,
}: AdminGuardProps) {
  const isAdmin = checkPermission()

  if (!isAdmin) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
