export class Translator {
  constructor(options?: {
    from?: string;
    onProgress?: (info: { progress?: number; status: string }) => void;
    to?: string;
  });
  load(): Promise<void>;
  translate(
    text: string,
    options?: { from?: string; html?: boolean; to?: string },
  ): Promise<{ text: string }>;
}
