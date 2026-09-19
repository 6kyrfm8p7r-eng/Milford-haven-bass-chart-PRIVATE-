import { NextResponse } from "next/server";

import {
  buildEmodnetCoverageRequest,
  fetchEmodnetBathymetryCoverage,
} from "@/services/providers/emodnetGrid";


export const runtime = "nodejs";

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    /*
     * Small test box inside Milford Haven.
     *
     * Deliberately small so we're proving the WCS connection
     * without requesting the entire Pembrokeshire dataset.
     */
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


    const elapsedMilliseconds =
      Date.now() - startedAt;


    /*
     * TIFF files normally begin with one of:
     *
     * 49 49 2A 00  -> little-endian TIFF
     * 4D 4D 00 2A  -> big-endian TIFF
     *
     * We expose the first four bytes purely as a diagnostic.
     */
    const firstBytes =
      Array.from(
        new Uint8Array(
          buffer.slice(0, 4),
        ),
      );


    const isTiff =
      (
        firstBytes[0] === 0x49 &&
        firstBytes[1] === 0x49 &&
        firstBytes[2] === 0x2a &&
        firstBytes[3] === 0x00
      ) ||
      (
        firstBytes[0] === 0x4d &&
        firstBytes[1] === 0x4d &&
        firstBytes[2] === 0x00 &&
        firstBytes[3] === 0x2a
      );


    return NextResponse.json({
      ok: true,

      test:
        "EMODnet WCS bathymetry coverage",

      bounds,

      resolutionDegrees,

      coverage:
        request.coverage,

      coordinateReferenceSystem:
        request.coordinateReferenceSystem,

      format:
        request.format,

      response: {
        bytes:
          buffer.byteLength,

        firstBytes,

        isTiff,

        elapsedMilliseconds,
      },

      message:
        isTiff
          ? "Valid TIFF signature received from EMODnet."
          : "A response was received, but it does not have a standard TIFF signature.",

      disclaimer:
        "Fishing analysis only. Not for navigation.",
    });
  } catch (error) {
    console.error(
      "EMODnet grid test failed:",
      error,
    );


    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Unknown EMODnet grid error.",

        disclaimer:
          "Fishing analysis only. Not for navigation.",
      },
      {
        status: 502,
      },
    );
  }
}
