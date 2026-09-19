import type { Coordinate } from "@/types/fishing";

import type {
  BathymetrySample,
} from "@/lib/bathymetry";

import {
  EMODNET_BATHYMETRY,
} from "@/services/providers/emodnetBathymetry";


// ============================================================
// Milford Haven Bass Chart
// EMODnet numerical bathymetry adapter
// ============================================================
//
// This adapter is deliberately separate from the rendered
// EMODnet map tiles.
//
// The map tiles are for VISUALISATION.
//
// This service retrieves NUMERICAL DTM elevation information
// and converts underwater seabed elevation into positive water
// depth for use by the fishing application.
//
// Example:
//
//   EMODnet elevation: -24.6 m
//   App water depth:    24.6 m
//
// This can later feed:
//
// - depth labels
// - contours
// - gradients
// - slope analysis
// - banks and drop-offs
// - local highs / pinnacles
// - gullies / depressions
// - bass structure scoring
//
// It must not be used for navigation.
// ============================================================


const DEPTH_SAMPLE_ENDPOINT =
  `${EMODNET_BATHYMETRY.services.rest}depth_sample`;


// ============================================================
// RAW EMODNET RESPONSE
// ============================================================

interface EMODnetReference {
  organisation_id?: number;
  identifier?: string;
  type?: string;
  devices?: string;
}

export interface EMODnetDepthSampleResponse {
  min?: number | null;
  max?: number | null;
  avg?: number | null;
  stdev?: number | null;

  elementarySurfaces?: number | null;

  smoothed?: number | null;
  smoothedOffset?: number | null;

  reference?: EMODnetReference | null;
}


// ============================================================
// NORMALISED RESULT
// ============================================================

export interface EMODnetDepthResult {
  sample: BathymetrySample;

  minimumDepthMetres?: number;
  maximumDepthMetres?: number;
  averageDepthMetres: number;

  standardDeviationMetres?: number;

  elementarySurfaces?: number;

  smoothedDepthMetres?: number;
  smoothedOffsetMetres?: number;

  reference?: {
    organisationId?: number;
    identifier?: string;
    type?: string;
    devices?: string;
  };

  retrievedAt: string;
}


// ============================================================
// HELPERS
// ============================================================

function finiteNumber(
  value: number | null | undefined,
): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : undefined;
}


function validateCoordinate(
  position: Coordinate,
): void {
  if (
    !Number.isFinite(position.latitude) ||
    position.latitude < -90 ||
    position.latitude > 90
  ) {
    throw new Error(
      "Bathymetry latitude is invalid.",
    );
  }

  if (
    !Number.isFinite(position.longitude) ||
    position.longitude < -180 ||
    position.longitude > 180
  ) {
    throw new Error(
      "Bathymetry longitude is invalid.",
    );
  }
}


/**
 * Convert EMODnet seabed elevation into the application's
 * positive-water-depth convention.
 *
 * EMODnet bathymetric elevations below the vertical datum are
 * represented as negative values.
 *
 * Example:
 *
 *   -32.4 m elevation -> 32.4 m water depth
 *
 * Positive elevation represents terrain above the datum and is
 * therefore clamped to zero water depth.
 */
function elevationToWaterDepth(
  elevationMetres: number,
): number {
  return Math.max(
    0,
    -elevationMetres,
  );
}


export function buildEMODnetDepthSampleURL(
  position: Coordinate,
): URL {
  validateCoordinate(position);

  const url = new URL(
    DEPTH_SAMPLE_ENDPOINT,
  );

  /*
   * EMODnet expects WKT using:
   *
   * POINT(longitude latitude)
   *
   * not latitude/longitude order.
   */
  const point =
    `POINT(${position.longitude} ${position.latitude})`;

  url.searchParams.set(
    "geom",
    point,
  );

  return url;
}


// ============================================================
// RESPONSE NORMALISATION
// ============================================================

export function normaliseEMODnetDepthSample(
  position: Coordinate,
  raw: EMODnetDepthSampleResponse,
): EMODnetDepthResult {
  const rawAverageElevation =
    finiteNumber(raw.avg);

  if (rawAverageElevation === undefined) {
    throw new Error(
      "EMODnet returned no usable average bathymetry value.",
    );
  }


  // ----------------------------------------------------------
  // Average depth
  // ----------------------------------------------------------

  const averageDepthMetres =
    elevationToWaterDepth(
      rawAverageElevation,
    );


  // ----------------------------------------------------------
  // Minimum / maximum
  // ----------------------------------------------------------
  //
  // Important:
  //
  // Elevation:
  //
  //   min = -40
  //   max = -20
  //
  // becomes water depth:
  //
  //   minimum depth = 20
  //   maximum depth = 40
  //
  // Therefore the source min/max reverse when converted from
  // negative elevation to positive water depth.
  // ----------------------------------------------------------

  const rawMinimumElevation =
    finiteNumber(raw.min);

  const rawMaximumElevation =
    finiteNumber(raw.max);


  const minimumDepthMetres =
    rawMaximumElevation !== undefined
      ? elevationToWaterDepth(
          rawMaximumElevation,
        )
      : undefined;


  const maximumDepthMetres =
    rawMinimumElevation !== undefined
      ? elevationToWaterDepth(
          rawMinimumElevation,
        )
      : undefined;


  // ----------------------------------------------------------
  // Statistics
  // ----------------------------------------------------------

  const standardDeviationMetres =
    finiteNumber(raw.stdev);

  const elementarySurfaces =
    finiteNumber(raw.elementarySurfaces);


  // ----------------------------------------------------------
  // Smoothed elevation
  // ----------------------------------------------------------

  const rawSmoothedElevation =
    finiteNumber(raw.smoothed);

  const smoothedDepthMetres =
    rawSmoothedElevation !== undefined
      ? elevationToWaterDepth(
          rawSmoothedElevation,
        )
      : undefined;


  /*
   * Offset is a difference rather than an absolute elevation.
   * Keep the source value unchanged rather than incorrectly
   * treating it as a depth.
   */
  const smoothedOffsetMetres =
    finiteNumber(raw.smoothedOffset);


  const retrievedAt =
    new Date().toISOString();


  // ----------------------------------------------------------
  // Normalised bathymetry sample
  // ----------------------------------------------------------

  const sample: BathymetrySample = {
    position,

    depthMetres:
      averageDepthMetres,

    verticalDatum: "LAT",

    source:
      "EMODnet Bathymetry DTM",

    /*
     * Do not invent a fixed source resolution here.
     *
     * EMODnet combines multiple datasets. Resolution should be
     * attached when we know the actual grid/source used for the
     * requested location.
     */
    resolutionMetres: undefined,

    /*
     * The point response alone does not give us enough
     * information to state confidently whether this particular
     * value was interpolated.
     */
    interpolated: undefined,
  };


  return {
    sample,

    minimumDepthMetres,
    maximumDepthMetres,
    averageDepthMetres,

    standardDeviationMetres,

    elementarySurfaces,

    smoothedDepthMetres,
    smoothedOffsetMetres,

    reference: raw.reference
      ? {
          organisationId:
            raw.reference.organisation_id,

          identifier:
            raw.reference.identifier,

          type:
            raw.reference.type,

          devices:
            raw.reference.devices,
        }
      : undefined,

    retrievedAt,
  };
}


// ============================================================
// LIVE DEPTH REQUEST
// ============================================================

export async function getEMODnetDepth(
  position: Coordinate,
  signal?: AbortSignal,
): Promise<EMODnetDepthResult> {
  const url =
    buildEMODnetDepthSampleURL(position);


  const response =
    await fetch(
      url,
      {
        method: "GET",

        headers: {
          Accept: "application/json",
        },

        signal,
      },
    );


  if (!response.ok) {
    throw new Error(
      `EMODnet depth request failed: ${response.status}`,
    );
  }


  const raw =
    (await response.json()) as
      EMODnetDepthSampleResponse;


  return normaliseEMODnetDepthSample(
    position,
    raw,
  );
}
