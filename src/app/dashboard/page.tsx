import { DashboardShell } from "@/components/app/dashboard-shell"
import { ExpenseTable } from "@/components/app/expense-table"
import { AddExpenseForm } from "@/components/app/add-expense-form"
import { CellActionsModal } from "@/components/app/cell-actions-modal"

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="container py-8">
        <AddExpenseForm />
        <CellActionsModal />
        <ExpenseTable />
      </div>
    </DashboardShell>
  )
}
