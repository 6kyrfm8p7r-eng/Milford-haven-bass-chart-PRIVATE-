"use client";

import { useEffect, useRef } from "react";
import maplibregl, {
  type Map as MapLibreMap,
} from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

import { MILFORD_HAVEN_REGION } from "@/config/region";
import { EMODNET_BATHYMETRY } from "@/services/providers/emodnetBathymetry";


const EMODNET_BATHYMETRY_TILES =
  "https://tiles.emodnet-bathymetry.eu/2020/baselayer/web_mercator/{z}/{x}/{y}.png";

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


function escapeHtml(
  value: string,
): string {
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


function depthPopupHtml(
  data: DepthApiResponse,
): string {
  const depth =
    data.depth?.metres;

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


function errorPopupHtml(
  message: string,
): string {
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
            bathymetry: {
              type: "raster",

              tiles: [
                EMODNET_BATHYMETRY_TILES,
              ],

              tileSize: 256,

              attribution:
                EMODNET_BATHYMETRY.attribution,
            },

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
            // BASE
            // ------------------------------------------------

            {
              id: "background",
              type: "background",

              paint: {
                /*
                 * This is also our fallback land colour.
                 */
                "background-color":
                  "#173c32",
              },
            },


            // ------------------------------------------------
            // EMODNET
            //
            // The bathymetry raster is rendered first.
            // Real land geometry is then placed above it.
            // ------------------------------------------------

            {
              id: "bathymetry",
              type: "raster",
              source: "bathymetry",

              paint: {
                "raster-opacity": 1,
                "raster-saturation": -0.08,
                "raster-contrast": 0.12,
                "raster-brightness-min": 0.1,
                "raster-brightness-max": 0.9,
              },
            },


            // ------------------------------------------------
            // LAND MASK
            //
            // OpenMapTiles supplies water polygons rather than
            // requiring us to invent a coastline.
            //
            // We use those real water polygons as the marine
            // geography reference and place the surrounding
            // terrestrial appearance above the bathymetry.
            // ------------------------------------------------

            {
              id: "water-geography",
              type: "fill",
              source: "openMapTiles",
              "source-layer": "water",

              paint: {
                /*
                 * Almost transparent.
                 *
                 * EMODnet remains visually dominant over water,
                 * while this layer gives us real water geometry
                 * for the coastline.
                 */
                "fill-color":
                  "#5bb6d6",

                "fill-opacity": 0.04,
              },
            },


            // ------------------------------------------------
            // LAND COVER
            // ------------------------------------------------

            {
              id: "landcover",
              type: "fill",
              source: "openMapTiles",
              "source-layer": "landcover",

              paint: {
                "fill-color": [
                  "match",
                  ["get", "class"],

                  "wood",
                  "#12372c",

                  "grass",
                  "#1b4638",

                  "farmland",
                  "#1d4437",

                  "rock",
                  "#29483e",

                  "sand",
                  "#40594a",

                  "wetland",
                  "#173f36",

                  "#193f34",
                ],

                "fill-opacity": 0.72,
              },
            },


            // ------------------------------------------------
            // LAND USE
            // ------------------------------------------------

            {
              id: "landuse",
              type: "fill",
              source: "openMapTiles",
              "source-layer": "landuse",

              paint: {
                "fill-color": [
                  "match",
                  ["get", "class"],

                  "residential",
                  "#23483d",

                  "industrial",
                  "#294b42",

                  "commercial",
                  "#294b42",

                  "military",
                  "#34483d",

                  "#1d4237",
                ],

                "fill-opacity": 0.48,
              },
            },


            // ------------------------------------------------
            // COASTLINE / WATER EDGE
            //
            // The water polygons themselves provide the real
            // geographic boundary.
            // ------------------------------------------------

            {
              id: "water-edge",
              type: "line",
              source: "openMapTiles",
              "source-layer": "water",

              paint: {
                "line-color":
                  "rgba(169, 213, 210, 0.52)",

                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],

                  8,
                  0.45,

                  12,
                  0.85,

                  16,
                  1.2,
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
    // TAP / CLICK FOR DEPTH
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
