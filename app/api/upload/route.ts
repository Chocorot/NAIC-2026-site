import { NextRequest, NextResponse } from "next/server";
import { uploadToGCS, getSignedUrl } from "@/src/lib/gcs";

/**
 * Interface for the API response
 */
export interface UploadResponse {
  success: boolean;
  key: string;
  url: string;
  error?: string;
}

/**
 * POST /api/upload
 * Handles file uploads to Google Cloud Storage
 */
export async function POST(req: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sessionId = formData.get("sessionId") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, key: "", url: "", error: "No file provided" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { success: false, key: "", url: "", error: "No session ID provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split(".").pop() || "png";
    const gcsFileName = `sessions/${sessionId}/${crypto.randomUUID()}.${fileExtension}`;

    // Upload to GCS
    const uploadResult = await uploadToGCS(buffer, gcsFileName, file.type);

    // Generate a signed URL for secure access
    const signedUrl = await getSignedUrl(uploadResult.bucketPath, 60 * 24); // 24 hours

    return NextResponse.json({
      success: true,
      key: uploadResult.bucketPath,
      url: signedUrl,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Upload error:", errorMessage);
    
    return NextResponse.json(
      { success: false, key: "", url: "", error: errorMessage },
      { status: 500 }
    );
  }
}
