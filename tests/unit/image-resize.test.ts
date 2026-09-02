import { describe, expect, it, vi } from "vitest";
import {
  calculateTargetDimensions,
  createImagesZip,
  createResizedFilename,
  ImageResizeError,
  processImages,
  validateImageFiles,
} from "@/tools/image/resize";

function imageFile(name: string, type: string, size = 100): File {
  const file = new File([new Uint8Array(1)], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

const renderer = vi.fn(async (file: File, width: number) => ({
  originalWidth: 2400,
  originalHeight: 1600,
  width,
  height: Math.round(width * 2 / 3),
  blob: new Blob([file.type], { type: file.type }),
}));

describe("画像一括リサイズの純粋ロジック", () => {
  it.each([
    ["photo.jpg", "image/jpeg", "photo-resized.jpg"],
    ["photo.jpeg", "image/jpeg", "photo-resized.jpeg"],
    ["photo.png", "image/png", "photo-resized.png"],
    ["photo.webp", "image/webp", "photo-resized.webp"],
  ])("JPEG・PNG・WebPの形式とファイル名を維持する", async (name, type, expectedName) => {
    const results = await processImages([imageFile(name, type), imageFile(`second.${name.split(".").pop()}`, type)], 1200, renderer);
    expect(results[0]).toMatchObject({ outputName: expectedName, mimeType: type, width: 1200, height: 800 });
  });

  it("2枚を入力順に処理する", async () => {
    const results = await processImages([imageFile("first.png", "image/png"), imageFile("second.png", "image/png")], 600, renderer);
    expect(results.map((result) => result.originalName)).toEqual(["first.png", "second.png"]);
  });

  it("10枚を処理できる", async () => {
    const files = Array.from({ length: 10 }, (_, index) => imageFile(`${index}.webp`, "image/webp"));
    await expect(processImages(files, 800, renderer)).resolves.toHaveLength(10);
  });

  it("ファイル数超過を拒否する", () => {
    const files = Array.from({ length: 11 }, (_, index) => imageFile(`${index}.png`, "image/png"));
    expect(() => validateImageFiles(files)).toThrow("10件まで");
  });

  it("1ファイル10MB超過を拒否する", () => {
    expect(() => validateImageFiles([imageFile("large.png", "image/png", 10 * 1024 * 1024 + 1), imageFile("ok.png", "image/png")])).toThrow("10MB");
  });

  it("合計50MB超過を拒否する", () => {
    const files = Array.from({ length: 6 }, (_, index) => imageFile(`${index}.jpg`, "image/jpeg", 9 * 1024 * 1024));
    expect(() => validateImageFiles(files)).toThrow("合計サイズ");
  });

  it.each([["animation.gif", "image/gif"], ["vector.svg", "image/svg+xml"], ["photo.heic", "image/heic"], ["fake.png", "image/jpeg"]])("非対応形式または拡張子偽装を拒否する", (name, type) => {
    expect(() => validateImageFiles([imageFile(name, type), imageFile("ok.png", "image/png")])).toThrow(ImageResizeError);
  });

  it("横幅指定から縦横比を維持し、拡大も許可する", () => {
    expect(calculateTargetDimensions(2400, 1600, 1200)).toEqual({ width: 1200, height: 800 });
    expect(calculateTargetDimensions(600, 400, 1200)).toEqual({ width: 1200, height: 800 });
  });

  it("拡張子がない場合も形式に対応する名前を生成する", () => {
    expect(createResizedFilename("photo", "image/png")).toBe("photo-resized.png");
  });

  it("結果をZIPへまとめる", async () => {
    const results = await processImages([imageFile("a.png", "image/png"), imageFile("b.png", "image/png")], 100, renderer);
    for (const result of results) Object.defineProperty(result.blob, "arrayBuffer", { value: async () => new Uint8Array([1, 2, 3]).buffer });
    const zip = await createImagesZip(results);
    expect(zip.type).toBe("application/zip");
    expect(zip.size).toBeGreaterThan(0);
  });
});
