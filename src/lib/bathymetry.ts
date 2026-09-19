import type { Coordinate } from "@/types/fishing";

export interface BathymetrySample {
  position: Coordinate;

  /**
   * Positive water depth in metres.
   */
  depthMetres: number;

  /**
   * Vertical datum used by the source.
   *
   * EMODnet's European DTM is normally referenced to LAT.
   */
  verticalDatum:
    | "LAT"
    | "MSL"
    | "unknown";

  source: string;

  /**
   * Approximate horizontal resolution of the source data.
   */
  resolutionMetres?: number;

  /**
   * True when the source indicates that the cell/value
   * was interpolated rather than directly supported by
   * source observations.
   */
  interpolated?: boolean;
}

export interface BathymetryGrid {
  samples: BathymetrySample[];

  spacingMetres: number;

  rows: number;
  columns: number;
}

export interface SeabedGradient {
  /**
   * Change in depth per metre horizontally.
   */
  gradient: number;

  /**
   * Approximate slope angle.
   */
  slopeDegrees: number;

  depthChangeMetres: number;
  horizontalDistanceMetres: number;
}

export type SeabedFeatureType =
  | "flat"
  | "gentle-slope"
  | "slope"
  | "steep-break"
  | "local-high"
  | "local-low"
  | "unknown";

export interface SeabedFeature {
  type: SeabedFeatureType;

  position: Coordinate;

  depthMetres: number;

  /**
   * 0–1 confidence in the derived feature.
   *
   * This is confidence in the classification, not a claim
   * about fishing success.
   */
  confidence: number;

  sourceResolutionMetres?: number;

  notes: string[];
}

const EARTH_RADIUS_METRES = 6_371_008.8;

function degreesToRadians(value: number): number {
  return value * (Math.PI / 180);
}

export function distanceMetres(
  start: Coordinate,
  end: Coordinate,
): number {
  const latitude1 = degreesToRadians(start.latitude);
  const latitude2 = degreesToRadians(end.latitude);

  const latitudeDifference =
    degreesToRadians(
      end.latitude - start.latitude,
    );

  const longitudeDifference =
    degreesToRadians(
      end.longitude - start.longitude,
    );

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(latitude1) *
      Math.cos(latitude2) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a),
    );

  return EARTH_RADIUS_METRES * c;
}

export function calculateGradient(
  first: BathymetrySample,
  second: BathymetrySample,
): SeabedGradient | null {
  const horizontalDistanceMetres =
    distanceMetres(
      first.position,
      second.position,
    );

  if (
    !Number.isFinite(horizontalDistanceMetres) ||
    horizontalDistanceMetres <= 0
  ) {
    return null;
  }

  const depthChangeMetres =
    second.depthMetres - first.depthMetres;

  const gradient =
    depthChangeMetres /
    horizontalDistanceMetres;

  const slopeDegrees =
    Math.atan(Math.abs(gradient)) *
    (180 / Math.PI);

  return {
    gradient,
    slopeDegrees,
    depthChangeMetres,
    horizontalDistanceMetres,
  };
}

export function classifySlope(
  slopeDegrees: number,
): SeabedFeatureType {
  if (!Number.isFinite(slopeDegrees)) {
    return "unknown";
  }

  if (slopeDegrees < 1) {
    return "flat";
  }

  if (slopeDegrees < 3) {
    return "gentle-slope";
  }

  if (slopeDegrees < 8) {
    return "slope";
  }

  return "steep-break";
}

export function estimateFeatureConfidence(
  samples: BathymetrySample[],
): number {
  if (samples.length === 0) {
    return 0;
  }

  let confidence = 1;

  const interpolatedCount =
    samples.filter(
      (sample) => sample.interpolated,
    ).length;

  const interpolatedFraction =
    interpolatedCount / samples.length;

  confidence -= interpolatedFraction * 0.25;

  const knownResolutions =
    samples
      .map((sample) => sample.resolutionMetres)
      .filter(
        (value): value is number =>
          typeof value === "number" &&
          Number.isFinite(value),
      );

  if (knownResolutions.length === 0) {
    confidence -= 0.15;
  }

  return Math.max(
    0,
    Math.min(1, confidence),
  );
}
