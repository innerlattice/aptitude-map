import { loadProfile } from "@/lib/profile-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await loadProfile();
    return new Response(`${JSON.stringify(profile, null, 2)}\n`, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": 'attachment; filename="aptitude-map.json"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}
