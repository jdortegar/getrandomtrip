import { NextResponse } from "next/server";
import { BlogPost } from "@/types/blog";

// Mock in-memory data store (should be shared or fetched from a real DB)
const mockBlogs: BlogPost[] = [
  {
    id: "1",
    authorId: "tripper1",
    title: "Mi Primera Aventura",
    subtitle: "Un viaje inolvidable por la Patagonia",
    tagline: "Descubre los secretos del sur argentino.",
    blocks: [{ type: "paragraph", text: "Este es el contenido de mi primer post." }],
    tags: ["aventura", "patagonia"],
    format: "article",
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  },
  {
    id: "2",
    authorId: "tripper1",
    title: "Ruta del Café en Colombia",
    subtitle: "Explorando los sabores de la tierra cafetera.",
    tagline: "Un recorrido por las fincas más auténticas.",
    blocks: [{ type: "paragraph", text: "Aquí va el contenido del post sobre café." }],
    tags: ["cafe", "colombia", "gastronomia"],
    format: "article",
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const post = mockBlogs.find((p) => p.id === id);
  if (post) {
    return NextResponse.json(post);
  } else {
    return new NextResponse("Not Found", { status: 404 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const updatedPost: BlogPost = await request.json();
  const index = mockBlogs.findIndex((p) => p.id === id);
  if (index !== -1) {
    mockBlogs[index] = { ...mockBlogs[index], ...updatedPost, updatedAt: new Date().toISOString() };
    return NextResponse.json(mockBlogs[index]);
  } else {
    return new NextResponse("Not Found", { status: 404 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const index = mockBlogs.findIndex((p) => p.id === id);
  if (index !== -1) {
    mockBlogs.splice(index, 1);
    return new NextResponse(null, { status: 204 });
  } else {
    return new NextResponse("Not Found", { status: 404 });
  }
}
