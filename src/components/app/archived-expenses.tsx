"use client"

import { useArchivedExpenses } from "@/hooks/use-expenses"
import { useUser, useFirestore } from "@/firebase"
import { useApp } from "@/context/app-context"
import { Button } from "../ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Undo2 } from "lucide-react"
import { useState } from "react"
import { doc, updateDoc } from "firebase/firestore"

export function ArchivedExpenses() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { selectedYear } = useApp()
  const { expenses, loading } = useArchivedExpenses(user?.uid, selectedYear)
  const { toast } = useToast()
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const handleRestore = async (id: string) => {
    if (!user) return
    setRestoringId(id)
    try {
      const docRef = doc(firestore, "usuarios", user.uid, "despesas", id)
      await updateDoc(docRef, { arquivado: false })
      toast({ title: "Despesa restaurada." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message })
    }
    setRestoringId(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Despesas Arquivadas</h2>
        <p className="text-muted-foreground">
          Lista de despesas arquivadas para o ano de {selectedYear}.
        </p>
      </div>
      <div className="rounded-md border">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : expenses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">
                    {expense.descricao}
                  </TableCell>
                  <TableCell>{expense.vencimento}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(expense.id)}
                      disabled={restoringId === expense.id}
                    >
                      {restoringId === expense.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Undo2 className="mr-2 h-4 w-4" />
                      )}
                      Restaurar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma despesa arquivada para este ano.
          </p>
        )}
      </div>
    </div>
  )
}
