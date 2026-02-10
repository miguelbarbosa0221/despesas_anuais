"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useApp } from "@/context/app-context"
import { useUser, useFirestore } from "@/firebase"
import { collection, getDocs, query } from "firebase/firestore"
import { useEffect, useState } from "react"

export function YearSelector() {
  const { selectedYear, setSelectedYear } = useApp()
  const { user } = useUser()
  const firestore = useFirestore()
  const [years, setYears] = useState<number[]>([])

  useEffect(() => {
    const fetchYears = async () => {
      if (!user || !firestore) return
      try {
        const q = query(collection(firestore, "usuarios", user.uid, "despesas"))
        const querySnapshot = await getDocs(q)
        const availableYears = new Set<number>()
        querySnapshot.forEach((doc) => {
          availableYears.add(doc.data().ano)
        })

        const sortedYears = Array.from(availableYears).sort((a, b) => b - a)
        const currentYear = new Date().getFullYear()
        if (!sortedYears.includes(currentYear)) {
          sortedYears.unshift(currentYear)
        }
        setYears(sortedYears)
      } catch (error) {
        console.error("Error fetching years:", error)
      }
    }

    fetchYears()
  }, [user, firestore])

  return (
    <Select
      value={selectedYear.toString()}
      onValueChange={(value) => setSelectedYear(parseInt(value))}
    >
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Selecione o ano" />
      </SelectTrigger>
      <SelectContent>
        {years.length > 0 ? (
          years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))
        ) : (
          <SelectItem value={selectedYear.toString()} disabled>
            {selectedYear}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}
