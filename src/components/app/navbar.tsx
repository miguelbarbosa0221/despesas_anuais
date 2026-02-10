"use client"

import {
  CirclePlus,
  LogOut,
  Settings,
  User,
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
import { useUser, useAuth, useFirestore } from "@/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { YearSelector } from "./year-selector"
import { useApp } from "@/context/app-context"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { AIAdvisor } from "./ai-advisor"
import { cn } from "@/lib/utils"
import { collection, doc, getDocs, query, serverTimestamp, where, writeBatch } from "firebase/firestore"
import { MESES } from "@/lib/constants"
import { Mes } from "@/lib/types"
import Link from "next/link"

export function Navbar() {
  const { user } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  const { setSheetOpen, selectedYear } = useApp()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  const canGenerateNextYear =
    currentMonth === 11 && selectedYear === currentYear

  const handleGenerateNextYear = async () => {
    if (!user || !firestore) return
    setIsGenerating(true)
    try {
      const expensesRef = collection(firestore, "usuarios", user.uid, "despesas")
      const q = query(
        expensesRef,
        where("ano", "==", selectedYear),
        where("arquivado", "==", false)
      )
  
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Nenhuma despesa ativa encontrada para o ano atual.",
        })
        setIsGenerating(false)
        return
      }
  
      const batch = writeBatch(firestore)
      const proximoAno = selectedYear + 1
  
      // Check if next year already has expenses
      const nextYearQuery = query(expensesRef, where("ano", "==", proximoAno))
      const nextYearSnapshot = await getDocs(nextYearQuery)
      if (!nextYearSnapshot.empty) {
          toast({ variant: "destructive", title: "Erro", description: `Já existem despesas para o ano de ${proximoAno}.` })
          setIsGenerating(false)
          return
      }
  
      const initialValores = MESES.reduce((acc, mes) => {
        acc[mes] = 0
        return acc
      }, {} as Record<Mes, number>)
  
      const initialStatusPagamento = MESES.reduce((acc, mes) => {
        acc[mes] = false
        return acc
      }, {} as Record<Mes, boolean>)
  
      querySnapshot.forEach((document) => {
        const despesa = document.data()
        const newDocRef = doc(collection(firestore, "usuarios", user.uid, "despesas"))
        batch.set(newDocRef, {
          ...despesa,
          ano: proximoAno,
          valores: initialValores,
          statusPagamento: initialStatusPagamento,
          createdAt: serverTimestamp(),
        })
      })
  
      await batch.commit()
      toast({
        title: "Sucesso!",
        description: `Ano de ${selectedYear + 1} gerado com base em ${selectedYear}.`,
      })
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
          <Link href="/dashboard">
            <h1 className="text-xl font-bold text-primary cursor-pointer hover:opacity-90 transition-opacity">Anualize</h1>
          </Link>
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
