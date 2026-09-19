/**
 * EMODnet Bathymetry gridded-data provider.
 *
 * Retrieves a real bathymetric coverage from EMODnet's WCS.
 * This is separate from the point-depth REST provider used when
 * the user taps the chart.
 *
 * Fishing analysis only — not for navigation.
 */

const EMODNET_WCS_URL =
  "https://ows.emodnet-bathymetry.eu/wcs";

const EMODNET_COVERAGE =
  "emodnet:mean";

const DEFAULT_RESOLUTION_DEGREES =
  0.00208333;


export interface BathymetryGridBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}


export interface BathymetryGridRequest {
  bounds: BathymetryGridBounds;

  /**
   * Grid resolution in decimal degrees.
   *
   * EMODnet's documented example uses approximately
   * 1/8 arc minute: 0.00208333 degrees.
   */
  resolutionDegrees?: number;
}


export interface BathymetryCoverageRequest {
  url: string;

  bounds: BathymetryGridBounds;

  resolutionDegrees: number;

  coverage: string;

  format: "image/tiff";

  coordinateReferenceSystem: "EPSG:4326";
}


function assertFiniteNumber(
  value: number,
  name: string,
): void {
  if (!Number.isFinite(value)) {
    throw new Error(
      `${name} must be a finite number.`,
    );
  }
}


function validateBounds(
  bounds: BathymetryGridBounds,
): void {
  assertFiniteNumber(
    bounds.west,
    "West longitude",
  );

  assertFiniteNumber(
    bounds.east,
    "East longitude",
  );

  assertFiniteNumber(
    bounds.south,
    "South latitude",
  );

  assertFiniteNumber(
    bounds.north,
    "North latitude",
  );


  if (
    bounds.west < -180 ||
    bounds.west > 180 ||
    bounds.east < -180 ||
    bounds.east > 180
  ) {
    throw new Error(
      "Longitude must be between -180 and 180 degrees.",
    );
  }


  if (
    bounds.south < -90 ||
    bounds.south > 90 ||
    bounds.north < -90 ||
    bounds.north > 90
  ) {
    throw new Error(
      "Latitude must be between -90 and 90 degrees.",
    );
  }


  if (bounds.west >= bounds.east) {
    throw new Error(
      "West longitude must be less than east longitude.",
    );
  }


  if (bounds.south >= bounds.north) {
    throw new Error(
      "South latitude must be less than north latitude.",
    );
  }
}


function validateResolution(
  resolutionDegrees: number,
): void {
  assertFiniteNumber(
    resolutionDegrees,
    "Bathymetry resolution",
  );


  if (resolutionDegrees <= 0) {
    throw new Error(
      "Bathymetry resolution must be greater than zero.",
    );
  }


  if (resolutionDegrees > 0.05) {
    throw new Error(
      "Bathymetry resolution is too coarse for this provider.",
    );
  }
}


/**
 * Creates the EMODnet WCS GetCoverage request.
 *
 * We deliberately keep URL construction isolated here so the
 * rest of the application does not depend on WCS query syntax.
 */
export function buildEmodnetCoverageRequest(
  request: BathymetryGridRequest,
): BathymetryCoverageRequest {
  const {
    bounds,
    resolutionDegrees =
      DEFAULT_RESOLUTION_DEGREES,
  } = request;


  validateBounds(bounds);

  validateResolution(
    resolutionDegrees,
  );


  const params =
    new URLSearchParams({
      service: "wcs",
      version: "1.0.0",
      request: "getcoverage",

      coverage:
        EMODNET_COVERAGE,

      crs:
        "EPSG:4326",

      BBOX: [
        bounds.west,
        bounds.south,
        bounds.east,
        bounds.north,
      ].join(","),

      format:
        "image/tiff",

      interpolation:
        "nearest",

      resx:
        resolutionDegrees.toString(),

      resy:
        resolutionDegrees.toString(),
    });


  return {
    url:
      `${EMODNET_WCS_URL}?${params.toString()}`,

    bounds,

    resolutionDegrees,

    coverage:
      EMODNET_COVERAGE,

    format:
      "image/tiff",

    coordinateReferenceSystem:
      "EPSG:4326",
  };
}


/**
 * Convenience request for our Pembrokeshire operating area.
 *
 * This includes a margin around the application's present
 * navigation bounds so derived contours/structure do not stop
 * exactly at the visible chart edge.
 */
export function buildPembrokeshireBathymetryRequest():
  BathymetryCoverageRequest {
  return buildEmodnetCoverageRequest({
    bounds: {
      west: -5.4,
      south: 51.5,
      east: -4.8,
      north: 51.85,
    },
  });
}


/**
 * Fetches the raw GeoTIFF coverage.
 *
 * GeoTIFF decoding is intentionally NOT done here.
 * Keeping retrieval and raster processing separate makes the
 * provider testable and lets us later generate contours,
 * gradients and structure from the same source data.
 */
export async function fetchEmodnetBathymetryCoverage(
  request: BathymetryGridRequest,
  signal?: AbortSignal,
): Promise<ArrayBuffer> {
  const coverage =
    buildEmodnetCoverageRequest(
      request,
    );


  const response =
    await fetch(
      coverage.url,
      {
        signal,

        headers: {
          Accept:
            "image/tiff,application/geotiff,application/octet-stream",
        },

        cache:
          "force-cache",
      },
    );


  if (!response.ok) {
    throw new Error(
      `EMODnet WCS request failed with HTTP ${response.status}.`,
    );
  }


  const contentType =
    response.headers.get(
      "content-type",
    ) ?? "";


  if (
    contentType.includes(
      "xml",
    ) ||
    contentType.includes(
      "text/html",
    )
  ) {
    const message =
      await response.text();

    throw new Error(
      `EMODnet WCS returned an error document: ${message.slice(
        0,
        300,
      )}`,
    );
  }


  const buffer =
    await response.arrayBuffer();


  if (buffer.byteLength === 0) {
    throw new Error(
      "EMODnet WCS returned an empty bathymetry coverage.",
    );
  }


  return buffer;
}
