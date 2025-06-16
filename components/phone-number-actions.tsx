"use client"

import { useState } from "react"
import { Phone, MessageSquare, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-mobile"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PhoneNumberActionsProps {
  phone: string
}

export function PhoneNumberActions({ phone }: PhoneNumberActionsProps) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)

  // Format phone number for href
  const formattedPhone = phone.replace(/-/g, "")

  if (!isMobile) {
    // PC에서는 전화번호만 표시하고 복사 기능 제공
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="cursor-pointer text-blue-600 hover:underline"
              onClick={() => {
                navigator.clipboard
                  .writeText(phone)
                  .then(() => alert(`${phone} 번호가 클립보드에 복사되었습니다.`))
                  .catch((err) => console.error("복사 실패:", err))
              }}
            >
              {phone}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>클릭하여 번호 복사</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="link" className="p-0 h-auto font-normal text-blue-600 underline text-xs">
          {phone} <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-40">
        <DropdownMenuItem asChild>
          <a href={`tel:${formattedPhone}`} className="flex items-center cursor-pointer text-xs">
            <Phone className="mr-2 h-3 w-3" />
            <span>전화 걸기</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`sms:${formattedPhone}`} className="flex items-center cursor-pointer text-xs">
            <MessageSquare className="mr-2 h-3 w-3" />
            <span>문자 보내기</span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
