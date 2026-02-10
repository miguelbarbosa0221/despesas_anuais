"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useApp } from "@/context/app-context"
import { useExpenses } from "@/hooks/use-expenses"
import { useUser, useFirestore } from "@/firebase"
import { useEffect, useState } from "react"
import { Despesa } from "@/lib/types"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import {
  Archive,
  CircleDollarSign,
  Loader2,
  Trash2,
  Undo2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "../ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog"
import {
  doc,
  updateDoc,
  runTransaction,
  deleteDoc,
} from "firebase/firestore"

export function CellActionsModal() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { cellModal, setCellModal, selectedYear } = useApp()
  const { expenses } = useExpenses(user?.uid, selectedYear)
  const { toast } = useToast()

  const [expense, setExpense] = useState<Despesa | null>(null)
  const [valor, setValor] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (cellModal.isOpen && cellModal.despesaId) {
      const found = expenses.find((e) => e.id === cellModal.despesaId)
      if (found && cellModal.mes) {
        setExpense(found)
        setValor(found.valores[cellModal.mes])
      }
    } else {
      setExpense(null)
    }
  }, [cellModal, expenses])

  const handleClose = () => {
    setCellModal({ isOpen: false, despesaId: null, mes: null })
  }

  const handleUpdateValor = async () => {
    if (!user || !expense || cellModal.mes === null || !firestore) return
    setIsSubmitting(true)
    try {
      const docRef = doc(firestore, "usuarios", user.uid, "despesas", expense.id)
      const updateData: { [key: string]: any } = {}
      updateData[`valores.${cellModal.mes}`] = valor
      await updateDoc(docRef, updateData)
      toast({ title: "Valor atualizado!" })
      handleClose()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message })
    }
    setIsSubmitting(false)
  }

  const handleTogglePagamento = async () => {
    if (!user || !expense || cellModal.mes === null || !firestore) return
    setIsSubmitting(true)
    try {
      const docRef = doc(firestore, "usuarios", user.uid, "despesas", expense.id)
      await runTransaction(firestore, async (transaction) => {
        const sfDoc = await transaction.get(docRef)
        if (!sfDoc.exists()) {
          throw "Documento não existe!"
        }
        const currentStatus = sfDoc.data().statusPagamento[cellModal.mes!]
        transaction.update(docRef, { [`statusPagamento.${cellModal.mes!}`]: !currentStatus })
      })
      toast({ title: "Status de pagamento atualizado!" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message })
    }
    setIsSubmitting(false)
  }

  const handleZerar = async () => {
    if (!user || !expense || cellModal.mes === null || !firestore) return
    setIsSubmitting(true)
    try {
      const docRef = doc(firestore, "usuarios", user.uid, "despesas", expense.id)
      await updateDoc(docRef, { [`valores.${cellModal.mes}`]: 0 })
      toast({ title: "Valor zerado!" })
      setValor(0)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message })
    }
    setIsSubmitting(false)
  }

  const handleArquivar = async () => {
    if (!user || !expense || !firestore) return
    setIsSubmitting(true)
    try {
      const docRef = doc(firestore, "usuarios", user.uid, "despesas", expense.id)
      await updateDoc(docRef, { arquivado: true })
      toast({ title: "Despesa arquivada." })
      handleClose()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message })
    }
    setIsSubmitting(false)
  }

  const handleExcluir = async () => {
    if (!user || !expense || !firestore) return
    setIsSubmitting(true)
    try {
      const docRef = doc(firestore, "usuarios", user.uid, "despesas", expense.id)
      await deleteDoc(docRef)
      toast({ title: "Despesa excluída." })
      handleClose()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message })
    }
    setIsSubmitting(false)
  }

  if (!expense || cellModal.mes === null) return null
  const isPago = expense.statusPagamento[cellModal.mes]

  return (
    <Dialog open={cellModal.isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {expense.descricao} -{" "}
            {cellModal.mes.charAt(0).toUpperCase() + cellModal.mes.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Gerencie os detalhes desta despesa para o mês selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Alterar Valor (R$)</label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(parseFloat(e.target.value))}
                disabled={isSubmitting}
              />
              <Button onClick={handleUpdateValor} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={isPago ? "destructive" : "default"}
              onClick={handleTogglePagamento}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : (isPago ? <Undo2 className="mr-2 h-4 w-4" /> : <CircleDollarSign className="mr-2 h-4 w-4" />)}
              {isPago ? "Marcar como não pago" : "Marcar como pago"}
            </Button>
            <Button variant="secondary" onClick={handleZerar} disabled={isSubmitting}>
              Zerar Valor
            </Button>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex w-full justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isSubmitting}>
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isto irá deletar
                    permanentemente a despesa de <span className="font-bold">{expense.descricao}</span>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleExcluir}>
                    Continuar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" size="sm" onClick={handleArquivar} disabled={isSubmitting}>
              <Archive className="mr-2 h-4 w-4" /> Arquivar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
