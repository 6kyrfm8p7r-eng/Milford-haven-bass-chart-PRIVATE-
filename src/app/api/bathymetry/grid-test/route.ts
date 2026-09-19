import { NextResponse } from "next/server";

import {
  buildEmodnetCoverageRequest,
  fetchEmodnetBathymetryCoverage,
} from "@/services/providers/emodnetGrid";

import {
  decodeBathymetryGeoTiff,
} from "@/lib/geotiffBathymetry";


export const runtime = "nodejs";

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const bounds = {
      west: -5.12,
      south: 51.68,
      east: -5.08,
      north: 51.71,
    };


    const resolutionDegrees =
      0.00208333;


    const request =
      buildEmodnetCoverageRequest({
        bounds,
        resolutionDegrees,
      });


    const startedAt =
      Date.now();


    const buffer =
      await fetchEmodnetBathymetryCoverage({
        bounds,
        resolutionDegrees,
      });


    const downloadMilliseconds =
      Date.now() - startedAt;


    const decodeStartedAt =
      Date.now();


    const grid =
      await decodeBathymetryGeoTiff(
        buffer,
      );


    const decodeMilliseconds =
      Date.now() - decodeStartedAt;


    /*
     * Only return a small sample of cells.
     *
     * The complete raster remains server-side. Once we have
     * verified the values, a later endpoint will transform the
     * grid into chart-ready depth bands rather than shipping the
     * raw raster to the browser.
     */
    const sampleValues =
      grid.values
        .filter(
          (
            value,
          ): value is number =>
            value !== null,
        )
        .slice(0, 20);


    return NextResponse.json({
      ok: true,

      test:
        "EMODnet decoded bathymetry grid",

      source: {
        coverage:
          request.coverage,

        coordinateReferenceSystem:
          request.coordinateReferenceSystem,

        format:
          request.format,

        bytes:
          buffer.byteLength,
      },

      request: {
        bounds,
        resolutionDegrees,
      },

      grid: {
        width:
          grid.width,

        height:
          grid.height,

        cellCount:
          grid.width *
          grid.height,

        bounds:
          grid.bounds,
      },

      statistics:
        grid.statistics,

      sampleElevationMetres:
        sampleValues,

      timing: {
        downloadMilliseconds,
        decodeMilliseconds,

        totalMilliseconds:
          Date.now() - startedAt,
      },

      interpretation:
        "Negative elevations represent submerged seabed. Their absolute value is approximately the water depth in metres.",

      disclaimer:
        "Fishing analysis only. Not for navigation.",
    });
  } catch (error) {
    console.error(
      "EMODnet decoded grid test failed:",
      error,
    );


    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Unknown bathymetry decoding error.",

        disclaimer:
          "Fishing analysis only. Not for navigation.",
      },
      {
        status: 502,
      },
    );
  }
}
