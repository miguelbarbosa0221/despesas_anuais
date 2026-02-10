"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useExpenses } from "@/hooks/use-expenses"
import { useAuth } from "@/context/auth-context"
import { useApp } from "@/context/app-context"
import { MESES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Badge } from "../ui/badge"
import { Check, X } from "lucide-react"
import { Despesa, Mes } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function ExpenseTable() {
  const { user } = useAuth()
  const { selectedYear, setCellModal } = useApp()
  const { expenses, loading } = useExpenses(user?.uid, selectedYear)

  const currentMonthIndex = new Date().getMonth()

  const handleCellClick = (despesaId: string, mes: Mes) => {
    setCellModal({ isOpen: true, despesaId, mes })
  }
  
  const calculateTotals = () => {
    const monthTotals = MESES.reduce((acc, mes) => {
      acc[mes] = 0;
      return acc;
    }, {} as Record<Mes, number>);
    
    let grandTotal = 0;

    expenses.forEach(expense => {
      MESES.forEach(mes => {
        monthTotals[mes] += expense.valores[mes] || 0;
      });
    });

    grandTotal = Object.values(monthTotals).reduce((sum, total) => sum + total, 0);
    
    return { monthTotals, grandTotal };
  };

  const { monthTotals, grandTotal } = calculateTotals();


  if (loading) {
    return (
      <div className="rounded-lg border">
        <Table>
            <TableHeader>
                <TableRow>
                    {Array.from({ length: 15 }).map((_, i) => (
                        <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        {Array.from({ length: 15 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    )
  }
  
  if (expenses.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
            <h2 className="text-xl font-semibold">Nenhuma despesa encontrada</h2>
            <p className="text-muted-foreground">Adicione uma nova despesa para começar.</p>
        </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Dia</TableHead>
            <TableHead>Descrição</TableHead>
            {MESES.map((mes, index) => (
              <TableHead
                key={mes}
                className={cn(
                  "text-right",
                  index === currentMonthIndex && "bg-accent/20"
                )}
              >
                {mes.charAt(0).toUpperCase() + mes.slice(1)}
              </TableHead>
            ))}
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((despesa) => {
            const totalLinha = Object.values(despesa.valores).reduce(
              (acc, val) => acc + val,
              0
            )
            return (
              <TableRow key={despesa.id}>
                <TableCell className="font-medium">{despesa.vencimento}</TableCell>
                <TableCell>{despesa.descricao}</TableCell>
                {MESES.map((mes, index) => (
                  <TableCell
                    key={mes}
                    onClick={() => handleCellClick(despesa.id, mes)}
                    className={cn(
                      "text-right cursor-pointer hover:bg-accent/50",
                      index === currentMonthIndex && "bg-accent/20"
                    )}
                  >
                    <div className="flex items-center justify-end gap-2">
                        {despesa.statusPagamento[mes] ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                           (despesa.valores[mes] > 0) && <X className="h-4 w-4 text-red-500" />
                        )}
                        <span>{formatCurrency(despesa.valores[mes])}</span>
                    </div>
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold">
                  {formatCurrency(totalLinha)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2} className="font-bold">Total Mensal</TableCell>
            {MESES.map((mes, index) => (
              <TableCell key={mes} className={cn("text-right font-bold", index === currentMonthIndex && "bg-accent/20")}>
                {formatCurrency(monthTotals[mes])}
              </TableCell>
            ))}
            <TableCell className="text-right font-extrabold text-base">
                {formatCurrency(grandTotal)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
