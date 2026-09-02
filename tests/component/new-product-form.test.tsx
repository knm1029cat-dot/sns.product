import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NewProductForm } from "@/components/admin/new-product-form";
import { imageResizeSpecification } from "@/tools/image/resize/spec";

describe("NewProductForm", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock); });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("少ない入力から仕様を生成し、人間の承認後だけDRAFT登録する", async () => {
    const draft = { ...imageResizeSpecification, slug: "image-compress", name: "画像一括圧縮" };
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ specification: draft }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ productId: "product-1", files: { "product-development/image-compress/SPEC.md": "spec" }, checklist: { dbDraft: true, registry: false } }), { status: 200 }));
    const user = userEvent.setup();
    render(<NewProductForm />);
    await user.type(screen.getByLabelText("商品名 *"), "画像一括圧縮");
    await user.click(screen.getByRole("button", { name: "Product Specification初稿を生成" }));
    expect((await screen.findByLabelText("Product Specification") as HTMLTextAreaElement).value).toContain("image-compress");
    expect(fetch).toHaveBeenCalledTimes(1);
    const editor = screen.getByLabelText("Product Specification");
    await user.clear(editor); await user.type(editor, "invalid");
    await user.click(screen.getByRole("button", { name: "この仕様で進める" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("有効なJSON");
    expect(fetch).toHaveBeenCalledTimes(1);
    fireEvent.change(editor, { target: { value: JSON.stringify(draft) } });
    await user.click(screen.getByRole("button", { name: "この仕様で進める" }));
    expect(await screen.findByText("DRAFT登録完了")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

});
