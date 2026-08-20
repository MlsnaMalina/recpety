import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Supabase uspí projekt na free tarifu po 7 dnech bez aktivity a aplikace pak
// vypadá prázdná. Tenhle endpoint jednou denně spustí Vercel cron (viz
// vercel.json) a jediným lehkým dotazem drží databázi vzhůru.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "Chybí nastavení Supabase." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${url}/rest/v1/recipes?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    return NextResponse.json(
      { ok: res.ok, status: res.status, at: new Date().toISOString() },
      { status: res.ok ? 200 : 503 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Databáze neodpovídá." },
      { status: 503 }
    );
  }
}
