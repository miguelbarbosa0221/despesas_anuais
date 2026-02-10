"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Sparkles, AlertTriangle } from "lucide-react"
import { expenseAnomalyDetection } from "@/ai/flows/expense-anomaly-detection"
import { useExpenses } from "@/hooks/use-expenses"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"

export function AIAdvisor() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [advice, setAdvice] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { selectedYear } = useApp()
  const { expenses } = useExpenses(user?.uid, selectedYear)

  const handleGenerateAdvice = async () => {
    if (!user || expenses.length === 0) {
      setError("Não há dados de despesas para analisar.")
      return
    }
    setIsLoading(true)
    setError(null)
    setAdvice("")

    try {
      const expenseDataForAI = expenses.map((expense) => ({
        descricao: expense.descricao,
        valores: expense.valores,
      }))

      const result = await expenseAnomalyDetection({
        expenseData: JSON.stringify(expenseDataForAI),
        year: selectedYear,
        userDescription: `Usuário com email ${user.email}`,
      })
      setAdvice(result.advice)
    } catch (e: any) {
      setError(
        "Ocorreu um erro ao gerar o conselho. Tente novamente mais tarde."
      )
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      // Reset state when opening
      setAdvice("")
      setError(null)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-2 h-4 w-4 text-accent" />
          Conselheiro AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Conselheiro Financeiro AI
          </DialogTitle>
          <DialogDescription>
            Receba dicas personalizadas para suas finanças com base nas suas
            despesas de {selectedYear}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {!advice && !isLoading && !error && (
            <div className="text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                Clique no botão abaixo para que nossa inteligência artificial
                analise seus gastos e detecte anomalias.
              </p>
              <Button onClick={handleGenerateAdvice}>Analisar Despesas</Button>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Analisando suas finanças...
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {advice && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Conselho Personalizado:</h3>
              <div className="prose prose-sm max-w-none rounded-md border bg-secondary/50 p-4 text-secondary-foreground">
                <p>{advice}</p>
              </div>
              <Button variant="outline" onClick={handleGenerateAdvice}>
                Analisar Novamente
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
