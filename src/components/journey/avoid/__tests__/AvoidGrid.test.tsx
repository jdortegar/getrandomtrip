import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import AvoidGrid from "../AvoidGrid";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const labels = {
  loading: "Cargando ciudades...",
  empty: "No hay sugerencias de destinos para esta ruta",
  otherDestinationsButton: "Otros destinos",
  searchModal: {
    addButton: "Agregar",
    cancelButton: "Cancelar",
    saveDestinationsButton: "Guardar",
    selectedCountTemplate: "{count} seleccionados",
    selectedDestinationsHeading: "Seleccionados",
    title: "Buscar",
  },
};

describe("AvoidGrid", () => {
  it("renders the empty-state message (not the loading message) when getAvoidCities resolves with no results", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <AvoidGrid
          experienceLevel="modo-explora"
          labels={labels}
          originCity="Nowhere"
          originCountry="Nowhereland"
          showImages={false}
        />,
      );
    });

    expect(container.textContent).toContain(labels.empty);
    expect(container.textContent).not.toContain(labels.loading);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
