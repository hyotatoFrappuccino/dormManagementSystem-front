import {API_PATHS} from "@/lib/api-config"
import {get, post} from "@/lib/api-client";

type DefaultDataMap = {
    [key: string]: any
}

export const PATH_TO_DEFAULT_KEY: Partial<Record<string, keyof DefaultDataMap>> = {
    [API_PATHS.CONFIG_GOOGLE_SHEET_ID]: "configGoogleSheetId",
    [API_PATHS.CONFIG_DEFAULT_AMOUNT]: "configDefaultAmount",
    [API_PATHS.CONFIG_IS_CONFIGURED]: "configIsConfigured",
    [API_PATHS.BUILDING]: "buildings",
    [API_PATHS.BUSINESS]: "business",
    [API_PATHS.ADMINS_ROLES]: "adminsRoles",
    [API_PATHS.ADMINS]: "admin",
    [API_PATHS.ROUNDS_FRIDGE_APPLICATIONS("")]: "roundsFridgeApplications",
    [API_PATHS.ROUNDS]: "rounds",
    [API_PATHS.PAYMENT]: "payers",
    [API_PATHS.DASHBOARD]: "dashboard",
    [API_PATHS.SURVEY]: "survey",
    [API_PATHS.FRIDGE]: "fridge",
}

export const DEFAULT_DATA: DefaultDataMap = {
    buildings: [
        {id: 1, name: "새롬관(여)T", type: "ALL", fridgeSlots: 50, freezerSlots: 30, integratedSlots: 0},
        {id: 2, name: "새롬관(남)T", type: "REFRIGERATOR", fridgeSlots: 100, freezerSlots: 0, integratedSlots: 0},
        {id: 3, name: "이룸관(여)T", type: "FREEZER", fridgeSlots: 0, freezerSlots: 100, integratedSlots: 0},
        {id: 4, name: "이룸관(남)T", type: "COMBINED", fridgeSlots: 0, freezerSlots: 0, integratedSlots: 100},
        {id: 5, name: "예지원T", type: "ALL", fridgeSlots: 40, freezerSlots: 40, integratedSlots: 0},
        {id: 6, name: "난지원T", type: "ALL", fridgeSlots: 30, freezerSlots: 30, integratedSlots: 0},
        {id: 7, name: "국지원T", type: "ALL", fridgeSlots: 35, freezerSlots: 35, integratedSlots: 0},
        {id: 8, name: "퇴계관T", type: "ALL", fridgeSlots: 40, freezerSlots: 40, integratedSlots: 0},
    ],
    rounds: [
        {id: 1, name: "1회차", startDate: "2025-03-04", endDate: "2025-03-17", password: "1234"},
        {id: 2, name: "2회차", startDate: "2025-03-18", endDate: "2025-03-31", password: "5678"},
        {id: 3, name: "3회차", startDate: "2025-04-01", endDate: "2025-04-14", password: "9012"},
        {id: 4, name: "4회차", startDate: "2025-04-15", endDate: "2025-04-28", password: "3456"},
        {id: 5, name: "5회차", startDate: "2025-04-29", endDate: "2025-05-12", password: "7890"},
        {id: 6, name: "6회차", startDate: "2025-05-13", endDate: "2025-05-26", password: "2345"},
        {id: 7, name: "7회차", startDate: "2025-05-27", endDate: "2025-06-09", password: "6789"},
        {id: 8, name: "8회차", startDate: "2025-06-10", endDate: "2025-06-23", password: "0123"},
        {id: 9, name: "여름학기", startDate: "2025-06-24", endDate: "2025-08-31", password: "4567"},
    ],
    roundsFridgeApplications: {
        "1": {REFRIGERATOR: 51, FREEZER: 30, COMBINED: 10},
        "2": {REFRIGERATOR: 99},
        "3": {FREEZER: 35},
        "4": {COMBINED: 40},
        "5": {REFRIGERATOR: 39, FREEZER: 15, COMBINED: 5},
        "6": {REFRIGERATOR: 15, FREEZER: 10, COMBINED: 20},
        "7": {REFRIGERATOR: 20, FREEZER: 15, COMBINED: 10},
        "8": {REFRIGERATOR: 25, FREEZER: 20, COMBINED: 10},
    },
    payers: [
        {id: 1, name: "202112648", amount: 7000, date: "2023-03-05", status: "PAID", type: "BANK_TRANSFER"},
        {id: 2, name: "202257586", amount: 7000, date: "2023-03-06", status: "PAID", type: "ON_SITE"},
        {id: 3, name: "202044924", amount: 7000, date: "2023-03-07", status: "PAID", type: "BANK_TRANSFER"},
        {id: 4, name: "202172242", amount: 7000, date: "2023-03-08", status: "REFUNDED", type: "BANK_TRANSFER"},
        {id: 5, name: "202238823", amount: 7000, date: "2023-03-09", status: "PAID", type: "ON_SITE"},
        {id: 6, name: "202375099", amount: 7000, date: "2023-03-10", status: "PAID", type: "BANK_TRANSFER"},
        {id: 7, name: "202355981", amount: 7000, date: "2023-03-11", status: "PAID", type: "ON_SITE"},
        {id: 8, name: "202329840", amount: 7000, date: "2023-03-12", status: "PAID", type: "BANK_TRANSFER"},
        {id: 9, name: "202315725", amount: 7000, date: "2023-03-13", status: "REFUNDED", type: "BANK_TRANSFER"},
        {id: 10, name: "202131808", amount: 7000, date: "2023-03-14", status: "PAID", type: "ON_SITE"},
        {id: 11, name: "202226788", amount: 7000, date: "2023-03-15", status: "PAID", type: "BANK_TRANSFER"},
        {id: 12, name: "202331981", amount: 7000, date: "2023-03-16", status: "PAID", type: "ON_SITE"},
        {id: 13, name: "202439261", amount: 7000, date: "2023-03-17", status: "PAID", type: "BANK_TRANSFER"},
        {id: 14, name: "202281725", amount: 7000, date: "2023-03-18", status: "REFUNDED", type: "BANK_TRANSFER"},
        {id: 15, name: "202153675", amount: 7000, date: "2023-03-19", status: "PAID", type: "ON_SITE"},
        {id: 16, name: "202191310", amount: 7000, date: "2023-03-20", status: "PAID", type: "BANK_TRANSFER"},
        {id: 17, name: "202394992", amount: 7000, date: "2023-03-21", status: "PAID", type: "ON_SITE"},
        {id: 18, name: "202270581", amount: 7000, date: "2023-03-22", status: "PAID", type: "BANK_TRANSFER"},
        {id: 19, name: "202466171", amount: 7000, date: "2023-03-23", status: "REFUNDED", type: "BANK_TRANSFER"},
        {id: 20, name: "202214182", amount: 7000, date: "2023-03-24", status: "PAID", type: "ON_SITE"},
    ],
    admin: [
        {id: 1, email: "admin1@example.com", name: "관리자1", role: "EXECUTIVE", creationDate: "2024-01-15"},
        {id: 2, email: "admin2@example.com", name: "관리자2", role: "EXECUTIVE", creationDate: "2024-02-20"},
        {id: 3, email: "staff1@example.com", name: "스태프1", role: "DEVELOPER", creationDate: "2024-03-05"},
        {id: 4, email: "user1@example.com", name: "사용자1", role: "PRESIDENT", creationDate: "2024-03-10"},
    ],
    adminsRoles: [
        {key: "EXECUTIVE", title: "임원"},
        {key: "PRESIDENT", title: "회장"},
        {key: "VICE_PRESIDENT", title: "부회장"},
        {key: "DEVELOPER", title: "개발자"},
    ],
    business: [
        {id: 1, name: "물품대여"},
        {id: 2, name: "야식마차(중간)"},
        {id: 3, name: "야식마차(기말)"},
        {id: 4, name: "택배박스"},
    ],
    configGoogleSheetId: "preview",
    configDefaultAmount: "7000",
    configIsConfigured: "true",
    survey: (() => {
        const consents = []
        const buildings = [
            "새롬관(여)T",
            "새롬관(남)T",
            "이룸관(여)T",
            "이룸관(남)T",
            "예지원T",
            "난지원T",
            "국지원T",
            "퇴계관T",
        ]

        for (let i = 1; i <= 100; i++) {
            const id = i
            const studentId = `2023${String(i).padStart(5, "0")}`
            const name = `학생${i}`
            const buildingName = buildings[Math.floor(Math.random() * buildings.length)]
            const roomNumber = `${Math.floor(100 + Math.random() * 900)}`
            const middleNumber = Math.floor(1000 + Math.random() * 9000)
            const lastNumber = Math.floor(1000 + Math.random() * 9000)
            const phoneNumber = `010-${middleNumber}-${lastNumber}`
            const dateTime = new Date(Date.now() - Math.random() * 31536000000).toISOString()

            // 동의 상태 랜덤 생성 (70%는 동의, 20%는 미제출, 10%는 미동의)
            const randomValue = Math.random()
            const agreed = randomValue < 0.7

            consents.push({
                id,
                studentId,
                name,
                phoneNumber,
                buildingName,
                roomNumber,
                dateTime,
                agreed,
            })
        }
        return consents
    })(),
    dashboard: {
        totalPayers: 500,
        buildings: [
            {
                id: 1,
                name: "새롬관(여)",
                type: "ALL",
                fridgeSlots: 50,
                freezerSlots: 30,
                integratedSlots: 20,
                fridgeUsage: 0,
                freezerUsage: 0,
                integratedUsage: 0,
            },
            {
                id: 2,
                name: "새롬관(남)",
                type: "REFRIGERATOR",
                fridgeSlots: 100,
                freezerSlots: 0,
                integratedSlots: 0,
                fridgeUsage: 0,
            },
            {
                id: 3,
                name: "이룸관(여)",
                type: "FREEZER",
                fridgeSlots: 0,
                freezerSlots: 100,
                integratedSlots: 0,
                freezerUsage: 0,
            },
            {
                id: 4,
                name: "이룸관(남)",
                type: "COMBINED",
                fridgeSlots: 0,
                freezerSlots: 0,
                integratedSlots: 100,
                integratedUsage: 0,
            },
            {
                id: 5,
                name: "예지원",
                type: "ALL",
                fridgeSlots: 40,
                freezerSlots: 40,
                integratedSlots: 20,
                fridgeUsage: 0,
                freezerUsage: 0,
                integratedUsage: 0,
            },
            {
                id: 6,
                name: "난지원",
                type: "ALL",
                fridgeSlots: 30,
                freezerSlots: 30,
                integratedSlots: 40,
                fridgeUsage: 0,
                freezerUsage: 0,
                integratedUsage: 0,
            },
            {
                id: 7,
                name: "국지원",
                type: "ALL",
                fridgeSlots: 35,
                freezerSlots: 35,
                integratedSlots: 30,
                fridgeUsage: 0,
                freezerUsage: 0,
                integratedUsage: 0,
            },
            {
                id: 8,
                name: "퇴계관",
                type: "ALL",
                fridgeSlots: 40,
                freezerSlots: 40,
                integratedSlots: 20,
                fridgeUsage: 0,
                freezerUsage: 0,
                integratedUsage: 0,
            },
        ],
    },
    fridge: [
        {
            id: 1,
            studentId: "202087723",
            name: "이서준",
            phone: "010-7481-9954",
            buildingName: "새롬관(남)T",
            roomNumber: "1338",
            warningCount: 0,
            fridgeApplications: [
                {
                    id: 1,
                    roundId: 1,
                    type: "FREEZER",
                },
                {
                    id: 2,
                    roundId: 2,
                    type: "FREEZER",
                },
                {
                    id: 3,
                    roundId: 3,
                    type: "FREEZER",
                },
            ],
        },
        {
            id: 2,
            studentId: "202112648",
            name: "홍길동",
            phone: "010-1234-5678",
            buildingName: "이룸관(여)T",
            roomNumber: "301",
            warningCount: 1,
            fridgeApplications: [
                {
                    id: 4,
                    roundId: 2,
                    type: "REFRIGERATOR",
                },
                {
                    id: 5,
                    roundId: 3,
                    type: "FREEZER",
                },
            ],
        },
        {
            id: 3,
            studentId: "202257586",
            name: "김철수",
            phone: "010-9876-5432",
            buildingName: "예지원T",
            roomNumber: "505",
            warningCount: 2,
            fridgeApplications: [
                {
                    id: 6,
                    roundId: 1,
                    type: "COMBINED",
                },
                {
                    id: 7,
                    roundId: 4,
                    type: "COMBINED",
                },
            ],
        },
        {
            id: 4,
            studentId: "202044924",
            name: "이영희",
            phone: "010-2468-1357",
            buildingName: "난지원T",
            roomNumber: "210",
            warningCount: 3,
            fridgeApplications: [
                {
                    id: 8,
                    roundId: 5,
                    type: "REFRIGERATOR",
                },
            ],
        },
        {
            id: 5,
            studentId: "202172242",
            name: "박민수",
            phone: "010-1357-2468",
            buildingName: "국지원T",
            roomNumber: "412",
            warningCount: 0,
            fridgeApplications: [
                {
                    id: 9,
                    roundId: 6,
                    type: "FREEZER",
                },
                {
                    id: 10,
                    roundId: 7,
                    type: "FREEZER",
                },
                {
                    id: 11,
                    roundId: 8,
                    type: "FREEZER",
                },
            ],
        },
    ],
}

// 모의 데이터 초기화 함수
export async function initMockData() {
    console.log("initMockData()")

    if (await get<string>(API_PATHS.CONFIG_IS_CONFIGURED) === "true") {
        console.log("Mock data already initialized")
        return
    }

    console.log("Initializing mock data...")

    Object.entries(DEFAULT_DATA).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value))
    })

    await post<any>(API_PATHS.CONFIG_IS_CONFIGURED, true)

    console.log("Mock data initialized successfully")
}

// 저장된 모의 데이터 가져오기
export function getStoredMockData(key: string): any {

    const data = localStorage.getItem(key)
    if (!data) return DEFAULT_DATA[key]

    try {
        return JSON.parse(data)
    } catch (e) {
        console.error(`Error parsing stored data for key ${key}:`, e)
        return DEFAULT_DATA[key]
    }
}