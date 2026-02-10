"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Despesa } from "@/lib/types"

export function useExpenses(userId: string | undefined, year: number) {
  const [expenses, setExpenses] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setExpenses([])
      setLoading(false)
      return
    }

    setLoading(true)
    const expensesRef = collection(db, "usuarios", userId, "despesas")
    const q = query(
      expensesRef,
      where("ano", "==", year),
      where("arquivado", "==", false)
    )

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const expensesData: Despesa[] = []
        querySnapshot.forEach((doc) => {
          expensesData.push({ id: doc.id, ...doc.data() } as Despesa)
        })

        // Ordenação: 1º por dia de vencimento (asc), 2º alfabética.
        expensesData.sort((a, b) => {
          if (a.vencimento < b.vencimento) return -1
          if (a.vencimento > b.vencimento) return 1
          return a.descricao.localeCompare(b.descricao)
        })

        setExpenses(expensesData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching expenses: ", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [userId, year])

  return { expenses, loading }
}

export function useArchivedExpenses(userId: string | undefined, year: number) {
  const [expenses, setExpenses] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
        setExpenses([])
        setLoading(false)
        return
    }

    setLoading(true)
    const expensesRef = collection(db, "usuarios", userId, "despesas")
    const q = query(
      expensesRef,
      where("ano", "==", year),
      where("arquivado", "==", true)
    )

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const expensesData: Despesa[] = []
        querySnapshot.forEach((doc) => {
          expensesData.push({ id: doc.id, ...doc.data() } as Despesa)
        })
        setExpenses(expensesData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching archived expenses: ", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [userId, year])

  return { expenses, loading }
}
