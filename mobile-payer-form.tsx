"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft, Check, X, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobilePayerFormProps {
  mode: "new" | "edit"
  payerId?: number
  payerName?: string
  initialData?: {
    id: string
    amount: string
    date: string
    type: "계좌이체" | "현장납부"
    status?: "PAID" | "REFUNDED"
  }
  onSave: (data: any) => Promise<{ success: boolean; message: string }>
  onDelete?: () => Promise<{ success: boolean; message: string }>
  onCancel: () => void
}

export default function MobilePayerForm({
  mode,
  payerId,
  payerName,
  initialData,
  onSave,
  onDelete,
  onCancel,
}: MobilePayerFormProps) {
  // 기본 납부 금액 변수명 변경: defaultPaymentAmount -> default_amount

  const [formData, setFormData] = useState({
    id: initialData?.id || "",
    amount: initialData?.amount || localStorage.getItem("default_amount") || "7000",
    date: initialData?.date || new Date().toISOString().split("T")[0],
    type: initialData?.type || ("계좌이체" as "계좌이체" | "현장납부"),
    status: initialData?.status || ("PAID" as "PAID" | "REFUNDED"),
  })

  const [formErrors, setFormErrors] = useState({
    id: false,
    amount: false,
    date: false,
    type: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateForm = () => {
    const errors = {
      id: !formData.id,
      amount: !formData.amount,
      date: !formData.date,
      type: !formData.type,
    }

    setFormErrors(errors)
    return !Object.values(errors).some(Boolean)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await onSave(formData)

      if (result.success) {
        // 성공 시 즉시 폼 닫기 (메시지 표시 없이)
        onCancel()
      } else {
        // 오류 시 폼에 오류 메시지 표시
        setError(result.message || "오류가 발생했습니다.")
      }
    } catch (error) {
      setError("요청 처리 중 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setError(null)

    if (!confirm("정말로 이 납부자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return
    }

    setIsDeleting(true)

    try {
      const result = await onDelete()

      if (result.success) {
        // 성공 시 즉시 폼 닫기 (메시지 표시 없이)
        onCancel()
      } else {
        // 오류 시 폼에 오류 메시지 표시
        setError(result.message || "삭제 중 오류가 발생했습니다.")
      }
    } catch (error) {
      setError("요청 처리 중 오류가 발생했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto pb-20">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={onCancel} className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium">
            {mode === "new" ? "신규 납부자 등록" : `${payerName || "납부자"} 정보 수정`}
          </h1>
        </div>
      </div>

      {error && (
        <Alert className="mx-4 my-4 bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="id">학번 {formErrors.id && <span className="text-red-500">*</span>}</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => {
                  setFormData({ ...formData, id: e.target.value })
                  if (formErrors.id) setFormErrors({ ...formErrors, id: false })
                }}
                className={cn(formErrors.id && "border-red-500 focus-visible:ring-red-500")}
                placeholder="이름으로 입금하였을 경우 입금자명 입력"
              />
              {formErrors.id && <p className="text-red-500 text-xs">학번을 입력해주세요</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">금액 {formErrors.amount && <span className="text-red-500">*</span>}</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => {
                  setFormData({ ...formData, amount: e.target.value })
                  if (formErrors.amount) setFormErrors({ ...formErrors, amount: false })
                }}
                className={cn(formErrors.amount && "border-red-500 focus-visible:ring-red-500")}
              />
              {formErrors.amount && <p className="text-red-500 text-xs">금액을 입력해주세요</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">날짜 {formErrors.date && <span className="text-red-500">*</span>}</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value })
                  if (formErrors.date) setFormErrors({ ...formErrors, date: false })
                }}
                className={cn(formErrors.date && "border-red-500 focus-visible:ring-red-500")}
              />
              {formErrors.date && <p className="text-red-500 text-xs">날짜를 입력해주세요</p>}
            </div>

            <div className="space-y-2">
              <Label>유형 {formErrors.type && <span className="text-red-500">*</span>}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formData.type === "계좌이체" ? "default" : "outline"}
                  onClick={() => {
                    setFormData({ ...formData, type: "계좌이체" })
                    if (formErrors.type) setFormErrors({ ...formErrors, type: false })
                  }}
                  className="w-full"
                >
                  계좌이체
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "현장납부" ? "default" : "outline"}
                  onClick={() => {
                    setFormData({ ...formData, type: "현장납부" })
                    if (formErrors.type) setFormErrors({ ...formErrors, type: false })
                  }}
                  className="w-full"
                >
                  현장납부
                </Button>
              </div>
              {formErrors.type && <p className="text-red-500 text-xs">유형을 선택해주세요</p>}
            </div>

            {mode === "edit" && (
              <div className="space-y-2">
                <Label>상태</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={formData.status === "PAID" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, status: "PAID" })}
                    className="w-full"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    납부 완료
                  </Button>
                  <Button
                    type="button"
                    variant={formData.status === "REFUNDED" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, status: "REFUNDED" })}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    환불 완료
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex gap-2">
            {mode === "edit" && onDelete && (
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
              >
                {isDeleting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                삭제
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={isSubmitting || isDeleting}>
              {isSubmitting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              {mode === "new" ? "등록" : "저장"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
