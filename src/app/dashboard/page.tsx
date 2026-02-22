import { DashboardShell } from "@/components/app/dashboard-shell"
import { ExpenseTable } from "@/components/app/expense-table"
import { AddExpenseForm } from "@/components/app/add-expense-form"
import { CellActionsModal } from "@/components/app/cell-actions-modal"
import { FinancialForecast } from "@/components/app/financial-forecast"

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <AddExpenseForm />
        <CellActionsModal />
        <FinancialForecast />
        <ExpenseTable />
      </div>
    </DashboardShell>
  )
}
