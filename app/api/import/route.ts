import { getChatGPTUser } from "@/app/chatgpt-auth";
import { importProfile } from "@/lib/profile-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Sign in to import an aptitude map." }, { status: 401 });
    return Response.json(await importProfile(user.userId, await request.json()));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 400 });
  }
}
