"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Check, X } from "lucide-react"
import type { Consent } from "@/lib/interfaces"
import { formatDate } from "@/lib/utils"

// 동의 상태에 따른 아이콘
const getConsentStatusIcon = (status: boolean) => {
  if (status) {
    return (
      <div className="flex justify-center">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Check className="h-3 w-3" />
        </span>
      </div>
    )
  } else {
    return (
      <div className="flex justify-center">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <X className="h-3 w-3" />
        </span>
      </div>
    )
  }
}

interface ConsentRowProps {
  consent: Consent
  index: number
  onDelete: (consent: Consent) => void
  isUpdated?: boolean
}

const ConsentRow = memo(({ consent, index, onDelete, isUpdated = false }: ConsentRowProps) => {
  return (
    <tr
      className={`border-b transition-colors hover:bg-muted/50 ${
        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
      } ${isUpdated ? "update-animation" : ""}`}
    >
      <td className="p-3 align-middle text-center text-xs md:text-sm whitespace-nowrap">
        {formatDate(new Date(consent.dateTime))}
      </td>
      <td className="p-3 align-middle text-center text-xs md:text-sm font-medium whitespace-nowrap">
        {consent.studentId}
      </td>
      <td className="p-3 align-middle text-center text-xs md:text-sm whitespace-nowrap">{consent.name}</td>
      <td className="p-3 align-middle text-center text-xs md:text-sm whitespace-nowrap">{consent.phoneNumber}</td>
      <td className="p-3 align-middle text-center text-xs md:text-sm whitespace-nowrap">{consent.buildingName}</td>
      <td className="p-3 align-middle text-center text-xs md:text-sm whitespace-nowrap">{consent.roomNumber}</td>
      <td className="p-3 align-middle text-center whitespace-nowrap">{getConsentStatusIcon(consent.agreed)}</td>
      <td className="p-3 align-middle text-center whitespace-nowrap">
        <div className="flex justify-center space-x-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(consent)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
})

ConsentRow.displayName = "ConsentRow"

export default ConsentRow
