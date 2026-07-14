"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { CookEvent } from "@/lib/types";
import Stars from "@/components/Stars";
import { IconBack, IconTrash, IconPot } from "@/components/icons";

const DAY_LABELS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

function toKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [events, setEvents] = useState<CookEvent[]>([]);
  const [selected, setSelected] = useState<string>(toKey(today));

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("cook_events")
      .select("*, recipes(title, rating, category, variant_name)")
      .order("cooked_on", { ascending: false })
      .then(({ data }) => setEvents((data ?? []) as CookEvent[]));
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, CookEvent[]>();
    for (const e of events) {
      const list = map.get(e.cooked_on) ?? [];
      list.push(e);
      map.set(e.cooked_on, list);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0
    ).getDate();
    const list: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++)
      list.push(new Date(month.getFullYear(), month.getMonth(), d));
    return list;
  }, [month]);

  const monthLabel = month.toLocaleDateString("cs-CZ", {
    month: "long",
    year: "numeric",
  });

  const selectedEvents = byDay.get(selected) ?? [];
  const selectedLabel = new Date(selected + "T00:00:00").toLocaleDateString(
    "cs-CZ",
    { weekday: "long", day: "numeric", month: "long" }
  );

  async function deleteEvent(id: string) {
    setEvents(events.filter((e) => e.id !== id));
    const supabase = createClient();
    await supabase.from("cook_events").delete().eq("id", id);
  }

  return (
    <main>
      <h1 className="text-2xl font-medium">Kalendář vaření</h1>
      <p className="mt-0.5 text-sm text-slate-500">
        Co se kdy vařilo u vás doma
      </p>

      <div className="card mt-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
            aria-label="Předchozí měsíc"
            className="soft-shadow flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500"
          >
            <IconBack size={15} />
          </button>
          <span className="text-[15px] font-medium capitalize">
            {monthLabel}
          </span>
          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
            aria-label="Další měsíc"
            className="soft-shadow flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500"
          >
            <span className="rotate-180">
              <IconBack size={15} />
            </span>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {DAY_LABELS.map((d) => (
            <span key={d} className="pb-1 text-[11px] font-medium text-slate-400">
              {d}
            </span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={`x${i}`} />;
            const key = toKey(d);
            const dayEvents = byDay.get(key) ?? [];
            const isSelected = key === selected;
            const isToday = key === toKey(today);
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors ${
                  isSelected
                    ? "chip-active-shadow bg-blue-500 font-medium text-white"
                    : isToday
                      ? "bg-cyan-100 font-medium text-cyan-700"
                      : "text-slate-600"
                }`}
              >
                {d.getDate()}
                <span className="mt-0.5 flex h-1.5 gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected ? "bg-white" : "bg-pink-400"
                      }`}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <h2 className="mt-5 mb-2 text-[15px] font-medium first-letter:uppercase">
        {selectedLabel}
      </h2>
      {selectedEvents.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-8 text-center text-slate-400">
          <IconPot size={24} />
          <p className="text-sm">Tento den se nic nevařilo.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {selectedEvents.map((e) => (
            <div key={e.id} className="card flex items-center gap-3 p-3">
              <Link
                href={`/recept/${e.recipe_id}`}
                className="min-w-0 flex-1"
              >
                <span className="block truncate text-[15px] font-medium">
                  {e.recipes?.title ?? "Smazaný recept"}
                  {e.recipes?.variant_name ? (
                    <span className="font-normal text-cyan-600">
                      {" "}
                      · {e.recipes.variant_name}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                  {e.recipes?.category}
                  {e.recipes?.rating ? (
                    <Stars value={e.recipes.rating} size={12} />
                  ) : null}
                </span>
              </Link>
              <button
                onClick={() => deleteEvent(e.id)}
                aria-label="Smazat záznam"
                className="shrink-0 p-1 text-slate-300 active:text-pink-500"
              >
                <IconTrash size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
