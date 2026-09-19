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
                "background-color":
                  "#07131c",
              },
            },

            {
              id: "bathymetry",
              type: "raster",
              source: "bathymetry",

              paint: {
                "raster-opacity": 1,
                "raster-saturation": -0.15,
                "raster-contrast": 0.08,
                "raster-brightness-min": 0.08,
                "raster-brightness-max": 0.88,
              },
            },

            {
              id: "geographic-reference",
              type: "raster",
              source: "openStreetMap",

              paint: {
                "raster-opacity": 0.22,
                "raster-saturation": -0.85,
                "raster-contrast": 0.18,
                "raster-brightness-min": 0.18,
                "raster-brightness-max": 0.82,
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


        /*
         * Cancel an unfinished request if the user taps
         * somewhere else before it completes.
         */
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


          /*
           * Ignore a response belonging to an older tap.
           */
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
