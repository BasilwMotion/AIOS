/* /api/settings — company settings (GET / PATCH). */
import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase";
import { getSettings, updateSettings, type Settings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ configured: false, settings: null });
  try {
    const settings = await getSettings();
    return NextResponse.json({ configured: true, settings });
  } catch (e) {
    console.error("[settings GET]", e);
    return NextResponse.json({ configured: true, settings: null, error: "Failed to load." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  let body: Partial<Settings>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const patch: Partial<Settings> = {};
  if (typeof body.company_name === "string") patch.company_name = body.company_name.trim().slice(0, 120);
  if (typeof body.run_overnight === "boolean") patch.run_overnight = body.run_overnight;
  if (typeof body.require_review === "boolean") patch.require_review = body.require_review;
  if (typeof body.daily_digest === "boolean") patch.daily_digest = body.daily_digest;
  try {
    const settings = await updateSettings(patch);
    return NextResponse.json({ settings });
  } catch (e) {
    console.error("[settings PATCH]", e);
    return NextResponse.json({ error: "Failed to save." }, { status: 500 });
  }
}
