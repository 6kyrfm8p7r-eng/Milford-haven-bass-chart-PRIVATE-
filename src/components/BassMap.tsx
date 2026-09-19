"use client";

import { useEffect, useRef } from "react";
import maplibregl, {
  type Map as MapLibreMap,
} from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

import { MILFORD_HAVEN_REGION } from "@/config/region";


const OPENFREEMAP_VECTOR_SOURCE =
  "https://tiles.openfreemap.org/planet";


interface DepthApiResponse {
  ok: boolean;

  position?: {
    latitude: number;
    longitude: number;
  };

  depth?: {
    metres?: number;
    minimumMetres?: number;
    maximumMetres?: number;
    standardDeviationMetres?: number;
  };

  source?: {
    provider?: string;
    verticalDatum?: string;
  };

  error?: string;
}


function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function loadingPopupHtml(): string {
  return `
    <div style="
      min-width:150px;
      color:#f3f0e8;
      font-family:Inter,system-ui,sans-serif;
    ">
      <div style="
        color:#42a6c6;
        font-size:10px;
        font-weight:800;
        letter-spacing:.12em;
        text-transform:uppercase;
      ">
        Seabed sample
      </div>

      <div style="
        margin-top:6px;
        font-size:13px;
      ">
        Reading depth…
      </div>
    </div>
  `;
}


function depthPopupHtml(data: DepthApiResponse): string {
  const depth = data.depth?.metres;

  if (
    typeof depth !== "number" ||
    !Number.isFinite(depth)
  ) {
    return errorPopupHtml(
      "No usable depth was returned.",
    );
  }

  const datum =
    data.source?.verticalDatum ?? "unknown";

  const provider =
    data.source?.provider ??
    "EMODnet Bathymetry";

  return `
    <div style="
      min-width:170px;
      color:#f3f0e8;
      font-family:Inter,system-ui,sans-serif;
    ">
      <div style="
        color:#42a6c6;
        font-size:10px;
        font-weight:800;
        letter-spacing:.12em;
        text-transform:uppercase;
      ">
        Seabed depth
      </div>

      <div style="
        margin-top:4px;
        font-size:30px;
        line-height:1;
        font-weight:800;
      ">
        ${depth.toFixed(1)}
        <span style="
          font-size:13px;
          color:#aebbc3;
        ">
          m
        </span>
      </div>

      <div style="
        margin-top:8px;
        padding-top:7px;
        border-top:1px solid rgba(218,226,228,.12);
        color:#aebbc3;
        font-size:10px;
        line-height:1.45;
      ">
        ${escapeHtml(provider)}
        · ${escapeHtml(datum)}
      </div>

      <div style="
        margin-top:5px;
        color:#758690;
        font-size:9px;
      ">
        Fishing analysis only · Not for navigation
      </div>
    </div>
  `;
}


function errorPopupHtml(message: string): string {
  return `
    <div style="
      min-width:170px;
      color:#f3f0e8;
      font-family:Inter,system-ui,sans-serif;
    ">
      <div style="
        color:#b69a63;
        font-size:10px;
        font-weight:800;
        letter-spacing:.12em;
        text-transform:uppercase;
      ">
        Depth unavailable
      </div>

      <div style="
        margin-top:6px;
        color:#aebbc3;
        font-size:11px;
        line-height:1.45;
      ">
        ${escapeHtml(message)}
      </div>
    </div>
  `;
}


export default function BassMap() {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<MapLibreMap | null>(null);


  useEffect(() => {
    if (
      !containerRef.current ||
      mapRef.current
    ) {
      return;
    }

    const region =
      MILFORD_HAVEN_REGION;


    const map =
      new maplibregl.Map({
        container:
          containerRef.current,

        style: {
          version: 8,

          sources: {
            openMapTiles: {
              type: "vector",
              url:
                OPENFREEMAP_VECTOR_SOURCE,

              attribution:
                "© OpenStreetMap contributors · OpenFreeMap",
            },
          },

          layers: [
            // ------------------------------------------------
            // LAND
            //
            // Everything begins as land. Real water polygons
            // are then drawn above it.
            // ------------------------------------------------

            {
              id: "land-base",
              type: "background",

              paint: {
                "background-color":
                  "#173c32",
              },
            },


            // ------------------------------------------------
            // WATER
            //
            // OpenMapTiles water polygons provide the actual
            // coastline and inland-water geometry.
            //
            // This is intentionally a simple chart foundation.
            // Bathymetric depth styling comes next.
            // ------------------------------------------------

            {
              id: "water-base",
              type: "fill",
              source: "openMapTiles",
              "source-layer": "water",

              paint: {
                "fill-color":
                  "#79b7c7",

                "fill-opacity": 1,
              },
            },


            // ------------------------------------------------
            // SUBTLE LAND DETAIL
            // ------------------------------------------------

            {
              id: "landcover-detail",
              type: "fill",
              source: "openMapTiles",
              "source-layer": "landcover",

              paint: {
                "fill-color": [
                  "match",
                  ["get", "class"],

                  "wood",
                  "#103329",

                  "grass",
                  "#1c493a",

                  "farmland",
                  "#20483a",

                  "rock",
                  "#365149",

                  "sand",
                  "#626552",

                  "wetland",
                  "#17453b",

                  "#1c4438",
                ],

                "fill-opacity": 0.38,
              },
            },


            // ------------------------------------------------
            // LAND USE DETAIL
            // ------------------------------------------------

            {
              id: "landuse-detail",
              type: "fill",
              source: "openMapTiles",
              "source-layer": "landuse",

              paint: {
                "fill-color": [
                  "match",
                  ["get", "class"],

                  "residential",
                  "#294c42",

                  "industrial",
                  "#334f47",

                  "commercial",
                  "#304d44",

                  "military",
                  "#3c5044",

                  "#24473d",
                ],

                "fill-opacity": 0.24,
              },
            },


            // ------------------------------------------------
            // WATER AGAIN
            //
            // Redrawing water above terrestrial detail ensures
            // no landcover/landuse polygon can visually leak
            // into the sea.
            // ------------------------------------------------

            {
              id: "water-clean",
              type: "fill",
              source: "openMapTiles",
              "source-layer": "water",

              paint: {
                "fill-color":
                  "#79b7c7",

                "fill-opacity": 1,
              },
            },


            // ------------------------------------------------
            // COASTLINE
            // ------------------------------------------------

            {
              id: "coastline",
              type: "line",
              source: "openMapTiles",
              "source-layer": "water",

              filter: [
                "==",
                ["get", "class"],
                "ocean",
              ],

              paint: {
                "line-color":
                  "rgba(190, 225, 218, 0.72)",

                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],

                  8,
                  0.55,

                  12,
                  0.9,

                  16,
                  1.3,
                ],
              },
            },
          ],
        },

        center: [
          region.centre.longitude,
          region.centre.latitude,
        ],

        zoom:
          region.defaultZoom,

        minZoom:
          region.minZoom,

        maxZoom:
          region.maxZoom,

        maxBounds: [
          [
            region.bounds.west,
            region.bounds.south,
          ],

          [
            region.bounds.east,
            region.bounds.north,
          ],
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


    // --------------------------------------------------------
    // TAP / CLICK FOR LIVE EMODNET DEPTH
    // --------------------------------------------------------

    let activeController:
      AbortController | null = null;

    let activePopup:
      maplibregl.Popup | null = null;


    map.on(
      "click",
      async (event) => {
        const longitude =
          event.lngLat.lng;

        const latitude =
          event.lngLat.lat;


        activeController?.abort();

        const controller =
          new AbortController();

        activeController =
          controller;


        activePopup?.remove();

        const popup =
          new maplibregl.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: "240px",
          })
            .setLngLat(
              event.lngLat,
            )
            .setHTML(
              loadingPopupHtml(),
            )
            .addTo(map);

        activePopup =
          popup;


        try {
          const params =
            new URLSearchParams({
              lat:
                latitude.toFixed(6),

              lon:
                longitude.toFixed(6),
            });


          const response =
            await fetch(
              `/api/bathymetry/depth?${params.toString()}`,
              {
                signal:
                  controller.signal,
              },
            );


          const data =
            (await response.json()) as
              DepthApiResponse;


          if (
            controller !==
            activeController
          ) {
            return;
          }


          if (
            !response.ok ||
            !data.ok
          ) {
            popup.setHTML(
              errorPopupHtml(
                data.error ??
                  "Bathymetry data is unavailable here.",
              ),
            );

            return;
          }


          popup.setHTML(
            depthPopupHtml(data),
          );
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }


          if (
            controller !==
            activeController
          ) {
            return;
          }


          popup.setHTML(
            errorPopupHtml(
              "Unable to retrieve the seabed depth.",
            ),
          );
        }
      },
    );


    mapRef.current = map;


    return () => {
      activeController?.abort();
      activePopup?.remove();

      map.remove();

      mapRef.current = null;
    };
  }, []);


  return (
    <div
      ref={containerRef}
      aria-label="Interactive Pembrokeshire bass fishing chart"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
}
