import { DashboardShell } from "@/components/app/dashboard-shell"
import { ExpenseTable } from "@/components/app/expense-table"
import { AddExpenseForm } from "@/components/app/add-expense-form"
import { CellActionsModal } from "@/components/app/cell-actions-modal"

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="w-full px-8 py-8">
        <div className="mb-8">
          <AddExpenseForm />
        </div>
        <CellActionsModal />
        <ExpenseTable />
      </div>
    </DashboardShell>
  )
}
