export interface WatermarkOptions {
  text?: string;
  fontSize?: number;
  color?: string;
  opacity?: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片加载失败，请检查图片是否支持跨域访问"));
    image.src = src;
  });
}

export async function downloadImageWithWatermark(
  imageUrl: string,
  options: WatermarkOptions = {},
  filename?: string,
): Promise<void> {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("当前浏览器不支持图片处理");
  }

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  context.drawImage(image, 0, 0);

  const text = options.text ?? "© 567手游店";
  const fontSize = options.fontSize ?? Math.max(36, canvas.width * 0.08);

  context.save();
  context.globalAlpha = options.opacity ?? 0.5;
  context.fillStyle = options.color ?? "#fff";
  context.font = `700 ${fontSize}px sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = "rgba(0, 0, 0, 0.35)";
  context.shadowBlur = 8;
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  context.restore();

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename ?? `watermarked-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
