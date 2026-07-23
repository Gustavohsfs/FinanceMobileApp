/**
 * core/money — aritmética de dinheiro em centavos (inteiros).
 *
 * REGRA NÚMERO UM (BRIEF §5.1): dinheiro é inteiro. Nunca float, parseFloat
 * ou toFixed em cálculo monetário. Formatação só na borda de apresentação.
 *
 * Módulo PURO: zero dependências externas, zero I/O. Testável isoladamente.
 */

/** Valor monetário em centavos. Sempre inteiro. */
export type Cents = number;

/** Erro de domínio para entradas monetárias inválidas. */
export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

function assertInteger(cents: number, label = "valor"): void {
  if (!Number.isInteger(cents)) {
    throw new MoneyError(`${label} precisa ser um inteiro em centavos, recebido ${cents}`);
  }
}

/**
 * Converte a string digitada pelo usuário (ex.: "1.234,56", "1234.56", "12")
 * em centavos inteiros. Aceita separadores pt-BR e en-US.
 */
export function fromInput(input: string): Cents {
  const trimmed = input.trim();
  if (trimmed === "") return 0;

  // mantém apenas dígitos, vírgula, ponto e sinal
  let cleaned = trimmed.replace(/[^0-9.,-]/g, "");
  const negative = cleaned.startsWith("-");
  cleaned = cleaned.replace(/-/g, "");

  // decide qual é o separador decimal: o último ponto ou vírgula que aparecer
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalSep = lastComma > lastDot ? "," : lastDot > lastComma ? "." : "";

  let intPart = cleaned;
  let fracPart = "";
  if (decimalSep) {
    const idx = cleaned.lastIndexOf(decimalSep);
    intPart = cleaned.slice(0, idx);
    fracPart = cleaned.slice(idx + 1);
  }

  // remove quaisquer separadores de milhar remanescentes
  intPart = intPart.replace(/[.,]/g, "");
  fracPart = fracPart.replace(/[.,]/g, "");

  // normaliza a parte fracionária para exatamente 2 casas (centavos)
  fracPart = (fracPart + "00").slice(0, 2);

  const reais = intPart === "" ? 0 : parseInt(intPart, 10);
  const centavos = fracPart === "" ? 0 : parseInt(fracPart, 10);
  if (Number.isNaN(reais) || Number.isNaN(centavos)) {
    throw new MoneyError(`entrada monetária inválida: "${input}"`);
  }

  const total = reais * 100 + centavos;
  return negative ? -total : total;
}

/** Converte centavos que já vêm de um teclado numérico (dígitos puros). */
export function fromKeypadDigits(digits: string): Cents {
  const onlyDigits = digits.replace(/\D/g, "");
  if (onlyDigits === "") return 0;
  const value = parseInt(onlyDigits, 10);
  return Number.isNaN(value) ? 0 : value;
}

export function add(a: Cents, b: Cents): Cents {
  assertInteger(a, "a");
  assertInteger(b, "b");
  return a + b;
}

export function subtract(a: Cents, b: Cents): Cents {
  assertInteger(a, "a");
  assertInteger(b, "b");
  return a - b;
}

export function sum(values: readonly Cents[]): Cents {
  return values.reduce((acc, v) => add(acc, v), 0);
}

/**
 * Multiplica um valor em centavos por uma taxa (ex.: juros, percentual),
 * arredondando para o centavo mais próximo (round half up).
 */
export function multiplyByRate(cents: Cents, rate: number): Cents {
  assertInteger(cents, "cents");
  return Math.round(cents * rate);
}

export function abs(cents: Cents): Cents {
  return Math.abs(cents);
}

export function isZero(cents: Cents): boolean {
  return cents === 0;
}

export function isNegative(cents: Cents): boolean {
  return cents < 0;
}

/**
 * Divide um total em N parcelas inteiras cuja soma fecha EXATAMENTE com o total.
 * O resto da divisão é distribuído nas PRIMEIRAS parcelas (BRIEF §5.1 e §5.3).
 *
 * Ex.: splitInstallments(100000, 3) => [33334, 33333, 33333]  (soma = 100000)
 */
export function splitInstallments(total: Cents, n: number): Cents[] {
  assertInteger(total, "total");
  if (!Number.isInteger(n) || n <= 0) {
    throw new MoneyError(`número de parcelas inválido: ${n}`);
  }
  const sign = total < 0 ? -1 : 1;
  const absTotal = Math.abs(total);
  const base = Math.floor(absTotal / n);
  const remainder = absTotal - base * n; // 0..n-1 centavos sobrando
  const parts: Cents[] = [];
  for (let i = 0; i < n; i++) {
    const extra = i < remainder ? 1 : 0;
    parts.push(sign * (base + extra));
  }
  return parts;
}

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata centavos como moeda BRL. Só use na borda de apresentação. */
export function format(cents: Cents): string {
  return brlFormatter.format(cents / 100);
}

/** Formata sem o símbolo de moeda (ex.: "1.234,56") — útil em eixos de gráfico. */
export function formatCompactNumber(cents: Cents): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Formata com sinal explícito (+/−) para deltas. */
export function formatSigned(cents: Cents): string {
  const sign = cents > 0 ? "+" : cents < 0 ? "−" : "";
  return `${sign}${format(Math.abs(cents))}`;
}
