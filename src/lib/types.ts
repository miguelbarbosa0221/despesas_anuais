import { FieldValue } from "firebase/firestore";

export type Mes = 'janeiro' | 'fevereiro' | 'marco' | 'abril' | 'maio' | 'junho' | 'julho' | 'agosto' | 'setembro' | 'outubro' | 'novembro' | 'dezembro';

export interface Despesa {
  id: string; // Gerado pelo Firestore
  uid: string; // ID do usuário dono
  ano: number; // Ex: 2025
  vencimento: number; // Dia do mês (1-31)
  descricao: string;
  arquivado: boolean;
  projetavel?: boolean;
  // Valores monetários por mês
  valores: Record<Mes, number>;
  // Status de pagamento (true = pago, false = pendente)
  statusPagamento: Record<Mes, boolean>;
  createdAt: FieldValue;
}
