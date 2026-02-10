"use client"

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
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useApp } from "@/context/app-context"
import { useUser, useFirestore } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { collection, getDocs, query, where, writeBatch } from "firebase/firestore"

export function DangerZone() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { selectedYear } = useApp()
  const { toast } = useToast()
  const [isResetting, setIsResetting] = useState(false)

  const handleReset = async () => {
    if (!user || !firestore) return
    setIsResetting(true)
    try {
      const expensesRef = collection(firestore, "usuarios", user.uid, "despesas")
      const q = query(expensesRef, where("ano", "==", selectedYear))
      const querySnapshot = await getDocs(q)
  
      if (querySnapshot.empty) {
        toast({ variant: "destructive", title: "Erro", description: `Nenhuma despesa para o ano ${selectedYear}.` })
        setIsResetting(false)
        return
      }
  
      const batch = writeBatch(firestore)
      querySnapshot.forEach((document) => {
        batch.delete(document.ref)
      })
  
      await batch.commit()
      toast({
        title: "Sucesso!",
        description: `Todas as despesas de ${selectedYear} foram removidas.`,
      })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message })
    }
    setIsResetting(false)
  }

  return (
    <div className="space-y-4 rounded-lg border border-destructive p-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-destructive">
          Zona de Perigo
        </h2>
        <p className="text-muted-foreground">
          Ações destrutivas que não podem ser desfeitas.
        </p>
      </div>
      <div className="flex items-center justify-between rounded-md border border-dashed border-destructive/50 p-4">
        <div>
          <h3 className="font-semibold">Resetar Ano</h3>
          <p className="text-sm text-muted-foreground">
            Isto irá apagar permanentemente todas as despesas de {selectedYear}.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isResetting}>
                {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Resetar {selectedYear}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem absoluta certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todas as despesas do ano de{" "}
                <span className="font-bold">{selectedYear}</span> serão
                excluídas permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>
                Sim, excluir tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
