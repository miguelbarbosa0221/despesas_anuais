"use server"

import { db } from "@/lib/firebase"
import { MESES } from "@/lib/constants"
import { Despesa, Mes } from "@/lib/types"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"
import { revalidatePath } from "next/cache"

type ActionResponse = {
  success: boolean
  error?: string
}

export async function addDespesa(
  userId: string,
  data: Omit<Despesa, "id" | "uid" | "createdAt" | "arquivado">
): Promise<ActionResponse> {
  if (!userId) return { success: false, error: "Usuário não autenticado." }

  try {
    const expensesRef = collection(db, "usuarios", userId, "despesas")

    await addDoc(expensesRef, {
      ...data,
      uid: userId,
      arquivado: false,
      createdAt: serverTimestamp(),
    })
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateDespesaCell(
  userId: string,
  despesaId: string,
  mes: Mes,
  updates: { valor?: number; status?: boolean }
): Promise<ActionResponse> {
  if (!userId) return { success: false, error: "Usuário não autenticado." }

  try {
    const docRef = doc(db, "usuarios", userId, "despesas", despesaId)
    const updateData: { [key: string]: any } = {}
    if (updates.valor !== undefined) {
      updateData[`valores.${mes}`] = updates.valor
    }
    if (updates.status !== undefined) {
      updateData[`statusPagamento.${mes}`] = updates.status
    }

    await updateDoc(docRef, updateData)
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function togglePagamento(
  userId: string,
  despesaId: string,
  mes: Mes
): Promise<ActionResponse> {
  if (!userId) return { success: false, error: "Usuário não autenticado." }
  try {
    const docRef = doc(db, "usuarios", userId, "despesas", despesaId)
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(docRef)
      if (!sfDoc.exists()) {
        throw "Documento não existe!"
      }
      const currentStatus = sfDoc.data().statusPagamento[mes]
      transaction.update(docRef, { [`statusPagamento.${mes}`]: !currentStatus })
    })
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function arquivarDespesa(
  userId: string,
  despesaId: string
): Promise<ActionResponse> {
  if (!userId) return { success: false, error: "Usuário não autenticado." }
  try {
    const docRef = doc(db, "usuarios", userId, "despesas", despesaId)
    await updateDoc(docRef, { arquivado: true })
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function restaurarDespesa(
  userId: string,
  despesaId: string
): Promise<ActionResponse> {
  if (!userId) return { success: false, error: "Usuário não autenticado." }
  try {
    const docRef = doc(db, "usuarios", userId, "despesas", despesaId)
    await updateDoc(docRef, { arquivado: false })
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function excluirDespesa(
  userId: string,
  despesaId: string
): Promise<ActionResponse> {
  if (!userId) return { success: false, error: "Usuário não autenticado." }
  try {
    const docRef = doc(db, "usuarios", userId, "despesas", despesaId)
    await deleteDoc(docRef)
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function gerarProximoAno(
  userId: string,
  anoAtual: number
): Promise<ActionResponse> {
  if (!userId) return { success: false, error: "Usuário não autenticado." }

  try {
    const expensesRef = collection(db, "usuarios", userId, "despesas")
    const q = query(
      expensesRef,
      where("ano", "==", anoAtual),
      where("arquivado", "==", false)
    )

    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) {
      return {
        success: false,
        error: "Nenhuma despesa ativa encontrada para o ano atual.",
      }
    }

    const batch = writeBatch(db)
    const proximoAno = anoAtual + 1

    // Check if next year already has expenses
    const nextYearQuery = query(expensesRef, where("ano", "==", proximoAno))
    const nextYearSnapshot = await getDocs(nextYearQuery)
    if (!nextYearSnapshot.empty) {
        return { success: false, error: `Já existem despesas para o ano de ${proximoAno}.` }
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
      const newDocRef = doc(collection(db, "usuarios", userId, "despesas"))
      batch.set(newDocRef, {
        ...despesa,
        ano: proximoAno,
        valores: initialValores,
        statusPagamento: initialStatusPagamento,
        createdAt: serverTimestamp(),
      })
    })

    await batch.commit()
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function resetarAno(
  userId: string,
  ano: number
): Promise<ActionResponse> {
  if (!userId) return { success: false, error: "Usuário não autenticado." }

  try {
    const expensesRef = collection(db, "usuarios", userId, "despesas")
    const q = query(expensesRef, where("ano", "==", ano))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return { success: false, error: `Nenhuma despesa para o ano ${ano}.` }
    }

    const batch = writeBatch(db)
    querySnapshot.forEach((document) => {
      batch.delete(document.ref)
    })

    await batch.commit()
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
