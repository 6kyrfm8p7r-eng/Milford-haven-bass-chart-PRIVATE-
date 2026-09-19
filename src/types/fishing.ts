// ============================================================
// Milford Haven Bass Chart
// Core fishing intelligence data model
// ============================================================
//
// IMPORTANT DESIGN PRINCIPLE
//
// Raw observations are immutable facts supplied by the angler.
// Environmental, tidal, structural and predictive information
// is derived separately and may be recalculated later.
//
// The application is currently purpose-built for European bass.
// ============================================================

export type ID = string;
export type ISODateTime = string;

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface DataProvenance {
  provider: string;
  source?: string;
  model?: string;
  retrievedAt: ISODateTime;
  validAt?: ISODateTime;
  resolutionMetres?: number;
  confidence?: number;
  notes?: string;
}

export type ConfidenceLevel =
  | "very-low"
  | "low"
  | "moderate"
  | "high"
  | "very-high";


// ============================================================
// BASS
// ============================================================

export interface BassCatch {
  id: ID;

  // Immutable observation
  position: Coordinate;
  caughtAt: ISODateTime;

  // Bass measurements
  lengthCm?: number;
  weightKg?: number;

  // Fishing method
  lure?: LurePresentation;

  // Optional angler observations
  fishingDepthMetres?: number;
  notes?: string;
  photoId?: ID;

  // Associations
  tripId?: ID;
  driftId?: ID;
  effortId?: ID;

  // Automatic enrichment
  environmentId?: ID;
  structureId?: ID;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}


// ============================================================
// LURE / PRESENTATION
// ============================================================

export type LureCategory =
  | "soft-plastic"
  | "hard-lure"
  | "metal"
  | "surface"
  | "other";

export type RetrieveStyle =
  | "steady"
  | "slow"
  | "fast"
  | "sink-and-draw"
  | "twitch"
  | "jerk"
  | "vertical"
  | "dead-drift"
  | "other";

export interface LurePresentation {
  category?: LureCategory;
  manufacturer?: string;
  model?: string;
  colour?: string;
  lengthMm?: number;
  weightGrams?: number;
  jigHeadWeightGrams?: number;
  retrieve?: RetrieveStyle;
  notes?: string;
}


// ============================================================
// TRIPS
// ============================================================

export interface FishingTrip {
  id: ID;
  startedAt: ISODateTime;
  endedAt?: ISODateTime;

  launchPosition?: Coordinate;
  launchName?: string;

  vesselName?: string;

  notes?: string;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}


// ============================================================
// FISHING EFFORT
//
// Blank fishing is important evidence.
// ============================================================

export type EffortMethod =
  | "drift"
  | "anchored"
  | "trolling"
  | "casting"
  | "shoreline"
  | "other";

export interface FishingEffort {
  id: ID;
  tripId?: ID;

  startedAt: ISODateTime;
  endedAt: ISODateTime;

  method: EffortMethod;

  startPosition?: Coordinate;
  endPosition?: Coordinate;

  catchCount: number;

  lure?: LurePresentation;

  notes?: string;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}


// ============================================================
// DRIFT
// ============================================================

export interface DriftTrackPoint {
  position: Coordinate;
  recordedAt: ISODateTime;
  depthMetres?: number;
}

export interface Drift {
  id: ID;
  tripId?: ID;
  effortId?: ID;

  startedAt: ISODateTime;
  endedAt?: ISODateTime;

  track: DriftTrackPoint[];

  averageSpeedKnots?: number;
  averageBearingDegrees?: number;

  notes?: string;
}


// ============================================================
// TIDE — WATER LEVEL
//
// Water-level tide is intentionally separate from tidal stream.
// High water does NOT necessarily equal slack water.
// ============================================================

export type TidalDirection = "flood" | "ebb" | "slack" | "unknown";

export type TideTurningPointType = "HW" | "LW";

export interface TideTurningPoint {
  type: TideTurningPointType;
  time: ISODateTime;
  heightMetres?: number;
}

export interface TideState {
  position: Coordinate;
  observedAt: ISODateTime;

  heightMetres?: number;

  direction: TidalDirection;

  previousTurningPoint?: TideTurningPoint;
  nextTurningPoint?: TideTurningPoint;

  minutesFromPreviousTurningPoint?: number;
  minutesToNextTurningPoint?: number;

  // Range between the relevant HW and LW.
  rangeMetres?: number;

  // 0 → 1 progression through the current half-cycle.
  halfCycleProgress?: number;

  // Continuous representation of the full tidal cycle.
  // 0.00 = HW
  // 0.25 = mid ebb
  // 0.50 = LW
  // 0.75 = mid flood
  // 1.00 = next HW
  cyclePosition?: number;

  springNeapIndex?: number;

  provenance: DataProvenance[];
}


// ============================================================
// TIDAL STREAM
// ============================================================

export interface TidalStreamState {
  position: Coordinate;
  observedAt: ISODateTime;

  speedKnots?: number;
  directionDegrees?: number;

  phase?: "building" | "peak" | "easing" | "slack" | "unknown";

  provenance: DataProvenance[];
}


// ============================================================
// WEATHER
// ============================================================

export interface WeatherState {
  position: Coordinate;
  observedAt: ISODateTime;

  airTemperatureC?: number;

  windSpeedKnots?: number;
  windGustKnots?: number;
  windDirectionDegrees?: number;

  pressureHpa?: number;

  cloudCoverPercent?: number;
  precipitationMm?: number;
  visibilityMetres?: number;

  provenance: DataProvenance[];
}


// ============================================================
// SEA STATE
// ============================================================

export interface SeaState {
  position: Coordinate;
  observedAt: ISODateTime;

  seaSurfaceTemperatureC?: number;

  waveHeightMetres?: number;
  waveDirectionDegrees?: number;
  wavePeriodSeconds?: number;

  swellHeightMetres?: number;
  swellDirectionDegrees?: number;
  swellPeriodSeconds?: number;

  secondarySwellHeightMetres?: number;
  secondarySwellDirectionDegrees?: number;
  secondarySwellPeriodSeconds?: number;

  provenance: DataProvenance[];
}


// ============================================================
// LIGHT / SOLAR CONDITIONS
// ============================================================

export type LightPhase =
  | "night"
  | "astronomical-twilight"
  | "nautical-twilight"
  | "civil-twilight"
  | "daylight";

export interface LightState {
  observedAt: ISODateTime;
  position: Coordinate;

  phase: LightPhase;

  sunAltitudeDegrees?: number;
  sunAzimuthDegrees?: number;

  sunrise?: ISODateTime;
  sunset?: ISODateTime;

  minutesFromSunrise?: number;
  minutesFromSunset?: number;

  // Combination of astronomical light and cloud conditions.
  relativeLightIndex?: number;
}


// ============================================================
// SEABED / BATHYMETRY
// ============================================================

export type SeabedType =
  | "rock"
  | "reef"
  | "sand"
  | "gravel"
  | "mud"
  | "mixed"
  | "unknown";

export type StructureType =
  | "flat"
  | "reef"
  | "reef-edge"
  | "drop-off"
  | "ledge"
  | "gully"
  | "pinnacle"
  | "bank"
  | "channel"
  | "sand-rock-transition"
  | "shoreline"
  | "unknown";

export interface StructureState {
  position: Coordinate;

  depthMetres?: number;

  seabed?: SeabedType;
  structure?: StructureType;

  // Local bathymetric gradient.
  slopeDegrees?: number;

  // Direction the slope faces.
  aspectDegrees?: number;

  // Difference between this location and surrounding ground.
  relativeReliefMetres?: number;

  // Approximation of seabed complexity.
  roughnessIndex?: number;

  distanceToDepthBreakMetres?: number;
  distanceToShoreMetres?: number;

  provenance: DataProvenance[];
}


// ============================================================
// COMBINED ENVIRONMENT
// ============================================================

export interface EnvironmentalSnapshot {
  id: ID;

  position: Coordinate;
  observedAt: ISODateTime;

  tide?: TideState;
  tidalStream?: TidalStreamState;
  weather?: WeatherState;
  sea?: SeaState;
  light?: LightState;

  createdAt: ISODateTime;
}


// ============================================================
// PRIVATE MARKS
// ============================================================

export interface FishingMark {
  id: ID;

  name: string;
  position: Coordinate;

  structureType?: StructureType;
  notes?: string;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}


// ============================================================
// PREDICTION
// ============================================================

export type OpportunityType =
  | "shoreline"
  | "reef"
  | "reef-edge"
  | "drop-off"
  | "gully"
  | "pinnacle"
  | "channel"
  | "open-water"
  | "other";

export interface PredictionEvidence {
  historicalCatchCount: number;
  comparableEffortCount: number;
  comparableBlankCount: number;

  catchRate?: number;

  tideSimilarity?: number;
  tidalStreamSimilarity?: number;
  weatherSimilarity?: number;
  seaStateSimilarity?: number;
  lightSimilarity?: number;
  structureSimilarity?: number;
  seasonalSimilarity?: number;

  scientificPrior?: number;

  explanation: string[];
}

export interface BassPrediction {
  id: ID;

  generatedAt: ISODateTime;

  validFrom: ISODateTime;
  validTo: ISODateTime;

  position: Coordinate;

  opportunityType: OpportunityType;

  // 0 → 1 internal score.
  score: number;

  confidence: ConfidenceLevel;

  predictedTide?: TideState;
  predictedStream?: TidalStreamState;
  predictedWeather?: WeatherState;
  predictedSea?: SeaState;
  predictedLight?: LightState;
  structure?: StructureState;

  evidence: PredictionEvidence;
}


// ============================================================
// TIDE-BASED MAP VISUALISATION
// ============================================================
//
// Historical catches and predicted opportunities use the same
// tidal colour language.
//
// HW = strongest blue
// LW = strongest red
//
// Prediction markers must remain visually distinguishable from
// actual historical observations.
// ============================================================

export type MapRecordKind = "historical-catch" | "prediction";

export interface TideMarkerVisual {
  kind: MapRecordKind;

  // Tide cycle position used to calculate colour.
  tideCyclePosition: number;

  // 0 → 1 visual strength.
  intensity: number;

  // Predictions can use a ring/halo while catches remain solid.
  predicted: boolean;
}


// ============================================================
// EXTERNAL DATA QUALITY
// ============================================================

export interface DataQualitySummary {
  tide: ConfidenceLevel;
  tidalStream: ConfidenceLevel;
  weather: ConfidenceLevel;
  seaState: ConfidenceLevel;
  structure: ConfidenceLevel;

  warnings: string[];
}


// ============================================================
// ENRICHED BASS EVENT
//
// This is the analysis-ready representation of a catch while
// retaining the original raw catch separately.
// ============================================================

export interface EnrichedBassCatch {
  catch: BassCatch;

  environment?: EnvironmentalSnapshot;
  structure?: StructureState;

  dataQuality?: DataQualitySummary;
}
