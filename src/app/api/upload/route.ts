import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Simulate file upload
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return new NextResponse("No file uploaded", { status: 400 });
  }

  // In a real app, you'd upload to S3, Cloudinary, etc.
  const mockUrl = `https://placehold.co/600x400?text=Uploaded_${Date.now()}`;

  return NextResponse.json({ url: mockUrl });
}
