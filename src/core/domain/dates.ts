/**
 * Datas do domínio. Fuso de referência para agregação/renderização:
 * America/Sao_Paulo (BRIEF §5.3 e guardrail §8.9). No wire tudo é UTC ISO.
 *
 * Um gasto às 22h de 31/jul não pode cair em agosto — por isso qualquer
 * "a que mês pertence" passa pela conversão de fuso.
 *
 * IMPLEMENTAÇÃO SEM Intl/TZDate (decisão deliberada): o Hermes (motor JS do
 * React Native) não suporta `timeZoneName: 'longOffset'`, que o @date-fns/tz
 * usa para calcular offsets — no dispositivo isso gerava datas completamente
 * erradas (ex.: "dezembro de 2025" no lugar de "julho de 2026"). Como o Brasil
 * não tem horário de verão desde 2019, America/Sao_Paulo é UTC-3 FIXO, e a
 * conversão vira aritmética pura: determinística, testável e idêntica em
 * Node e Hermes. Se o DST voltar um dia, este é o único arquivo a mudar.
 */
import { addMonths } from "date-fns";
import type { ISODate } from "./types";

/** Offset fixo de America/Sao_Paulo (UTC-3). */
const SP_OFFSET_MS = 3 * 60 * 60 * 1000;

const MESES_CURTOS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
] as const;

const MESES_LONGOS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
] as const;

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Converte um instante UTC para um Date "deslocado" cujos getters getUTC*
 * devolvem os componentes de calendário no fuso de São Paulo.
 */
function shiftToSP(iso: ISODate): Date {
  return new Date(new Date(iso).getTime() - SP_OFFSET_MS);
}

/** Agora, como ISO UTC. */
export function nowISO(): ISODate {
  return new Date().toISOString();
}

/** Chave de mês "YYYY-MM" no fuso do app (competência). */
export function monthKey(iso: ISODate): string {
  const d = shiftToSP(iso);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

/** Dia "YYYY-MM-DD" no fuso do app. */
export function dayKey(iso: ISODate): string {
  const d = shiftToSP(iso);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** Dia do mês (1..31) no fuso do app. */
export function dayOfMonth(iso: ISODate): number {
  return shiftToSP(iso).getUTCDate();
}

/** "YYYY-MM" do mês atual. */
export function currentMonthKey(): string {
  return monthKey(nowISO());
}

/** Soma meses a uma chave "YYYY-MM" (aritmética pura, sem Date). */
export function addMonthsToKey(key: string, months: number): string {
  const [y, m] = key.split("-").map(Number);
  const total = (y ?? 1970) * 12 + ((m ?? 1) - 1) + months;
  const newY = Math.floor(total / 12);
  const newM = ((total % 12) + 12) % 12; // módulo sempre positivo
  return `${newY}-${pad2(newM + 1)}`;
}

/** Soma meses a um ISO, preservando dia/hora aproximados (para parcelas). */
export function addMonthsISO(iso: ISODate, months: number): ISODate {
  return addMonths(new Date(iso), months).toISOString();
}

/** Rótulo humano do mês, ex.: "julho de 2026". Direto da chave, sem Date. */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const nome = MESES_LONGOS[((m ?? 1) - 1 + 12) % 12] ?? "";
  return `${nome} de ${y ?? 0}`;
}

/** Rótulo curto do mês, ex.: "jul/26". */
export function monthShort(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const nome = MESES_CURTOS[((m ?? 1) - 1 + 12) % 12] ?? "";
  return `${nome}/${String(y ?? 0).slice(2)}`;
}

/** Rótulo humano de um dia, ex.: "22 jul". */
export function dayLabel(iso: ISODate): string {
  const d = shiftToSP(iso);
  return `${d.getUTCDate()} ${MESES_CURTOS[d.getUTCMonth()]}`;
}

/** Lista as N chaves de mês terminando no mês de referência (inclusive). */
export function lastNMonthKeys(refKey: string, n: number): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(addMonthsToKey(refKey, -i));
  }
  return keys;
}

/**
 * Intervalo [from, to) de um mês em ISO UTC, com as bordas na meia-noite de
 * São Paulo (meia-noite SP = 03:00 UTC). Usado nos query params da API.
 */
export function monthRangeUTC(key: string): { from: ISODate; to: ISODate } {
  const [y, m] = key.split("-").map(Number);
  const from = Date.UTC(y ?? 1970, (m ?? 1) - 1, 1) + SP_OFFSET_MS;
  const to = Date.UTC(y ?? 1970, m ?? 1, 1) + SP_OFFSET_MS;
  return { from: new Date(from).toISOString(), to: new Date(to).toISOString() };
}
