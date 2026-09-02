import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageResizeTool } from "@/tools/image/resize/image-resize-tool";

function imageFile(name: string, type = "image/png") {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

describe("ImageResizeTool", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 2400, height: 1600, close: vi.fn() }));
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn((blob: Blob) => blob.type === "application/zip" ? "blob:zip" : `blob:image-${blob.type}`), revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback, type) => {
      const blob = new Blob([new Uint8Array([4, 5, 6])], { type: type ?? "image/png" });
      Object.defineProperty(blob, "arrayBuffer", { value: async () => new Uint8Array([4, 5, 6]).buffer });
      callback(blob);
    });
  });

  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("一覧・横幅・完了・プレビュー・ダウンロードを表示する", async () => {
    const user = userEvent.setup();
    render(<ImageResizeTool productId="00000000-0000-4000-8000-000000000002" />);
    await user.upload(screen.getByTestId("image-input"), [imageFile("one.png"), imageFile("two.png")]);
    expect(screen.getByText("選択中の画像（2件）")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("出力する横幅"));
    await user.type(screen.getByLabelText("出力する横幅"), "1200");
    await user.click(screen.getByRole("button", { name: "画像を一括リサイズ" }));
    expect(await screen.findByText("処理完了：2件")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "個別ダウンロード" })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "すべてZIPでダウンロード" })).toHaveAttribute("href", "blob:zip");
  });

  it("非対応形式のエラーを利用者向けに表示する", async () => {
    const user = userEvent.setup();
    render(<ImageResizeTool />);
    fireEvent.change(screen.getByTestId("image-input"), { target: { files: [imageFile("one.gif", "image/gif"), imageFile("two.png")] } });
    await user.click(screen.getByRole("button", { name: "画像を一括リサイズ" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("JPEG、PNG、WebP");
    expect(screen.queryByRole("link", { name: "すべてZIPでダウンロード" })).not.toBeInTheDocument();
  });
});
