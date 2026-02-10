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
import { useAuth } from "@/context/auth-context"
import { resetarAno } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export function DangerZone() {
  const { user } = useAuth()
  const { selectedYear } = useApp()
  const { toast } = useToast()
  const [isResetting, setIsResetting] = useState(false)

  const handleReset = async () => {
    if (!user) return
    setIsResetting(true)
    const result = await resetarAno(user.uid, selectedYear)
    if (result.success) {
      toast({
        title: "Sucesso!",
        description: `Todas as despesas de ${selectedYear} foram removidas.`,
      })
    } else {
      toast({ variant: "destructive", title: "Erro", description: result.error })
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
