"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, Video, Type, Quote, Link as LinkIcon, PlusCircle, Save, Sparkles } from "lucide-react";
import { BlogPost } from "@/types/blog";

interface BlogComposerProps {
  post: Partial<BlogPost>;
  mode: "create" | "edit";
}

export default function BlogComposer({ post: initialPost, mode }: BlogComposerProps) {
  const [post, setPost] = useState<Partial<BlogPost>>(initialPost);
  const [saving, setSaving] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null); // Mock AI suggestions

  // Mock save function
  const handleSave = () => {
    setSaving(true);
    console.log("Saving post:", post);
    setTimeout(() => setSaving(false), 1500);
  };

  // Mock AI assist function
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
          <button className="w-full flex items-center p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors">
            <Type size={20} className="mr-3" /> Texto
          </button>
          <button className="w-full flex items-center p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors">
            <ImageIcon size={20} className="mr-3" /> Imagen
          </button>
          <button className="w-full flex items-center p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors">
            <Video size={20} className="mr-3" /> Video
          </button>
          <button className="w-full flex items-center p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors">
            <LinkIcon size={20} className="mr-3" /> Embed
          </button>
          <button className="w-full flex items-center p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors">
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
              <span className="text-xs text-neutral-500">{saving ? "Guardando..." : "Guardado hace 10s"}</span>
              <button onClick={handleSave} className="rt-btn rt-btn--ghost rt-btn--sm"><Save size={16} /> Guardar</button>
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
            <div key={index} className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              {block.type === "paragraph" && <p>{block.text}</p>}
              {/* More block types here */}
            </div>
          ))}
          <button className="w-full border-2 border-dashed border-neutral-300 rounded-lg p-4 text-neutral-500 hover:text-neutral-700 hover:border-neutral-400 transition-colors flex items-center justify-center">
            <PlusCircle size={20} className="mr-2" /> Añadir Bloque
          </button>
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
            <select className="w-full p-2 border border-neutral-300 rounded-lg">
              <option>Artículo</option>
              <option>Foto</option>
              <option>Video</option>
              <option>Mixto</option>
            </select>
            <label className="block text-sm font-medium text-neutral-700 mt-3 mb-1">Estado</label>
            <select className="w-full p-2 border border-neutral-300 rounded-lg">
              <option>Borrador</option>
              <option>Publicado</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-4 border-t border-neutral-200 flex flex-col space-y-2">
          <button className="rt-btn rt-btn--primary">Publicar</button>
          <button className="rt-btn rt-btn--ghost">Previsualizar</button>
        </div>
      </div>
    </div>
  );
}
