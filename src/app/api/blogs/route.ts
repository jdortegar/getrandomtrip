import { NextResponse } from "next/server";
import { BlogPost } from "@/types/blog";

// Mock in-memory data store
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

export async function GET(request: Request) {
  // Simulate fetching posts for the current tripper
  // In a real app, you'd filter by authorId from session
  return NextResponse.json(mockBlogs);
}

export async function POST(request: Request) {
  const newPost: BlogPost = await request.json();
  newPost.id = (mockBlogs.length + 1).toString(); // Simple ID generation
  newPost.createdAt = new Date().toISOString();
  newPost.updatedAt = new Date().toISOString();
  mockBlogs.push(newPost);
  return NextResponse.json(newPost, { status: 201 });
}
