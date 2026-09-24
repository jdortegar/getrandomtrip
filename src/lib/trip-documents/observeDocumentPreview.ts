type Stage = "load" | "render" | "store" | "adopt" | "retire";
/** Diagnostics contain no IDs, paths, document content, URLs or exception text. */
export async function observeDocumentPreview<T>(
  stage: Stage,
  work: () => Promise<T>,
): Promise<T> {
  try {
    return await work();
  } catch (cause) {
    const error = cause instanceof Error ? cause : undefined;
    const code = error && "code" in error ? error.code : undefined;
    const storage = error?.name === "BlobsInternalError";
    // This SDK exposes HTTP status only in its message, not a response property.
    const match = storage
      ? error.message.match(/\b([45]\d{2}) status code\b/)
      : null;
    console.error(
      "[document-preview]",
      JSON.stringify({
        stage,
        category: storage
          ? "storage"
          : code === "P2028"
            ? "database_transaction"
            : "unexpected",
        ...(match ? { status: Number(match[1]) } : {}),
      }),
    );
    throw cause;
  }
}

export function isDocumentStorageAuthorizationError(cause: unknown): boolean {
  return (
    cause instanceof Error &&
    cause.name === "BlobsInternalError" &&
    /\b(401|403) status code\b/.test(cause.message)
  );
}
