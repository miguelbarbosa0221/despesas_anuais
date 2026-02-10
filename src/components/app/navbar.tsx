"use client"

import {
  CirclePlus,
  LogOut,
  Settings,
  User,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"
import { signOut } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { YearSelector } from "./year-selector"
import { useApp } from "@/context/app-context"
import { gerarProximoAno } from "@/app/actions"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { AIAdvisor } from "./ai-advisor"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { user } = useAuth()
  const { setSheetOpen, selectedYear } = useApp()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  const canGenerateNextYear =
    currentMonth === 11 && selectedYear === currentYear

  const handleGenerateNextYear = async () => {
    if (!user) return
    setIsGenerating(true)
    try {
      const result = await gerarProximoAno(user.uid, selectedYear)
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: `Ano de ${selectedYear + 1} gerado com base em ${selectedYear}.`,
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar próximo ano",
        description:
          error.message || "Ocorreu um problema, tente novamente.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-primary">Anualize</h1>
          <YearSelector />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateNextYear}
            disabled={!canGenerateNextYear || isGenerating}
            className={cn(!canGenerateNextYear && "hidden")}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Gerar {selectedYear + 1}
          </Button>
          
          <AIAdvisor />

          <Button size="sm" onClick={() => setSheetOpen(true)}>
            <CirclePlus className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 w-9 rounded-full"
                size="icon"
              >
                <User className="h-4 w-4" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Minha Conta
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => router.push("/dashboard/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
