import type { DesignSystemDict } from "@/lib/types/dictionary";

interface GalleryLlmsDocumentProps {
  copy: DesignSystemDict;
  href: string;
  markdown: string;
}

export function GalleryLlmsDocument({
  copy,
  href,
  markdown,
}: GalleryLlmsDocumentProps) {
  return (
    <section
      className="rt-container pb-16"
      data-agent-docs
      id="ai-rules"
    >
      <h2 className="font-semibold text-ink text-sm">{copy.agentDocs}</h2>
      <p className="mt-2 text-neutral-600 text-sm">{copy.agentDocsBody}</p>
      <p className="mt-2">
        <a className="font-mono text-primary text-sm underline" href={href}>
          {href}
        </a>
      </p>
      <pre className="bg-white border border-gray-200 font-mono max-h-96 mt-6 overflow-auto p-4 rounded-xl text-ink text-xs whitespace-pre-wrap">
        {markdown}
      </pre>
    </section>
  );
}
