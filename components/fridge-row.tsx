"use client"

import { memo } from "react"
import { MoreHorizontal, AlertTriangle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PhoneNumberActions } from "@/components/phone-number-actions"
import type { GroupedApplication, Round, FridgeApplication, Member } from "@/lib/interfaces"
import { getApplicationTypeText } from "@/lib/utils"

interface FridgeRowProps {
  item: GroupedApplication
  index: number
  isMobile: boolean
  getWarningBgClass: (warningCount: number) => string
  getDisplayRounds: (item: GroupedApplication) => Round[]
  onOpenDeleteDialog: (member: Member, application: FridgeApplication | null) => void
  onWarningCountChange: (memberId: number | undefined, action: "increase" | "decrease") => void
}

const FridgeRow = memo(
  ({
    item,
    index,
    isMobile,
    getWarningBgClass,
    getDisplayRounds,
    onOpenDeleteDialog,
    onWarningCountChange,
  }: FridgeRowProps) => {
    // 경고 수준에 따른 배경색 클래스 결정
    const warningBgClass = getWarningBgClass(item.member.warningCount)

    return (
      <tr
        className={`border-b transition-colors hover:bg-muted/50 ${
          warningBgClass || (index % 2 === 0 ? "bg-white" : "bg-gray-50/30")
        }`}
      >
        <td className="p-3 align-middle text-center text-xs md:text-sm whitespace-nowrap">{item.member.studentId}</td>
        <td className="p-3 align-middle text-center text-xs md:text-sm whitespace-nowrap">{item.member.name}</td>
        <td className="p-3 align-middle text-center text-xs md:text-sm whitespace-nowrap">
          {item.member.buildingName}
        </td>
        <td className="p-3 align-middle text-center text-xs md:text-sm whitespace-nowrap">{item.member.roomNumber}</td>
        <td className="p-3 align-middle text-center text-xs md:text-sm whitespace-nowrap">
          {isMobile ? <PhoneNumberActions phone={item.member.phone} /> : item.member.phone}
        </td>

        {/* 회차별 신청 상태 */}
        {getDisplayRounds(item).map((round) => {
          const application = round.id !== undefined ? item.applications[round.id] : null
          return (
            <td key={round.id} className="p-3 align-middle text-center text-xs md:text-sm whitespace-nowrap">
              <span style={{ color: getApplicationTypeText(application?.type).color }}>
                {getApplicationTypeText(application?.type).text}
              </span>
            </td>
          )
        })}

        {/* 관리 버튼 */}
        <td className="p-3 align-middle text-center whitespace-nowrap">
          <div className="flex justify-center space-x-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onOpenDeleteDialog(item.member, null)}
                  className="text-red-500 focus:text-red-500"
                  disabled={Object.keys(item.applications).length === 0}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  <span>삭제</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onWarningCountChange(item.member.id, "increase")}
                  disabled={item.member.warningCount >= 3}
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-2" />
                  <span>경고 추가</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onWarningCountChange(item.member.id, "decrease")}
                  disabled={item.member.warningCount <= 0}
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-2" />
                  <span>경고 감소</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </td>
      </tr>
    )
  },
)

FridgeRow.displayName = "FridgeRow"

export default FridgeRow
