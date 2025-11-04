"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Video, Type, Quote, Link as LinkIcon, PlusCircle, Save, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import type { BlogPost } from "@/types/blog";

interface BlogComposerProps {
  post: Partial<BlogPost>;
  mode: "create" | "edit";
}

export default function BlogComposer({ post: initialPost, mode }: BlogComposerProps) {
  const router = useRouter();
  const [post, setPost] = useState<Partial<BlogPost>>(initialPost);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [format, setFormat] = useState<"article" | "photo" | "video" | "mixed">("article");
  const [status, setStatus] = useState<"draft" | "published">(initialPost.status || "draft");
  const [tags, setTags] = useState<string[]>(initialPost.tags || []);
  const [tagInput, setTagInput] = useState("");

  // Save function - saves as draft
  const handleSave = async () => {
    if (!post.title) {
      toast.error("El título es requerido");
      return;
    }

    setSaving(true);
    try {
      const postData = {
        ...post,
        format,
        status: "draft",
        tags,
        blocks: post.blocks || [],
      };

      if (mode === "create") {
        const response = await fetch("/api/tripper/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });

        if (response.ok) {
          const data = await response.json();
          toast.success("Post guardado como borrador");
          router.push(`/dashboard/tripper/blogs/${data.blog.id}`);
        } else {
          const error = await response.json();
          toast.error(error.error || "Error al guardar el post");
        }
      } else {
        const response = await fetch(`/api/tripper/blogs/${post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });

        if (response.ok) {
          toast.success("Post actualizado");
        } else {
          const error = await response.json();
          toast.error(error.error || "Error al actualizar el post");
        }
      }
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Error al guardar el post");
    } finally {
      setSaving(false);
    }
  };

  // Publish function
  const handlePublish = async () => {
    if (!post.title) {
      toast.error("El título es requerido");
      return;
    }

    setPublishing(true);
    try {
      const postData = {
        ...post,
        format,
        status: "published",
        tags,
        blocks: post.blocks || [],
        publishedAt: new Date().toISOString(),
      };

      if (mode === "create") {
        const response = await fetch("/api/tripper/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });

        if (response.ok) {
          const data = await response.json();
          toast.success("Post publicado exitosamente");
          router.push(`/dashboard/tripper/blogs/${data.blog.id}`);
        } else {
          const error = await response.json();
          toast.error(error.error || "Error al publicar el post");
        }
      } else {
        const response = await fetch(`/api/tripper/blogs/${post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });

        if (response.ok) {
          toast.success("Post publicado exitosamente");
        } else {
          const error = await response.json();
          toast.error(error.error || "Error al publicar el post");
        }
      }
    } catch (error) {
      console.error("Error publishing post:", error);
      toast.error("Error al publicar el post");
    } finally {
      setPublishing(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const addBlock = (type: string) => {
    const newBlock: any = { type };
    if (type === "paragraph") {
      newBlock.text = "";
    } else if (type === "image" || type === "video") {
      newBlock.url = "";
      newBlock.caption = "";
    } else if (type === "embed") {
      newBlock.provider = "youtube";
      newBlock.url = "";
    } else if (type === "quote") {
      newBlock.text = "";
      newBlock.cite = "";
    }

    setPost({
      ...post,
      blocks: [...(post.blocks || []), newBlock],
    });
  };

  const updateBlock = (index: number, updates: any) => {
    const newBlocks = [...(post.blocks || [])];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    setPost({ ...post, blocks: newBlocks });
  };

  const removeBlock = (index: number) => {
    const newBlocks = [...(post.blocks || [])];
    newBlocks.splice(index, 1);
    setPost({ ...post, blocks: newBlocks });
  };

  // AI assist function
  const handleAiAssist = async () => {
    setAiSuggestions({ titles: ["Sugerencia 1", "Sugerencia 2"], rewrites: ["Reescritura 1", "Reescritura 2"] });
    // In a real app, call /api/ai/blog-assist
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-neutral-100 rounded-2xl overflow-hidden shadow-lg">
      {/* Col A: Media & Blocks Palette */}
      <div className="w-72 bg-neutral-900 p-4 flex flex-col text-white">
        <h3 className="text-lg font-semibold mb-4">Bloques & Media</h3>
        <div className="space-y-3">
          <button
            onClick={() => addBlock("paragraph")}
            className="w-full flex items-center p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <Type size={20} className="mr-3" /> Texto
          </button>
          <button
            onClick={() => addBlock("image")}
            className="w-full flex items-center p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <ImageIcon size={20} className="mr-3" /> Imagen
          </button>
          <button
            onClick={() => addBlock("video")}
            className="w-full flex items-center p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <Video size={20} className="mr-3" /> Video
          </button>
          <button
            onClick={() => addBlock("embed")}
            className="w-full flex items-center p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <LinkIcon size={20} className="mr-3" /> Embed
          </button>
          <button
            onClick={() => addBlock("quote")}
            className="w-full flex items-center p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <Quote size={20} className="mr-3" /> Cita
          </button>
        </div>
        <div className="mt-auto pt-4 border-t border-neutral-700">
          <h4 className="text-sm font-semibold mb-2">Media Tray</h4>
          <div className="h-24 bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-500 text-xs">
            Miniaturas de media aquí
          </div>
        </div>
      </div>

      {/* Col B: Lienzo del Post */}
      <div className="flex-1 bg-white p-8 overflow-y-auto">
        {/* Top actions */}
        <div className="sticky top-0 bg-white pb-4 z-10 border-b border-neutral-200 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm text-neutral-500">Tripper OS / {mode === "create" ? "Crear Post" : "Editar Post"}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-neutral-500">
                {saving ? "Guardando..." : publishing ? "Publicando..." : "Sin guardar"}
              </span>
              <button
                onClick={handleSave}
                disabled={saving || publishing}
                className="px-3 py-1.5 text-sm rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={16} /> Guardar
              </button>
            </div>
          </div>
          <input
            type="text"
            placeholder="Título del Post"
            className="w-full text-4xl font-bold font-serif mt-4 mb-2 outline-none border-none bg-transparent"
            value={post.title || ""}
            onChange={(e) => setPost({ ...post, title: e.target.value })}
          />
          <input
            type="text"
            placeholder="Subtítulo (opcional)"
            className="w-full text-xl font-semibold mb-4 outline-none border-none bg-transparent"
            value={post.subtitle || ""}
            onChange={(e) => setPost({ ...post, subtitle: e.target.value })}
          />
        </div>

        {/* Blocks */}
        <div className="space-y-4">
          {post.blocks?.map((block: any, index: number) => (
            <div key={index} className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 relative group">
              <button
                onClick={() => removeBlock(index)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 transition-opacity"
              >
                <X size={16} className="text-red-600" />
              </button>
              
              {block.type === "paragraph" && (
                <textarea
                  value={block.text || ""}
                  onChange={(e) => updateBlock(index, { text: e.target.value })}
                  placeholder="Escribe tu párrafo aquí..."
                  className="w-full min-h-[100px] p-2 border border-neutral-300 rounded bg-white resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              )}
              
              {block.type === "image" && (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={block.url || ""}
                    onChange={(e) => updateBlock(index, { url: e.target.value })}
                    placeholder="URL de la imagen"
                    className="w-full p-2 border border-neutral-300 rounded bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={block.caption || ""}
                    onChange={(e) => updateBlock(index, { caption: e.target.value })}
                    placeholder="Descripción de la imagen (opcional)"
                    className="w-full p-2 border border-neutral-300 rounded bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  {block.url && (
                    <img src={block.url} alt={block.caption || ""} className="w-full rounded-lg" />
                  )}
                </div>
              )}
              
              {block.type === "video" && (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={block.url || ""}
                    onChange={(e) => updateBlock(index, { url: e.target.value })}
                    placeholder="URL del video"
                    className="w-full p-2 border border-neutral-300 rounded bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={block.caption || ""}
                    onChange={(e) => updateBlock(index, { caption: e.target.value })}
                    placeholder="Descripción del video (opcional)"
                    className="w-full p-2 border border-neutral-300 rounded bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </div>
              )}
              
              {block.type === "embed" && (
                <div className="space-y-2">
                  <select
                    value={block.provider || "youtube"}
                    onChange={(e) => updateBlock(index, { provider: e.target.value })}
                    className="w-full p-2 border border-neutral-300 rounded bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="map">Mapa</option>
                    <option value="other">Otro</option>
                  </select>
                  <input
                    type="url"
                    value={block.url || ""}
                    onChange={(e) => updateBlock(index, { url: e.target.value })}
                    placeholder="URL del embed"
                    className="w-full p-2 border border-neutral-300 rounded bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </div>
              )}
              
              {block.type === "quote" && (
                <div className="space-y-2">
                  <textarea
                    value={block.text || ""}
                    onChange={(e) => updateBlock(index, { text: e.target.value })}
                    placeholder="Texto de la cita"
                    className="w-full min-h-[80px] p-2 border border-neutral-300 rounded bg-white resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={block.cite || ""}
                    onChange={(e) => updateBlock(index, { cite: e.target.value })}
                    placeholder="Autor de la cita (opcional)"
                    className="w-full p-2 border border-neutral-300 rounded bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Col C: Assistant & Settings */}
      <div className="w-96 bg-neutral-50 p-4 flex flex-col border-l border-neutral-200">
        <h3 className="text-lg font-semibold mb-4">Asistente IA & Ajustes</h3>
        <div className="flex-1 space-y-6">
          {/* AI Assist Panel */}
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <h4 className="font-semibold mb-2">Asistente de Contenido</h4>
            <button onClick={handleAiAssist} className="rt-btn rt-btn--secondary rt-btn--sm w-full"><Sparkles size={16} className="mr-2"/> Generar Sugerencias</button>
            {aiSuggestions && (
              <div className="mt-4 text-sm">
                <p className="font-medium">Títulos Sugeridos:</p>
                <ul className="list-disc list-inside">
                  {aiSuggestions.titles.map((t: string) => <li key={t}>{t}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Post Settings */}
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <h4 className="font-semibold mb-2">Ajustes del Post</h4>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Formato</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full p-2 border border-neutral-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="article">Artículo</option>
              <option value="photo">Foto</option>
              <option value="video">Video</option>
              <option value="mixed">Mixto</option>
            </select>
            <label className="block text-sm font-medium text-neutral-700 mt-3 mb-1">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full p-2 border border-neutral-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Agregar tag"
                  className="flex-1 p-2 border border-neutral-300 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 bg-neutral-200 hover:bg-neutral-300 rounded-lg transition-colors"
                >
                  <PlusCircle size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-blue-900">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-4 border-t border-neutral-200 flex flex-col space-y-2">
          <button
            onClick={handlePublish}
            disabled={saving || publishing}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing ? "Publicando..." : "Publicar"}
          </button>
          {post.id && post.id !== 'new' && (
            <button
              onClick={() => router.push(`/dashboard/tripper/blogs/${post.id}/preview`)}
              className="w-full px-4 py-2 bg-neutral-200 hover:bg-neutral-300 rounded-lg transition-colors"
            >
              Previsualizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
