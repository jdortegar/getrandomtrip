import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ExcuseSummary } from "../ExcuseSummary";

const excuse = {
  title: "Beach Escape",
  refineDetails: [
    { key: "a", label: "Snorkeling" },
    { key: "b", label: "Sunset walks" },
  ],
};

describe("ExcuseSummary", () => {
  it("renders nothing when there is no excuse", () => {
    expect(
      renderToStaticMarkup(
        <ExcuseSummary excuse={null} label="Excuse" refineLabel="Details" />,
      ),
    ).toBe("");
  });

  it("renders the title and refine details as read-only chips (full)", () => {
    const html = renderToStaticMarkup(
      <ExcuseSummary excuse={excuse} label="Excuse" refineLabel="Details" />,
    );
    expect(html).toContain("Excuse:");
    expect(html).toContain("Beach Escape");
    expect(html).toContain("Details:");
    expect(html).toContain(">Snorkeling</span>");
    expect(html).toContain(">Sunset walks</span>");
    expect(html).toContain("rounded-[6px]");
  });

  it("omits the details row when there are no refine details", () => {
    const html = renderToStaticMarkup(
      <ExcuseSummary
        excuse={{ title: "Beach Escape", refineDetails: [] }}
        label="Excuse"
        refineLabel="Details"
      />,
    );
    expect(html).not.toContain("Details:");
  });

  it("renders a single caption line in the inline variant", () => {
    const html = renderToStaticMarkup(
      <ExcuseSummary
        excuse={excuse}
        label="Excuse"
        refineLabel="Details"
        variant="inline"
      />,
    );
    expect(html).toContain("Excuse: Beach Escape");
    expect(html).not.toContain("Snorkeling");
  });
});
