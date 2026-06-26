export interface ImageSizeResult {
  valid: boolean;
  width: number;
  height: number;
}

export function validateImageSize(
  file: File,
  minWidth: number,
  minHeight: number,
): Promise<ImageSizeResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: img.naturalWidth >= minWidth && img.naturalHeight >= minHeight,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, width: 0, height: 0 });
    };
    img.src = url;
  });
}
