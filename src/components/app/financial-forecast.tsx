"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useExpenses } from "@/hooks/use-expenses"
import { useUser } from "@/firebase"
import { useApp } from "@/context/app-context"
import { MESES } from "@/lib/constants"

export function FinancialForecast() {
  const { user } = useUser()
  const { selectedYear } = useApp()
  const { expenses, loading } = useExpenses(user?.uid, selectedYear)
  
  const chartData = React.useMemo(() => {
    if (!expenses || expenses.length === 0) return []

    const currentYear = new Date().getFullYear()
    const currentMonthIndex = currentYear === selectedYear ? new Date().getMonth() : 11

    const monthlyPaidTotals = MESES.map((mes) => {
        return expenses.reduce((sum, expense) => {
            if (expense.statusPagamento[mes]) {
                return sum + expense.valores[mes]
            }
            return sum
        }, 0)
    })

    const pastPaidMonths = monthlyPaidTotals.slice(0, currentMonthIndex + 1).filter(total => total > 0)
    
    const averageMonthlyIncome = pastPaidMonths.length > 0
        ? pastPaidMonths.reduce((sum, total) => sum + total, 0) / pastPaidMonths.length
        : 0;

    return MESES.map((mes, index) => {
        const capitalMes = mes.charAt(0).toUpperCase() + mes.slice(1);
        const actual = monthlyPaidTotals[index];
        
        if (index <= currentMonthIndex) {
            return {
                month: capitalMes,
                "Receita Real": actual,
                "Projeção": actual,
            }
        } else {
            return {
                month: capitalMes,
                "Receita Real": 0,
                "Projeção": averageMonthlyIncome,
            }
        }
    })
  }, [expenses, selectedYear])

  const chartConfig = {
    "Receita Real": {
      label: "Receita Real",
      color: "hsl(var(--primary))",
    },
    "Projeção": {
      label: "Projeção",
      color: "hsl(var(--accent))",
    },
  }

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Carregando Projeção...</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full p-6">
                 <div className="h-full w-full animate-pulse rounded-md bg-muted" />
            </CardContent>
        </Card>
    )
  }

  if (expenses.length === 0) {
    return null;
  }
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Projeção Financeira para {selectedYear}</CardTitle>
        <CardDescription>
          Estimativa de receita com base na média de pagamentos realizados nos meses anteriores.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
                tickFormatter={(value) => `R$${value / 1000}k`}
                axisLine={false}
                tickLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Legend />
            <Bar dataKey="Receita Real" fill="var(--color-Receita Real)" radius={4} />
            <Bar dataKey="Projeção" fill="var(--color-Projeção)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
