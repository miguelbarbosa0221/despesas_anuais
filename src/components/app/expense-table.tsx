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
import { useUser } from "@/firebase"
import { useApp } from "@/context/app-context"
import { MESES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Check, Wand2, X } from "lucide-react"
import { Despesa, Mes } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import React from "react"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function ExpenseTable() {
  const { user } = useUser()
  const { selectedYear, setCellModal } = useApp()
  const { expenses, loading } = useExpenses(user?.uid, selectedYear)

  const currentYear = new Date().getFullYear()
  const currentMonthIndex = new Date().getMonth()

  const handleCellClick = (despesaId: string, mes: Mes) => {
    setCellModal({ isOpen: true, despesaId, mes })
  }

  const { displayExpenses, monthTotals, grandTotal } = React.useMemo(() => {
    const newDisplayExpenses = expenses.map(despesa => {
        const displayValores = { ...despesa.valores };
        const isMesProjected: Record<Mes, boolean> = MESES.reduce((acc, mes) => ({ ...acc, [mes]: false }), {} as Record<Mes, boolean>);

        if (despesa.projetavel) {
            const paidValues = MESES
                .filter(mes => despesa.statusPagamento[mes])
                .map(mes => despesa.valores[mes]);
            
            if (paidValues.length > 0) {
                const totalPaid = paidValues.reduce((sum, value) => sum + value, 0);
                const expenseProjectionAverage = totalPaid / paidValues.length;

                MESES.forEach((mes, index) => {
                    const isFutureOrCurrentMonth = selectedYear > currentYear || (selectedYear === currentYear && index >= currentMonthIndex);
                    const isUnpaidWithZeroValue = despesa.valores[mes] === 0;

                    if (isFutureOrCurrentMonth && isUnpaidWithZeroValue) {
                        displayValores[mes] = expenseProjectionAverage;
                        isMesProjected[mes] = true;
                    }
                });
            }
        }
        return { ...despesa, displayValores, isMesProjected };
    });

    const newMonthTotals = MESES.reduce((acc, mes) => {
        acc[mes] = newDisplayExpenses.reduce((sum, expense) => sum + expense.displayValores[mes], 0);
        return acc;
    }, {} as Record<Mes, number>);

    const newGrandTotal = Object.values(newMonthTotals).reduce((sum, total) => sum + total, 0);

    return { displayExpenses: newDisplayExpenses, monthTotals: newMonthTotals, grandTotal: newGrandTotal };
}, [expenses, selectedYear, currentYear, currentMonthIndex]);


  if (loading) {
    return (
      <div className="w-full rounded-lg border">
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
    <div className="w-full overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px] min-w-[60px]">Dia</TableHead>
            <TableHead className="min-w-[200px]">Descrição</TableHead>
            {MESES.map((mes, index) => (
              <TableHead
                key={mes}
                className={cn(
                  "text-right min-w-[150px]",
                  index === currentMonthIndex && selectedYear === currentYear && "bg-accent/20"
                )}
              >
                {mes.charAt(0).toUpperCase() + mes.slice(1)}
              </TableHead>
            ))}
            <TableHead className="text-right min-w-[150px]">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayExpenses.map((despesa) => {
            const totalLinha = Object.values(despesa.displayValores).reduce(
              (acc, val) => acc + val,
              0
            )
            return (
              <TableRow key={despesa.id}>
                <TableCell className="font-medium">{despesa.vencimento}</TableCell>
                <TableCell>{despesa.descricao}</TableCell>
                {MESES.map((mes, index) => {
                  const isProjected = despesa.isMesProjected[mes];
                  const displayValue = despesa.displayValores[mes];
                  return (
                  <TableCell
                    key={mes}
                    onClick={() => handleCellClick(despesa.id, mes)}
                    className={cn(
                      "text-right cursor-pointer hover:bg-accent/50",
                      index === currentMonthIndex && selectedYear === currentYear && "bg-accent/20",
                      isProjected && "text-muted-foreground italic"
                    )}
                  >
                    <div className="flex items-center justify-end gap-2">
                        {isProjected ? (
                            <Wand2 className="h-4 w-4" />
                        ) : despesa.statusPagamento[mes] ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                           (despesa.valores[mes] > 0) && <X className="h-4 w-4 text-red-500" />
                        )}
                        <span>{formatCurrency(displayValue)}</span>
                    </div>
                  </TableCell>
                )})}
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
            {MESES.map((mes, index) => {
              return (
                <TableCell 
                  key={mes} 
                  className={cn(
                    "text-right font-bold", 
                    index === currentMonthIndex && selectedYear === currentYear && "bg-accent/20"
                  )}
                >
                  {formatCurrency(monthTotals[mes])}
                </TableCell>
              )
            })}
            <TableCell className="text-right font-extrabold text-base">
                {formatCurrency(grandTotal)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
