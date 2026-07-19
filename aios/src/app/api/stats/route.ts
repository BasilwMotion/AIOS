/* /api/stats — live company metrics for the Analytics page. */
import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase";
import { getStats } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ configured: false, stats: null });
  try {
    const stats = await getStats();
    return NextResponse.json({ configured: true, stats });
  } catch (e) {
    console.error("[stats GET]", e);
    return NextResponse.json({ configured: true, stats: null, error: "Failed to load stats." }, { status: 500 });
  }
}
