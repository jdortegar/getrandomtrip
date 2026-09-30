// @vitest-environment node
import { readFile } from "node:fs/promises";
import { expect, it, vi } from "vitest";
import { renderActivityVoucher } from "../renderActivityVoucher";
import { renderDinnerVoucher } from "../renderDinnerVoucher";
import { renderExperienceRoadmap } from "../renderExperienceRoadmap";
import { renderHotelVoucher } from "../renderHotelVoucher";
import { renderXsedRoadmap } from "../renderXsedRoadmap";
import {
  activityFixture,
  dinnerFixture,
  experienceFixture,
  hotelFixture,
  xsedFixture,
} from "./referenceFixtures";

it.each([
  { document: hotelFixture, generate: renderHotelVoucher },
  { document: dinnerFixture, generate: renderDinnerVoucher },
  { document: activityFixture, generate: renderActivityVoucher },
  { document: xsedFixture, generate: renderXsedRoadmap },
  { document: experienceFixture, generate: renderExperienceRoadmap },
])(
  "embeds the approved local logo in $document.template",
  async ({ document, generate }) => {
    const approved = await readFile("public/assets/logos/logo_pdf.png");
    const render = vi.fn().mockResolvedValue(Buffer.from("%PDF-test"));

    expect((await generate(document, render)).ok).toBe(true);

    const { html } = render.mock.calls[0][0];
    expect(
      html.includes(
        `href="data:image/png;base64,${approved.toString("base64")}"`,
      ),
    ).toBe(true);
    expect(html).toContain("img-src data:");
  },
);
