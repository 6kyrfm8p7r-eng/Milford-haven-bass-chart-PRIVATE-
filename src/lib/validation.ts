import { z } from "zod";


// ============================================================
// Milford Haven Bass Chart
// Runtime validation
// ============================================================
//
// TypeScript protects us while writing code.
//
// Zod protects us at runtime when data enters the application
// from:
//
// - manual catch entry
// - imported backups
// - GPS / track imports
// - external environmental providers
// - future migrations
//
// Raw fishing observations should be validated BEFORE storage.
// ============================================================


// ============================================================
// BASIC TYPES
// ============================================================

export const idSchema = z.string().min(1);

export const isoDateTimeSchema = z.iso.datetime({
  offset: true,
});

export const latitudeSchema = z
  .number()
  .finite()
  .min(-90)
  .max(90);

export const longitudeSchema = z
  .number()
  .finite()
  .min(-180)
  .max(180);

export const coordinateSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});


// ============================================================
// COMMON NUMERIC HELPERS
// ============================================================

const nonNegativeNumber = z.number().finite().min(0);

const percentageSchema = z.number().finite().min(0).max(100);

const zeroToOneSchema = z.number().finite().min(0).max(1);

const bearingSchema = z.number().finite().min(0).max(360);


// ============================================================
// PROVENANCE
// ============================================================

export const dataProvenanceSchema = z.object({
  provider: z.string().min(1),
  source: z.string().optional(),
  model: z.string().optional(),

  retrievedAt: isoDateTimeSchema,
  validAt: isoDateTimeSchema.optional(),

  resolutionMetres: nonNegativeNumber.optional(),

  confidence: zeroToOneSchema.optional(),

  notes: z.string().optional(),
});


// ============================================================
// LURE / PRESENTATION
// ============================================================

export const lureCategorySchema = z.enum([
  "soft-plastic",
  "hard-lure",
  "metal",
  "surface",
  "other",
]);

export const retrieveStyleSchema = z.enum([
  "steady",
  "slow",
  "fast",
  "sink-and-draw",
  "twitch",
  "jerk",
  "vertical",
  "dead-drift",
  "other",
]);

export const lurePresentationSchema = z.object({
  category: lureCategorySchema.optional(),

  manufacturer: z.string().optional(),
  model: z.string().optional(),
  colour: z.string().optional(),

  lengthMm: nonNegativeNumber.optional(),
  weightGrams: nonNegativeNumber.optional(),
  jigHeadWeightGrams: nonNegativeNumber.optional(),

  retrieve: retrieveStyleSchema.optional(),

  notes: z.string().optional(),
});


// ============================================================
// BASS CATCH
// ============================================================

export const bassCatchSchema = z.object({
  id: idSchema,

  position: coordinateSchema,
  caughtAt: isoDateTimeSchema,

  lengthCm: nonNegativeNumber.optional(),
  weightKg: nonNegativeNumber.optional(),

  lure: lurePresentationSchema.optional(),

  fishingDepthMetres: nonNegativeNumber.optional(),

  notes: z.string().optional(),
  photoId: idSchema.optional(),

  tripId: idSchema.optional(),
  driftId: idSchema.optional(),
  effortId: idSchema.optional(),

  environmentId: idSchema.optional(),
  structureId: idSchema.optional(),

  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});


// ============================================================
// FISHING TRIP
// ============================================================

export const fishingTripSchema = z
  .object({
    id: idSchema,

    startedAt: isoDateTimeSchema,
    endedAt: isoDateTimeSchema.optional(),

    launchPosition: coordinateSchema.optional(),
    launchName: z.string().optional(),

    vesselName: z.string().optional(),

    notes: z.string().optional(),

    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .refine(
    (trip) =>
      !trip.endedAt ||
      Date.parse(trip.endedAt) >= Date.parse(trip.startedAt),
    {
      message: "Trip end time cannot be before trip start time.",
      path: ["endedAt"],
    },
  );


// ============================================================
// FISHING EFFORT
// ============================================================

export const effortMethodSchema = z.enum([
  "drift",
  "anchored",
  "trolling",
  "casting",
  "shoreline",
  "other",
]);

export const fishingEffortSchema = z
  .object({
    id: idSchema,

    tripId: idSchema.optional(),

    startedAt: isoDateTimeSchema,
    endedAt: isoDateTimeSchema,

    method: effortMethodSchema,

    startPosition: coordinateSchema.optional(),
    endPosition: coordinateSchema.optional(),

    catchCount: z.number().int().min(0),

    lure: lurePresentationSchema.optional(),

    notes: z.string().optional(),

    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .refine(
    (effort) =>
      Date.parse(effort.endedAt) >= Date.parse(effort.startedAt),
    {
      message: "Fishing effort end time cannot be before start time.",
      path: ["endedAt"],
    },
  );


// ============================================================
// DRIFT
// ============================================================

export const driftTrackPointSchema = z.object({
  position: coordinateSchema,
  recordedAt: isoDateTimeSchema,
  depthMetres: nonNegativeNumber.optional(),
});

export const driftSchema = z
  .object({
    id: idSchema,

    tripId: idSchema.optional(),
    effortId: idSchema.optional(),

    startedAt: isoDateTimeSchema,
    endedAt: isoDateTimeSchema.optional(),

    track: z.array(driftTrackPointSchema),

    averageSpeedKnots: nonNegativeNumber.optional(),
    averageBearingDegrees: bearingSchema.optional(),

    notes: z.string().optional(),
  })
  .refine(
    (drift) =>
      !drift.endedAt ||
      Date.parse(drift.endedAt) >= Date.parse(drift.startedAt),
    {
      message: "Drift end time cannot be before drift start time.",
      path: ["endedAt"],
    },
  );


// ============================================================
// TIDE
// ============================================================

export const tidalDirectionSchema = z.enum([
  "flood",
  "ebb",
  "slack",
  "unknown",
]);

export const tideTurningPointSchema = z.object({
  type: z.enum(["HW", "LW"]),

  time: isoDateTimeSchema,

  heightMetres: z.number().finite().optional(),
});

export const tideStateSchema = z.object({
  position: coordinateSchema,

  observedAt: isoDateTimeSchema,

  heightMetres: z.number().finite().optional(),

  direction: tidalDirectionSchema,

  previousTurningPoint: tideTurningPointSchema.optional(),
  nextTurningPoint: tideTurningPointSchema.optional(),

  minutesFromPreviousTurningPoint:
    nonNegativeNumber.optional(),

  minutesToNextTurningPoint:
    nonNegativeNumber.optional(),

  rangeMetres: nonNegativeNumber.optional(),

  halfCycleProgress: zeroToOneSchema.optional(),

  cyclePosition: zeroToOneSchema.optional(),

  springNeapIndex: zeroToOneSchema.optional(),

  provenance: z.array(dataProvenanceSchema),
});


// ============================================================
// TIDAL STREAM
// ============================================================

export const tidalStreamStateSchema = z.object({
  position: coordinateSchema,

  observedAt: isoDateTimeSchema,

  speedKnots: nonNegativeNumber.optional(),

  directionDegrees: bearingSchema.optional(),

  phase: z
    .enum([
      "building",
      "peak",
      "easing",
      "slack",
      "unknown",
    ])
    .optional(),

  provenance: z.array(dataProvenanceSchema),
});


// ============================================================
// WEATHER
// ============================================================

export const weatherStateSchema = z.object({
  position: coordinateSchema,

  observedAt: isoDateTimeSchema,

  airTemperatureC: z.number().finite().optional(),

  windSpeedKnots: nonNegativeNumber.optional(),
  windGustKnots: nonNegativeNumber.optional(),

  windDirectionDegrees: bearingSchema.optional(),

  pressureHpa: nonNegativeNumber.optional(),

  cloudCoverPercent: percentageSchema.optional(),

  precipitationMm: nonNegativeNumber.optional(),

  visibilityMetres: nonNegativeNumber.optional(),

  provenance: z.array(dataProvenanceSchema),
});


// ============================================================
// SEA STATE
// ============================================================

export const seaStateSchema = z.object({
  position: coordinateSchema,

  observedAt: isoDateTimeSchema,

  seaSurfaceTemperatureC:
    z.number().finite().optional(),

  waveHeightMetres: nonNegativeNumber.optional(),
  waveDirectionDegrees: bearingSchema.optional(),
  wavePeriodSeconds: nonNegativeNumber.optional(),

  swellHeightMetres: nonNegativeNumber.optional(),
  swellDirectionDegrees: bearingSchema.optional(),
  swellPeriodSeconds: nonNegativeNumber.optional(),

  secondarySwellHeightMetres:
    nonNegativeNumber.optional(),

  secondarySwellDirectionDegrees:
    bearingSchema.optional(),

  secondarySwellPeriodSeconds:
    nonNegativeNumber.optional(),

  provenance: z.array(dataProvenanceSchema),
});


// ============================================================
// LIGHT
// ============================================================

export const lightPhaseSchema = z.enum([
  "night",
  "astronomical-twilight",
  "nautical-twilight",
  "civil-twilight",
  "daylight",
]);

export const lightStateSchema = z.object({
  observedAt: isoDateTimeSchema,

  position: coordinateSchema,

  phase: lightPhaseSchema,

  sunAltitudeDegrees: z.number().finite().optional(),

  sunAzimuthDegrees: bearingSchema.optional(),

  sunrise: isoDateTimeSchema.optional(),
  sunset: isoDateTimeSchema.optional(),

  minutesFromSunrise: z.number().finite().optional(),
  minutesFromSunset: z.number().finite().optional(),

  relativeLightIndex: zeroToOneSchema.optional(),
});


// ============================================================
// STRUCTURE / BATHYMETRY
// ============================================================

export const seabedTypeSchema = z.enum([
  "rock",
  "reef",
  "sand",
  "gravel",
  "mud",
  "mixed",
  "unknown",
]);

export const structureTypeSchema = z.enum([
  "flat",
  "reef",
  "reef-edge",
  "drop-off",
  "ledge",
  "gully",
  "pinnacle",
  "bank",
  "channel",
  "sand-rock-transition",
  "shoreline",
  "unknown",
]);

export const structureStateSchema = z.object({
  position: coordinateSchema,

  depthMetres: nonNegativeNumber.optional(),

  seabed: seabedTypeSchema.optional(),
  structure: structureTypeSchema.optional(),

  slopeDegrees:
    z.number().finite().min(0).max(90).optional(),

  aspectDegrees: bearingSchema.optional(),

  relativeReliefMetres:
    z.number().finite().optional(),

  roughnessIndex:
    nonNegativeNumber.optional(),

  distanceToDepthBreakMetres:
    nonNegativeNumber.optional(),

  distanceToShoreMetres:
    nonNegativeNumber.optional(),

  provenance: z.array(dataProvenanceSchema),
});


// ============================================================
// ENVIRONMENTAL SNAPSHOT
// ============================================================

export const environmentalSnapshotSchema = z.object({
  id: idSchema,

  position: coordinateSchema,

  observedAt: isoDateTimeSchema,

  tide: tideStateSchema.optional(),
  tidalStream: tidalStreamStateSchema.optional(),
  weather: weatherStateSchema.optional(),
  sea: seaStateSchema.optional(),
  light: lightStateSchema.optional(),

  createdAt: isoDateTimeSchema,
});


// ============================================================
// PRIVATE MARK
// ============================================================

export const fishingMarkSchema = z.object({
  id: idSchema,

  name: z.string().min(1),

  position: coordinateSchema,

  structureType: structureTypeSchema.optional(),

  notes: z.string().optional(),

  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});


// ============================================================
// VALIDATION HELPERS
// ============================================================

export function validateBassCatch(
  value: unknown,
) {
  return bassCatchSchema.parse(value);
}

export function validateFishingTrip(
  value: unknown,
) {
  return fishingTripSchema.parse(value);
}

export function validateFishingEffort(
  value: unknown,
) {
  return fishingEffortSchema.parse(value);
}

export function validateDrift(
  value: unknown,
) {
  return driftSchema.parse(value);
}

export function validateEnvironmentalSnapshot(
  value: unknown,
) {
  return environmentalSnapshotSchema.parse(value);
}

export function validateFishingMark(
  value: unknown,
) {
  return fishingMarkSchema.parse(value);
}
