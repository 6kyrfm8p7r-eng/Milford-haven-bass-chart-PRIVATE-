"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

import { MILFORD_HAVEN_REGION } from "@/config/region";

export default function BassMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const region = MILFORD_HAVEN_REGION;

    const map = new maplibregl.Map({
      container: containerRef.current,

      style: {
        version: 8,

        sources: {
          openStreetMap: {
            type: "raster",
            tiles: [
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
          },
        },

        layers: [
          {
            id: "background",
            type: "background",
            paint: {
              "background-color": "#07131c",
            },
          },
          {
            id: "openstreetmap",
            type: "raster",
            source: "openStreetMap",
            minzoom: 0,
            maxzoom: 19,
            paint: {
              "raster-opacity": 0.72,
              "raster-saturation": -0.55,
              "raster-contrast": 0.12,
              "raster-brightness-min": 0.12,
              "raster-brightness-max": 0.78,
            },
          },
        ],
      },

      center: [
        region.centre.longitude,
        region.centre.latitude,
      ],

      zoom: region.defaultZoom,
      minZoom: region.minZoom,
      maxZoom: region.maxZoom,

      maxBounds: [
        [region.bounds.west, region.bounds.south],
        [region.bounds.east, region.bounds.north],
      ],

      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }),
      "top-right",
    );

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
      }),
      "bottom-left",
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-label="Interactive bass fishing chart"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
}
