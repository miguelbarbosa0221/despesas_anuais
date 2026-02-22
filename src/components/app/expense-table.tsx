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

  // Calculates totals based on actual expense data
  const { monthTotals: actualMonthTotals } = React.useMemo(() => {
    const monthTotals = MESES.reduce((acc, mes) => {
      acc[mes] = 0
      return acc
    }, {} as Record<Mes, number>)

    expenses.forEach((expense) => {
      MESES.forEach((mes) => {
        monthTotals[mes] += expense.valores[mes] || 0
      })
    })

    return { monthTotals }
  }, [expenses])

  // Calculates the projection average based on past PAID months
  const projectionAverage = React.useMemo(() => {
    if (selectedYear > currentYear) return 0; // No history for future years

    const isPastYear = selectedYear < currentYear;

    // Calculate total paid amount for each month
    const paidMonthlyTotals = MESES.map((mes) =>
      expenses.reduce((sum, expense) => {
        if (expense.statusPagamento[mes]) {
          return sum + expense.valores[mes];
        }
        return sum;
      }, 0)
    );

    // Determine which months to use for the average calculation
    const relevantPaidTotals = isPastYear
      ? paidMonthlyTotals // Use all months for a past year
      : paidMonthlyTotals.slice(0, currentMonthIndex); // Use months up to the current one for the current year

    // Filter out months where nothing was paid
    const pastPaidTotalsWithValue = relevantPaidTotals.filter(
      (total) => total > 0
    );

    if (pastPaidTotalsWithValue.length === 0) return 0;

    // Calculate the average
    const average =
      pastPaidTotalsWithValue.reduce((sum, total) => sum + total, 0) /
      pastPaidTotalsWithValue.length;

    return average;
  }, [expenses, selectedYear, currentYear, currentMonthIndex]);

  // Combines actual totals with projected totals for display
  const { displayTotals, displayGrandTotal } = React.useMemo(() => {
    const displayTotals = { ...actualMonthTotals }
    let grandTotal = 0

    MESES.forEach((mes, index) => {
      const isFutureOrCurrentMonth =
        selectedYear > currentYear ||
        (selectedYear === currentYear && index >= currentMonthIndex)
        
      if (isFutureOrCurrentMonth && projectionAverage > 0 && displayTotals[mes] === 0) {
        displayTotals[mes] = projectionAverage
      }
      grandTotal += displayTotals[mes]
    })

    return { displayTotals, displayGrandTotal: grandTotal }
  }, [
    actualMonthTotals,
    projectionAverage,
    selectedYear,
    currentYear,
    currentMonthIndex,
  ]);

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
                      index === currentMonthIndex && selectedYear === currentYear && "bg-accent/20"
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
            {MESES.map((mes, index) => {
              const isFutureOrCurrentMonth =
                selectedYear > currentYear ||
                (selectedYear === currentYear && index >= currentMonthIndex)
              const isProjected = isFutureOrCurrentMonth && projectionAverage > 0 && actualMonthTotals[mes] === 0

              return (
                <TableCell 
                  key={mes} 
                  className={cn(
                    "text-right font-bold", 
                    index === currentMonthIndex && selectedYear === currentYear && "bg-accent/20",
                    isProjected && "text-muted-foreground italic"
                  )}
                >
                  <div className="flex items-center justify-end gap-2">
                    {isProjected && <Wand2 className="h-4 w-4" />}
                    <span>{formatCurrency(displayTotals[mes])}</span>
                  </div>
                </TableCell>
              )
            })}
            <TableCell className="text-right font-extrabold text-base">
                {formatCurrency(displayGrandTotal)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
