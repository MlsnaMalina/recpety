"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { scaleQty } from "@/lib/scale";
import type { ShoppingItem } from "@/lib/types";
import { IconPlus, IconTrash, IconCart, IconCheck } from "@/components/icons";

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[] | null>(null);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("shopping_items")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => setItems((data ?? []) as ShoppingItem[]));
  }, []);

  const sorted = useMemo(() => {
    const rows = items ?? [];
    return [...rows.filter((i) => !i.checked), ...rows.filter((i) => i.checked)];
  }, [items]);

  const checkedCount = useMemo(
    () => (items ?? []).filter((i) => i.checked).length,
    [items]
  );

  async function toggle(item: ShoppingItem) {
    setItems(
      (items ?? []).map((i) =>
        i.id === item.id ? { ...i, checked: !i.checked } : i
      )
    );
    const supabase = createClient();
    await supabase
      .from("shopping_items")
      .update({ checked: !item.checked })
      .eq("id", item.id);
  }

  async function removeItem(id: string) {
    setItems((items ?? []).filter((i) => i.id !== id));
    const supabase = createClient();
    await supabase.from("shopping_items").delete().eq("id", id);
  }

  async function clearChecked() {
    const ids = (items ?? []).filter((i) => i.checked).map((i) => i.id);
    setItems((items ?? []).filter((i) => !i.checked));
    const supabase = createClient();
    await supabase.from("shopping_items").delete().in("id", ids);
  }

  async function addManual(e: React.FormEvent) {
    e.preventDefault();
    const name = newItem.trim();
    if (!name) return;
    setNewItem("");
    const supabase = createClient();
    const { data } = await supabase
      .from("shopping_items")
      .insert({ name, qty: null, unit: "" })
      .select("*")
      .single();
    if (data) setItems([...(items ?? []), data as ShoppingItem]);
  }

  function qtyText(item: ShoppingItem): string | null {
    if (item.qty === null && !item.unit) return null;
    return scaleQty(item.qty, item.unit, 1).text;
  }

  return (
    <main>
      <h1 className="text-2xl font-medium">Nákupní seznam</h1>
      <p className="mt-0.5 text-sm text-slate-500">
        Suroviny přidáte z detailu receptu, zbytek dopište ručně
      </p>

      <form onSubmit={addManual} className="mt-4 flex gap-2">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Přidat položku (toaletní papír…)"
          className="soft-shadow w-full rounded-xl bg-white px-3 py-2.5 text-[15px]"
          aria-label="Nová položka"
        />
        <button
          type="submit"
          disabled={!newItem.trim()}
          aria-label="Přidat položku"
          className="chip-active-shadow flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white disabled:opacity-60"
        >
          <IconPlus size={20} />
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        {items === null ? (
          <p className="py-10 text-center text-sm text-slate-400">Načítám…</p>
        ) : sorted.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <IconCart size={26} />
            </span>
            <p className="font-medium">Seznam je prázdný</p>
            <p className="text-sm text-slate-500">
              Otevřete recept a klepněte na „Přidat suroviny do nákupu".
            </p>
          </div>
        ) : (
          sorted.map((item) => (
            <div
              key={item.id}
              className={`card flex items-center gap-3 px-4 py-3 ${
                item.checked ? "opacity-55" : ""
              }`}
            >
              <button
                onClick={() => toggle(item)}
                aria-label={item.checked ? "Odškrtnout" : "Zaškrtnout"}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                  item.checked
                    ? "bg-cyan-500 text-white"
                    : "soft-shadow bg-white text-transparent"
                }`}
              >
                <IconCheck size={14} />
              </button>
              <button
                onClick={() => toggle(item)}
                className="min-w-0 flex-1 text-left"
              >
                <span
                  className={`text-[15px] ${
                    item.checked ? "text-slate-400 line-through" : ""
                  }`}
                >
                  {item.name}
                </span>
                {qtyText(item) ? (
                  <span className="ml-2 text-sm font-medium text-cyan-700">
                    {qtyText(item)}
                  </span>
                ) : null}
              </button>
              <button
                onClick={() => removeItem(item.id)}
                aria-label="Smazat položku"
                className="shrink-0 p-1 text-slate-300 active:text-pink-500"
              >
                <IconTrash size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {checkedCount > 0 && (
        <button
          onClick={clearChecked}
          className="soft-shadow mt-4 w-full rounded-xl bg-white py-3 text-sm font-medium text-pink-600"
        >
          Smazat koupené ({checkedCount})
        </button>
      )}
    </main>
  );
}
