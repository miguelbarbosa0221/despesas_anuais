import { ArchivedExpenses } from "@/components/app/archived-expenses";
import { DangerZone } from "@/components/app/danger-zone";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
    return (
        <DashboardShell>
            <div className="container max-w-4xl py-8">
                <div className="grid gap-10">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
                        <p className="text-muted-foreground">
                            Gerencie suas despesas arquivadas e outras configurações da conta.
                        </p>
                    </div>

                    <ArchivedExpenses />

                    <Separator />
                    
                    <DangerZone />
                </div>
            </div>
        </DashboardShell>
    );
}