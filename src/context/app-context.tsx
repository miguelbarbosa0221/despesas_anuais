"use client"

import { useLocalStorage } from "@/hooks/use-local-storage"
import { Mes } from "@/lib/types"
import React, { createContext, useContext, useState } from "react"

interface CellModalState {
  isOpen: boolean
  despesaId: string | null
  mes: Mes | null
}

interface AppContextType {
  selectedYear: number
  setSelectedYear: (year: number) => void
  sheetOpen: boolean
  setSheetOpen: (open: boolean) => void
  cellModal: CellModalState
  setCellModal: React.Dispatch<React.SetStateAction<CellModalState>>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [selectedYear, setSelectedYear] = useLocalStorage<number>(
    "anoSelecionado",
    new Date().getFullYear()
  )
  const [sheetOpen, setSheetOpen] = useState(false)
  const [cellModal, setCellModal] = useState<CellModalState>({
    isOpen: false,
    despesaId: null,
    mes: null,
  })

  return (
    <AppContext.Provider
      value={{
        selectedYear,
        setSelectedYear,
        sheetOpen,
        setSheetOpen,
        cellModal,
        setCellModal,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within a AppProvider")
  }
  return context
}
