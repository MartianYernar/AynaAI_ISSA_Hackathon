export type WorkspaceImageAttachment = {
  id: string;
  mimeType: string;
  dataBase64: string;
  previewUrl: string;
};

const MAX_SIDE = 1280;
const MAX_ATTACHMENTS = 4;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

export async function fileToWorkspaceImage(
  file: File,
): Promise<WorkspaceImageAttachment> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  const previewUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(previewUrl);
    let { width, height } = img;
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height, 1));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas is not available");
    }
    ctx.drawImage(img, 0, 0, width, height);

    const usePng =
      file.type === "image/png" ||
      file.type === "image/webp" ||
      file.type === "image/gif";
    const mimeType = usePng ? file.type : "image/jpeg";
    const quality = mimeType === "image/jpeg" ? 0.85 : undefined;

    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob((b) => res(b), mimeType, quality),
    );
    if (!blob) {
      throw new Error("Could not compress image");
    }

    const dataBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const s = String(reader.result ?? "");
        const comma = s.indexOf(",");
        resolve(comma >= 0 ? s.slice(comma + 1) : s);
      };
      reader.onerror = () => reject(new Error("Could not read image"));
      reader.readAsDataURL(blob);
    });

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      mimeType,
      dataBase64,
      previewUrl,
    };
  } catch (err) {
    URL.revokeObjectURL(previewUrl);
    throw err;
  }
}

export function maxAttachments(): number {
  return MAX_ATTACHMENTS;
}
