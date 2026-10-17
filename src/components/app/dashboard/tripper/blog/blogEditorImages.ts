const MAX_BLOG_IMAGE_BYTES = 10 * 1024 * 1024;

export function validateBlogImageSize(file: File): boolean {
  return file.size <= MAX_BLOG_IMAGE_BYTES;
}

export async function uploadBlogImageFile(file: File, feature: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("feature", feature);
  const response = await fetch("/api/upload", { method: "POST", body: formData });
  if (!response.ok) throw new Error("upload failed");
  const data = (await response.json()) as { url?: string };
  if (!data.url) throw new Error("no url");
  return data.url;
}

export async function deleteBlogImageFile(url: string): Promise<void> {
  if (!url.includes("/api/upload?key=")) return;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[deleteBlogImageFile] ${res.status} ${res.statusText}`, body, url);
  }
}
