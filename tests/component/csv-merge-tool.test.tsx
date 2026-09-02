import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CsvMergeTool } from "@/tools/csv/merge/csv-merge-tool";

describe("CsvMergeTool", () => {
  function testFile(name: string, content: string) {
    const file = new File([content], name, { type: "text/csv" });
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => new TextEncoder().encode(content).buffer,
    });
    return file;
  }

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:merged"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => cleanup());

  it("selects, merges, previews and enables download", async () => {
    const user = userEvent.setup();
    render(<CsvMergeTool productId="00000000-0000-4000-8000-000000000001" />);
    const input = screen.getByTestId("csv-input");
    await user.upload(input, [
      testFile("January.csv", "name,sales\nA,100"),
      testFile("February.csv", "name,sales\nB,200"),
    ]);
    expect(screen.getByText("選択中のファイル（2件）")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "CSVを結合する" }));
    expect(await screen.findByText("処理結果：2件")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "結合CSVをダウンロード" })).toHaveAttribute("href", "blob:merged");
    await waitFor(() => expect(fetch).toHaveBeenCalled());
  });

  it("shows a header mismatch without enabling download", async () => {
    const user = userEvent.setup();
    render(<CsvMergeTool />);
    await user.upload(screen.getByTestId("csv-input"), [
      testFile("a.csv", "name,sales\nA,100"),
      testFile("b.csv", "sales,name\n200,B"),
    ]);
    await user.click(screen.getByRole("button", { name: "CSVを結合する" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("列構造");
    expect(screen.queryByRole("link", { name: "結合CSVをダウンロード" })).not.toBeInTheDocument();
  });
});
