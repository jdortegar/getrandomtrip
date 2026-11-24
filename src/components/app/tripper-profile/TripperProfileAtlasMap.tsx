"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { WORLD_MAP_SIZE, groupPlacesByCountry, projectToWorldMap } from "@/lib/helpers/tripperPublicProfile";
import type { TripperPublicProfileDict } from "@/lib/types/dictionary";
import type { TripperProfilePlace } from "@/types/tripper";

interface TripperProfileAtlasMapProps {
  copy: TripperPublicProfileDict["atlas"];
  countryName: (countryCode: string) => string;
  /** Turns on drag-to-pan and wheel zoom; off by default so the page scrolls past the map. */
  isInteractive: boolean;
  label: string;
  onSelectCountry: (countryCode: string) => void;
  places: TripperProfilePlace[];
  selectedCountry: string | null;
}

interface Camera {
  k: number;
  x: number;
  y: number;
}

interface WorldMapData {
  paths: { d: string; id: string }[];
}

const MAP_URL = "/maps/world-110m.json";
const HOME: Camera = { k: 1, x: WORLD_MAP_SIZE.width / 2, y: WORLD_MAP_SIZE.height / 2 };
const MIN_ZOOM = 1;
const ZOOM_BUTTON_CLASS =
  "flex h-9 w-9 items-center justify-center text-ink transition-colors hover:bg-ground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary disabled:opacity-40";
/** On-screen marker size relative to the desktop design (1 = 18px radius at 1px per unit). */
const MARKER_PX_SCALE = 0.9;
const MAX_ZOOM = 8;

let mapDataPromise: Promise<WorldMapData> | null = null;

/** Fetches the country outlines once per page and shares them between maps. */
function loadWorldMap(): Promise<WorldMapData> {
  mapDataPromise ??= fetch(MAP_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`world map ${response.status}`);
      return response.json() as Promise<WorldMapData>;
    })
    .catch((error) => {
      mapDataPromise = null;
      throw error;
    });
  return mapDataPromise;
}

/** Minimum distance between country markers, in map units (marker diameter + gap). */
const MARKER_SPACING = 40;

/** Pushes overlapping country markers apart (e.g. Argentina and Chile) so both stay readable. */
function separateMarkers<T extends { x: number; y: number }>(markers: T[]): T[] {
  const placed: T[] = [];
  for (const marker of markers) {
    const next = { ...marker };
    for (const other of placed) {
      const dx = next.x - other.x;
      const dy = next.y - other.y;
      const distance = Math.hypot(dx, dy);
      if (distance < MARKER_SPACING) {
        const angle = distance === 0 ? 0 : Math.atan2(dy, dx);
        next.x = other.x + Math.cos(angle) * MARKER_SPACING;
        next.y = other.y + Math.sin(angle) * MARKER_SPACING;
      }
    }
    placed.push(next);
  }
  return placed;
}

function clampZoom(k: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));
}

function cameraFor(points: { x: number; y: number }[]): Camera {
  if (points.length === 0) return HOME;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const width = Math.max(...xs) - Math.min(...xs) + 80;
  const height = Math.max(...ys) - Math.min(...ys) + 80;
  return {
    k: clampZoom(Math.min(WORLD_MAP_SIZE.width / width, WORLD_MAP_SIZE.height / height, 6)),
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
}

/**
 * Prototype atlas: Natural Earth outlines in a static SVG (no map tiles or
 * keys), numbered country markers that zoom into place dots.
 */
export function TripperProfileAtlasMap({
  copy,
  countryName,
  isInteractive,
  label,
  onSelectCountry,
  places,
  selectedCountry,
}: TripperProfileAtlasMapProps) {
  const [mapData, setMapData] = useState<WorldMapData | null>(null);
  const [manualCamera, setManualCamera] = useState<Camera | null>(null);
  const [size, setSize] = useState({ height: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ camera: Camera; pointerX: number; pointerY: number } | null>(null);

  const located = useMemo(
    () => places.filter((place) => place.coordinates).map((place) => ({ place, point: projectToWorldMap(place.coordinates!) })),
    [places],
  );
  const groups = useMemo(
    () =>
      separateMarkers(
        groupPlacesByCountry(located.map(({ place }) => place)).map((group) => {
          const points = located.filter(({ place }) => place.countryCode === group.countryCode).map(({ point }) => point);
          return {
            count: group.places.length,
            countryCode: group.countryCode,
            x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
            y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
          };
        }),
      ),
    [located],
  );
  const selectedPoints = useMemo(
    () => (selectedCountry ? located.filter(({ place }) => place.countryCode === selectedCountry) : []),
    [located, selectedCountry],
  );
  const autoCamera = useMemo(
    () => (selectedCountry ? cameraFor(selectedPoints.map(({ point }) => point)) : HOME),
    [selectedCountry, selectedPoints],
  );
  const [cameraKey, setCameraKey] = useState(selectedCountry);
  if (cameraKey !== selectedCountry) {
    setCameraKey(selectedCountry);
    setManualCamera(null);
  }
  const camera = manualCamera ?? autoCamera;
  /** Screen pixels per map unit — the whole world fits (meets) its frame. */
  const unitPx = size.width ? Math.min(size.width / WORLD_MAP_SIZE.width, size.height / WORLD_MAP_SIZE.height) : 1;
  /** Keeps markers the same on-screen size at any zoom and width. */
  const markerScale = MARKER_PX_SCALE / (camera.k * unitPx);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ height: entry.contentRect.height, width: entry.contentRect.width });
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadWorldMap()
      .then((data) => {
        if (!cancelled) setMapData(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  function zoomBy(factor: number) {
    setManualCamera({ ...camera, k: clampZoom(camera.k * factor) });
  }

  function toViewBoxDelta(dx: number, dy: number) {
    return { dx: dx / unitPx, dy: dy / unitPx };
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!isInteractive || (event.target as Element).closest("[data-marker]")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { camera, pointerX: event.clientX, pointerY: event.clientY };
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const { dx, dy } = toViewBoxDelta(event.clientX - drag.pointerX, event.clientY - drag.pointerY);
    setManualCamera({ ...drag.camera, x: drag.camera.x - dx / drag.camera.k, y: drag.camera.y - dy / drag.camera.k });
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleMarkerKey(event: KeyboardEvent<SVGGElement>, countryCode: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectCountry(countryCode);
    }
  }

  return (
    <div className="relative h-full w-full" data-component="TripperProfileAtlasMap" ref={wrapperRef}>
      <svg
        aria-label={label}
        className={isInteractive ? "h-full w-full cursor-grab touch-none active:cursor-grabbing" : "h-full w-full"}
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={(event) => {
          if (isInteractive) zoomBy(event.deltaY < 0 ? 1.25 : 0.8);
        }}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        viewBox={`0 0 ${WORLD_MAP_SIZE.width} ${WORLD_MAP_SIZE.height}`}
      >
        <g
          className="transition-transform duration-500 ease-out motion-reduce:transition-none"
          transform={`translate(${WORLD_MAP_SIZE.width / 2} ${WORLD_MAP_SIZE.height / 2}) scale(${camera.k}) translate(${-camera.x} ${-camera.y})`}
        >
          <g aria-hidden className="fill-secondary/70 stroke-white" strokeWidth={0.5 * markerScale}>
            {mapData?.paths.map((path, index) => (
              <path d={path.d} key={`${path.id}-${index}`} />
            ))}
          </g>
          {selectedCountry
            ? selectedPoints.map(({ place, point }) => (
                <circle
                  className="fill-primary stroke-white"
                  cx={point.x}
                  cy={point.y}
                  key={place.id}
                  r={5 * markerScale}
                  strokeWidth={2 * markerScale}
                >
                  <title>{place.city ?? countryName(place.countryCode)}</title>
                </circle>
              ))
            : groups.map((group) => {
                const name = interpolateTemplate(copy.countryMarker, {
                  count: String(group.count),
                  country: countryName(group.countryCode),
                });
                return (
                  <g
                    aria-label={name}
                    className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-feature"
                    data-marker
                    key={group.countryCode}
                    onClick={() => onSelectCountry(group.countryCode)}
                    onKeyDown={(event) => handleMarkerKey(event, group.countryCode)}
                    role="button"
                    tabIndex={0}
                    transform={`translate(${group.x} ${group.y}) scale(${markerScale})`}
                  >
                    <circle className="fill-primary stroke-white" r={18} strokeWidth={3} />
                    <text className="fill-white text-[15px] font-semibold" dominantBaseline="central" textAnchor="middle">
                      {group.count}
                    </text>
                  </g>
                );
              })}
        </g>
      </svg>
      <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-md bg-white shadow-md">
        <button aria-label={copy.zoomIn} className={ZOOM_BUTTON_CLASS} disabled={camera.k >= MAX_ZOOM} onClick={() => zoomBy(1.5)} type="button">
          <Plus aria-hidden className="h-4 w-4" />
        </button>
        <button aria-label={copy.zoomOut} className={ZOOM_BUTTON_CLASS} disabled={camera.k <= MIN_ZOOM} onClick={() => zoomBy(1 / 1.5)} type="button">
          <Minus aria-hidden className="h-4 w-4" />
        </button>
        <button aria-label={copy.zoomReset} className={ZOOM_BUTTON_CLASS} onClick={() => setManualCamera(HOME)} type="button">
          <RotateCcw aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
