import { NextResponse } from "next/server";
import { checkBuildReadiness, WebsiteBrief } from "@/lib/lumivey/primary-flow";
import { createV0Build } from "@/lib/lumivey/v0-adapter";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const brief = body?.brief as WebsiteBrief | undefined;

    if (!brief) {
      return NextResponse.json({ error: "Geen Website Brief ontvangen." }, { status: 400 });
    }

    const readiness = checkBuildReadiness(brief);

    if (!readiness.ready) {
      return NextResponse.json(
        { error: "Website Brief is nog niet build-ready.", blockers: readiness.blockers },
        { status: 409 }
      );
    }

    const build = await createV0Build(brief);

    return NextResponse.json({ build });
  } catch (error) {
    console.error("v0 build error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "v0-build kon niet worden gestart." },
      { status: 500 }
    );
  }
}
