/**
 * Coleção local persistida em kv (AsyncStorage por baixo). É a implementação
 * de repositório da FASE LOCAL (sem backend). Quando o NestJS entrar, cada
 * feature troca sua fonte por chamadas ao core/api sem mudar as hooks.
 *
 * Regras respeitadas aqui: soft delete (guardrail §8.5) — `remove` marca
 * deletedAt e nunca apaga fisicamente. Cálculos derivados não são guardados.
 */
import { kv } from "@core/storage";
import { nowISO } from "@core/domain";

export interface Entity {
  id: string;
  deletedAt?: string | null;
}

export function createLocalCollection<T extends Entity>(storageKey: string) {
  async function readAll(): Promise<T[]> {
    return (await kv.getJSON<T[]>(storageKey)) ?? [];
  }

  async function writeAll(items: T[]): Promise<void> {
    await kv.setJSON(storageKey, items);
  }

  return {
    storageKey,
    readAll,
    writeAll,

    /** Lista itens vivos (não soft-deleted). */
    async list(): Promise<T[]> {
      const all = await readAll();
      return all.filter((i) => (i.deletedAt ?? null) === null);
    },

    /** Lista TODOS, inclusive soft-deleted (auditoria). */
    async listAll(): Promise<T[]> {
      return readAll();
    },

    async get(id: string): Promise<T | null> {
      const all = await readAll();
      return all.find((i) => i.id === id) ?? null;
    },

    async insert(item: T): Promise<T> {
      const all = await readAll();
      all.push(item);
      await writeAll(all);
      return item;
    },

    async insertMany(items: T[]): Promise<T[]> {
      const all = await readAll();
      all.push(...items);
      await writeAll(all);
      return items;
    },

    async update(id: string, patch: Partial<T>): Promise<T | null> {
      const all = await readAll();
      const idx = all.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      const updated = {
        ...all[idx],
        ...patch,
        updatedAt: nowISO(),
      } as unknown as T;
      all[idx] = updated;
      await writeAll(all);
      return updated;
    },

    /** Soft delete — nunca remove fisicamente. */
    async remove(id: string): Promise<void> {
      const all = await readAll();
      const idx = all.findIndex((i) => i.id === id);
      if (idx === -1) return;
      all[idx] = {
        ...all[idx],
        deletedAt: nowISO(),
        updatedAt: nowISO(),
      } as unknown as T;
      await writeAll(all);
    },

    /** Soft delete de vários (parcelas: "esta e as futuras" / "todas"). */
    async removeWhere(pred: (item: T) => boolean): Promise<void> {
      const all = await readAll();
      const stamp = nowISO();
      const next = all.map((i) =>
        pred(i) && (i.deletedAt ?? null) === null
          ? ({ ...i, deletedAt: stamp, updatedAt: stamp } as unknown as T)
          : i,
      );
      await writeAll(next);
    },
  };
}
