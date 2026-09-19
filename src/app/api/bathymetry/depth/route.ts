import { NextRequest, NextResponse } from "next/server";

import type { Coordinate } from "@/types/fishing";

import {
  getEMODnetDepth,
} from "@/services/providers/emodnetDepth";


// ============================================================
// Milford Haven Bass Chart
// Bathymetry depth API
// ============================================================
//
// Browser:
//
//   /api/bathymetry/depth?lat=51.68&lon=-5.18
//
// Server:
//
//   validates coordinates
//        ↓
//   queries EMODnet
//        ↓
//   normalises the response
//        ↓
//   returns our own stable JSON format
//
// EMODnet remains the source of the bathymetric information.
// This endpoint must not be used for navigation.
// ============================================================


export const runtime = "nodejs";

export const dynamic = "force-dynamic";


function parseCoordinate(
  value: string | null,
): number | null {
  if (value === null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}


export async function GET(
  request: NextRequest,
) {
  const latitude = parseCoordinate(
    request.nextUrl.searchParams.get("lat"),
  );

  const longitude = parseCoordinate(
    request.nextUrl.searchParams.get("lon"),
  );


  // ----------------------------------------------------------
  // Validate request
  // ----------------------------------------------------------

  if (
    latitude === null ||
    longitude === null
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Both lat and lon query parameters are required.",
      },
      {
        status: 400,
      },
    );
  }


  if (
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Latitude or longitude is outside the valid geographic range.",
      },
      {
        status: 400,
      },
    );
  }


  const position: Coordinate = {
    latitude,
    longitude,
  };


  // ----------------------------------------------------------
  // Query EMODnet
  // ----------------------------------------------------------

  try {
    const result =
      await getEMODnetDepth(position);

    return NextResponse.json(
      {
        ok: true,

        position,

        depth: {
          metres:
            result.averageDepthMetres,

          minimumMetres:
            result.minimumDepthMetres,

          maximumMetres:
            result.maximumDepthMetres,

          standardDeviationMetres:
            result.standardDeviationMetres,

          smoothedMetres:
            result.smoothedDepthMetres,

          smoothedOffsetMetres:
            result.smoothedOffsetMetres,
        },

        source: {
          provider: "EMODnet Bathymetry",

          verticalDatum:
            result.sample.verticalDatum,

          reference:
            result.reference,

          elementarySurfaces:
            result.elementarySurfaces,
        },

        retrievedAt:
          result.retrievedAt,

        navigationSafe: false,
      },
      {
        status: 200,

        headers: {
          /*
           * A modest cache prevents repeated clicks on the same
           * area hammering the upstream service.
           *
           * Bathymetry is static enough that five minutes is
           * extremely conservative.
           */
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown bathymetry provider error.";

    console.error(
      "Bathymetry depth request failed:",
      message,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Bathymetry data is currently unavailable.",
      },
      {
        status: 502,
      },
    );
  }
}
