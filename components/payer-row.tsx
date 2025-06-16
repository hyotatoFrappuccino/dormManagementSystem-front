"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Check, RefreshCw, X } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Payer, Business } from "@/lib/interfaces"

interface PayerRowProps {
  payer: Payer
  index: number
  isRecentlyUpdated: boolean
  visibleBusinesses: Business[]
  isUpdatingBusiness: { payerId: number; businessId: number } | null
  onEdit: (payer: Payer) => void
  toggleBusinessParticipation: (
    payerId: number | undefined,
    businessId: number | undefined,
    isParticipating: boolean,
  ) => Promise<void>
  isParticipatingInBusiness: (payer: Payer, businessId: number) => boolean
}

const PayerRow = memo(
  ({
    payer,
    index,
    isRecentlyUpdated,
    visibleBusinesses,
    isUpdatingBusiness,
    onEdit,
    toggleBusinessParticipation,
    isParticipatingInBusiness,
  }: PayerRowProps) => {
    // 상태에 따른 표시 형식 반환
    const getStatusDisplay = (status: "PAID" | "REFUNDED" | "UNPAID") => {
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
        case "UNPAID":
          return (
            <div className="flex justify-center">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <X className="h-3 w-3" />
              </span>
            </div>
          )
        default:
          return null
      }
    }

    return (
      <tr
        className={`border-b transition-colors hover:bg-muted/50 ${
          index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
        } ${isRecentlyUpdated ? "update-animation" : ""}`}
      >
        <td className="p-[11px] align-middle text-center text-xs md:text-sm whitespace-nowrap">
          {payer.date ? formatDate(payer.date) : "-"}
        </td>
        <td className="p-[11px] align-middle text-center text-xs md:text-sm font-medium whitespace-nowrap">
          {payer.name}
        </td>
        <td className="p-[11px] align-middle text-center whitespace-nowrap">{getStatusDisplay(payer.status)}</td>
        <td className="p-[11px] align-middle text-center text-xs md:text-sm whitespace-nowrap">
          {payer.type === "BANK_TRANSFER" ? "계좌이체" : "현장납부"}
        </td>
        <td className="p-[11px] align-middle text-center text-xs md:text-sm whitespace-nowrap">
          {payer.amount ? `${Number(payer.amount).toLocaleString()}원` : "-"}
        </td>
        {/* Add business participation cells - 필터링된 사업만 표시 */}
        {visibleBusinesses.map((business) => {
          const isParticipating = isParticipatingInBusiness(payer, business.id)
          const isUpdating =
            isUpdatingBusiness &&
            isUpdatingBusiness.payerId === payer.id &&
            isUpdatingBusiness.businessId === business.id

          return (
            <td
              key={`payer-${payer.id}-business-${business.id}`}
              className="p-[11px] align-middle text-center text-xs md:text-sm whitespace-nowrap"
              onClick={() => toggleBusinessParticipation(payer.id, business.id, isParticipating)}
            >
              <div
                className={`
                  w-6 h-6 mx-auto rounded-md flex items-center justify-center 
                  transition-all duration-200 cursor-pointer
                  ${
                    isParticipating
                      ? "bg-green-100 border border-green-300 hover:bg-green-200"
                      : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                  }
                `}
                title={isParticipating ? "참여 중 (클릭하여 취소)" : "미참여 (클릭하여 참여)"}
              >
                {isUpdating ? (
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin"></span>
                ) : (
                  isParticipating && <Check className="h-4 w-4 text-green-600" />
                )}
              </div>
            </td>
          )
        })}
        <td className="p-[11px] align-middle text-center whitespace-nowrap">
          <div className="flex justify-center space-x-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(payer)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      </tr>
    )
  },
)

PayerRow.displayName = "PayerRow"

export default PayerRow
