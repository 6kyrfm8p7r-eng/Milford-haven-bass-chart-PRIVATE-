import type { Coordinate } from "@/types/fishing";

export const EMODNET_BATHYMETRY = {
  id: "emodnet-bathymetry",
  name: "EMODnet Bathymetry",

  attribution:
    "European Marine Observation and Data Network (EMODnet) Bathymetry",

  services: {
    wms: "https://ows.emodnet-bathymetry.eu/wms",
    wmtsCapabilities:
      "https://tiles.emodnet-bathymetry.eu/wmts/1.0.0/WMTSCapabilities.xml",
    wcs: "https://ows.emodnet-bathymetry.eu/wcs",
    rest: "https://rest.emodnet-bathymetry.eu/",
  },

  coordinateSystems: {
    geographic: "EPSG:4326",
    webMercator: "EPSG:3857",
  },

  /**
   * The harmonised DTM is suitable for regional bathymetric
   * analysis, but its source resolution must never be presented
   * as if it were high-resolution sonar data.
   */
  limitations: {
    navigationCertified: false,
    reefScaleAccuracyGuaranteed: false,
  },
} as const;

export interface BathymetryPointRequest {
  position: Coordinate;
}

export interface BathymetryPointResult {
  position: Coordinate;

  /**
   * Depth/elevation in metres as returned by the source.
   *
   * Do not assume the sign convention until the response
   * from the selected EMODnet service has been normalised.
   */
  rawElevationMetres: number;

  /**
   * Normalised water depth used internally by the fishing model.
   * Positive values represent depth below the reference surface.
   */
  depthMetres: number;

  provider: typeof EMODNET_BATHYMETRY.id;

  retrievedAt: string;
}

export interface BathymetryDataQuality {
  provider: typeof EMODNET_BATHYMETRY.id;

  /**
   * Resolution of the underlying source where known.
   * This must be carried into derived fishing features so the
   * application never implies more seabed precision than exists.
   */
  sourceResolutionMetres?: number;

  /**
   * True only when a higher-resolution source has explicitly
   * supplied the value.
   */
  highResolution: boolean;

  suitableForNavigation: false;
}

export function createBathymetryQuality(
  sourceResolutionMetres?: number,
): BathymetryDataQuality {
  return {
    provider: EMODNET_BATHYMETRY.id,
    sourceResolutionMetres,
    highResolution: false,
    suitableForNavigation: false,
  };
}

export function normaliseBathymetryElevation(
  rawElevationMetres: number,
): number {
  if (!Number.isFinite(rawElevationMetres)) {
    throw new Error("Bathymetry elevation must be a finite number.");
  }

  /*
   * EMODnet-derived data can enter the application through
   * different service representations.
   *
   * Internally we store WATER DEPTH as a positive number.
   * A negative seabed elevation therefore becomes positive depth.
   *
   * Positive source values are retained as zero depth here until
   * a provider-specific land/water classification is available.
   */
  return Math.max(0, -rawElevationMetres);
}

export function createBathymetryPointResult(
  position: Coordinate,
  rawElevationMetres: number,
): BathymetryPointResult {
  return {
    position,
    rawElevationMetres,
    depthMetres: normaliseBathymetryElevation(rawElevationMetres),
    provider: EMODNET_BATHYMETRY.id,
    retrievedAt: new Date().toISOString(),
  };
}
