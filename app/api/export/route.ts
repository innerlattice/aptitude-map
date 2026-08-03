import { getChatGPTUser } from "@/app/chatgpt-auth";
import { loadProfile } from "@/lib/profile-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Sign in to export your aptitude map." }, { status: 401 });
    const profile = await loadProfile(user.userId);
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
