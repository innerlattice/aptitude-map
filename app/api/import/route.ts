import { importProfile } from "@/lib/profile-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    return Response.json(await importProfile(await request.json()));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 400 });
  }
}
