/**
 * Datas do domínio. Fuso de referência para agregação/renderização:
 * America/Sao_Paulo (BRIEF §5.3 e guardrail §8.9). No wire tudo é UTC ISO.
 *
 * Um gasto às 22h de 31/jul não pode cair em agosto — por isso qualquer
 * "a que mês pertence" passa pela conversão de fuso.
 */
import { TZDate } from "@date-fns/tz";
import { addMonths, format as fnsFormat } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ISODate } from "./types";

export const APP_TZ = "America/Sao_Paulo";

/** Agora, como ISO UTC. */
export function nowISO(): ISODate {
  return new Date().toISOString();
}

/** Converte um ISO UTC para um TZDate no fuso do app. */
export function toAppZone(iso: ISODate): TZDate {
  return new TZDate(new Date(iso), APP_TZ);
}

/** Chave de mês "YYYY-MM" no fuso do app (competência). */
export function monthKey(iso: ISODate): string {
  return fnsFormat(toAppZone(iso), "yyyy-MM");
}

/** Chave de mês de um objeto Date interpretado no fuso do app. */
export function monthKeyOfDate(date: Date): string {
  return fnsFormat(new TZDate(date, APP_TZ), "yyyy-MM");
}

/** Dia "YYYY-MM-DD" no fuso do app. */
export function dayKey(iso: ISODate): string {
  return fnsFormat(toAppZone(iso), "yyyy-MM-dd");
}

/** Dia do mês (1..31) no fuso do app. */
export function dayOfMonth(iso: ISODate): number {
  return toAppZone(iso).getDate();
}

/** "YYYY-MM" do mês atual. */
export function currentMonthKey(): string {
  return monthKey(nowISO());
}

/** Soma meses a uma chave "YYYY-MM". */
export function addMonthsToKey(key: string, months: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, 1));
  return fnsFormat(addMonths(d, months), "yyyy-MM");
}

/** Soma meses a um ISO, preservando dia/hora aproximados (para parcelas). */
export function addMonthsISO(iso: ISODate, months: number): ISODate {
  return addMonths(new Date(iso), months).toISOString();
}

/** Rótulo humano do mês, ex.: "julho de 2026". */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new TZDate(Date.UTC(y ?? 1970, (m ?? 1) - 1, 1), APP_TZ);
  return fnsFormat(d, "MMMM 'de' yyyy", { locale: ptBR });
}

/** Rótulo curto do mês, ex.: "jul/26". */
export function monthShort(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const meses = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  const mm = meses[(m ?? 1) - 1] ?? "";
  return `${mm}/${String(y ?? 0).slice(2)}`;
}

/** Rótulo humano de um dia, ex.: "22 jul". */
export function dayLabel(iso: ISODate): string {
  const d = toAppZone(iso);
  const meses = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  return `${d.getDate()} ${meses[d.getMonth()]}`;
}

/**
 * Intervalo [from, to) de um mês em ISO UTC, com as bordas na meia-noite do
 * fuso do app. Usado nos query params `from`/`to` da API.
 */
export function monthRangeUTC(key: string): { from: ISODate; to: ISODate } {
  const [y, m] = key.split("-").map(Number);
  const from = new TZDate(y ?? 1970, (m ?? 1) - 1, 1, 0, 0, 0, APP_TZ);
  const to = new TZDate(y ?? 1970, m ?? 1, 1, 0, 0, 0, APP_TZ); // 1º dia do mês seguinte
  return { from: from.toISOString(), to: to.toISOString() };
}

/** Lista as N chaves de mês terminando no mês de referência (inclusive). */
export function lastNMonthKeys(refKey: string, n: number): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(addMonthsToKey(refKey, -i));
  }
  return keys;
}
