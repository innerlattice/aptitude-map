import { getChatGPTUser } from "@/app/chatgpt-auth";
import { applyMutation, loadProfile } from "@/lib/profile-store";
import type { Mutation } from "@/lib/types";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ error: message }, { status: 400 });
}

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Sign in to open your aptitude map." }, { status: 401 });
    return Response.json(await loadProfile(user.userId));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Sign in to save your aptitude map." }, { status: 401 });
    const mutation = (await request.json()) as Mutation;
    return Response.json(await applyMutation(user.userId, mutation));
  } catch (error) {
    return errorResponse(error);
  }
}
