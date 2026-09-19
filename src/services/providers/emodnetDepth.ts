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
// This service retrieves NUMERICAL DTM depth information that
// can later feed:
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
  const averageDepthMetres =
    finiteNumber(raw.avg);

  if (averageDepthMetres === undefined) {
    throw new Error(
      "EMODnet returned no usable average depth.",
    );
  }

  if (averageDepthMetres < 0) {
    throw new Error(
      "EMODnet returned an unexpected negative water depth.",
    );
  }

  const minimumDepthMetres =
    finiteNumber(raw.min);

  const maximumDepthMetres =
    finiteNumber(raw.max);

  const standardDeviationMetres =
    finiteNumber(raw.stdev);

  const elementarySurfaces =
    finiteNumber(raw.elementarySurfaces);

  const smoothedDepthMetres =
    finiteNumber(raw.smoothed);

  const smoothedOffsetMetres =
    finiteNumber(raw.smoothedOffset);

  const retrievedAt =
    new Date().toISOString();

  const sample: BathymetrySample = {
    position,

    depthMetres: averageDepthMetres,

    verticalDatum: "LAT",

    source: "EMODnet Bathymetry DTM",

    /*
     * Do not hard-code a resolution here.
     *
     * EMODnet combines source datasets and may provide
     * higher-resolution regional products. Resolution should
     * be attached when we know which dataset/grid supplied
     * the analysis.
     */
    resolutionMetres: undefined,

    /*
     * We cannot infer interpolation solely from the point
     * response, so leave this unknown rather than inventing it.
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

  const response = await fetch(
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
