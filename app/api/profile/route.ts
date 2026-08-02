import { applyMutation, loadProfile } from "@/lib/profile-store";
import type { Mutation } from "@/lib/types";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ error: message }, { status: 400 });
}

export async function GET() {
  try {
    return Response.json(await loadProfile());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const mutation = (await request.json()) as Mutation;
    return Response.json(await applyMutation(mutation));
  } catch (error) {
    return errorResponse(error);
  }
}
