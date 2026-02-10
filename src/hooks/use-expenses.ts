"use client"

import { useMemo } from "react"
import { collection, query, where } from "firebase/firestore"
import { Despesa } from "@/lib/types"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"

export function useExpenses(userId: string | undefined, year: number) {
  const firestore = useFirestore()

  const expensesQuery = useMemoFirebase(() => {
    if (!userId || !firestore) return null
    const expensesRef = collection(firestore, "usuarios", userId, "despesas")
    return query(
      expensesRef,
      where("ano", "==", year),
      where("arquivado", "==", false)
    )
  }, [firestore, userId, year])

  const { data, isLoading: loading } = useCollection<Despesa>(expensesQuery)

  const expenses = useMemo(() => {
    if (!data) return []
    // Ordenação: 1º por dia de vencimento (asc), 2º alfabética.
    return [...data].sort((a, b) => {
      if (a.vencimento < b.vencimento) return -1
      if (a.vencimento > b.vencimento) return 1
      return a.descricao.localeCompare(b.descricao)
    })
  }, [data])

  return { expenses, loading }
}

export function useArchivedExpenses(userId: string | undefined, year: number) {
    const firestore = useFirestore()

    const expensesQuery = useMemoFirebase(() => {
        if (!userId || !firestore) return null;
        const expensesRef = collection(firestore, "usuarios", userId, "despesas");
        return query(
          expensesRef,
          where("ano", "==", year),
          where("arquivado", "==", true)
        );
    }, [firestore, userId, year]);

    const { data, isLoading: loading } = useCollection<Despesa>(expensesQuery);

    return { expenses: data || [], loading };
}
