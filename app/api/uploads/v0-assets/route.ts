import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

const MAX_UPLOAD_BYTES = 2_000_000;

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("lumivey/v0/")) {
          throw new Error("Ongeldig uploadpad voor Lumivey v0-assets.");
        }

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60,
          tokenPayload: JSON.stringify({ purpose: "lumivey-v0-handoff" }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Lumivey v0 asset uploaded", blob.pathname);
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload naar Vercel Blob mislukt.";
    return NextResponse.json(
      {
        error: message,
        hint: message.toLowerCase().includes("token")
          ? "Koppel eerst een Vercel Blob store aan het Lumivey-project."
          : undefined,
      },
      { status: 400 },
    );
  }
}
