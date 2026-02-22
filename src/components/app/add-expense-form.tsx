"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useApp } from "@/context/app-context"
import { Checkbox } from "../ui/checkbox"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { MESES } from "@/lib/constants"
import { Mes } from "@/lib/types"
import { useUser, useFirestore } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"

const formSchema = z.object({
  descricao: z.string().min(2, {
    message: "A descrição deve ter pelo menos 2 caracteres.",
  }),
  vencimento: z.coerce
    .number()
    .min(1, { message: "O dia deve ser no mínimo 1." })
    .max(31, { message: "O dia deve ser no máximo 31." }),
  valorBase: z.coerce.number().min(0, { message: "O valor não pode ser negativo." }),
  recorrente: z.boolean().default(false),
  projetavel: z.boolean().default(false),
  mesUnico: z.string().optional(),
})

export function AddExpenseForm() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { sheetOpen, setSheetOpen, selectedYear } = useApp()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      vencimento: new Date().getDate(),
      valorBase: 0,
      recorrente: true,
      projetavel: false,
    },
  })

  const isRecorrente = form.watch("recorrente")

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "Erro de autenticação" })
        return
    }

    setIsSubmitting(true)
    const valores: Record<Mes, number> = {} as any
    const statusPagamento: Record<Mes, boolean> = {} as any

    MESES.forEach(mes => {
        if (values.recorrente) {
            valores[mes] = values.valorBase;
        } else {
            valores[mes] = mes === values.mesUnico ? values.valorBase : 0;
        }
        statusPagamento[mes] = false;
    });

    const despesaData = {
        ano: selectedYear,
        descricao: values.descricao,
        vencimento: values.vencimento,
        projetavel: values.projetavel,
        valores,
        statusPagamento,
        uid: user.uid,
        arquivado: false,
        createdAt: serverTimestamp(),
    };

    try {
        const expensesRef = collection(firestore, "usuarios", user.uid, "despesas")
        await addDoc(expensesRef, despesaData)
        toast({ title: "Sucesso!", description: "Despesa adicionada."})
        form.reset();
        setSheetOpen(false);
    } catch (error: any) {
        console.error(error);
        toast({ variant: "destructive", title: "Erro", description: error.message || "Não foi possível adicionar a despesa."})
    } finally {
        setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Adicionar Nova Despesa</SheetTitle>
          <SheetDescription>
            Preencha os detalhes da despesa para o ano de {selectedYear}.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Conta de Luz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia do Vencimento</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valorBase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Base (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="recorrente"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Recorrente
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                        Marque se o valor base se aplica a todos os meses.
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="projetavel"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Projeção Inteligente
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                        Calcula a média dos meses pagos e preenche os meses futuros vazios.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {!isRecorrente && (
              <FormField
                control={form.control}
                name="mesUnico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o mês para o valor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MESES.map(mes => (
                            <SelectItem key={mes} value={mes}>{mes.charAt(0).toUpperCase() + mes.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Salvar Despesa
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
