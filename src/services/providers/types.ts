import type {
  Coordinate,
  DataProvenance,
  SeaState,
  StructureState,
  TidalStreamState,
  TideState,
  WeatherState,
} from "@/types/fishing";


// ============================================================
// Milford Haven Bass Chart
// External environmental provider contracts
// ============================================================
//
// The rest of the application talks to THESE interfaces rather
// than directly to Open-Meteo, EMODnet or any future provider.
//
// This lets us:
//
// - replace providers later
// - combine multiple providers
// - compare conflicting observations
// - retain source/resolution information
// - distinguish unavailable data from zero values
//
// No provider is allowed to silently invent missing data.
// ============================================================


// ============================================================
// COMMON REQUEST TYPES
// ============================================================

export interface TimeRange {
  start: string;
  end: string;
}

export interface EnvironmentalRequest {
  position: Coordinate;
  time: string;
}

export interface EnvironmentalRangeRequest {
  position: Coordinate;
  range: TimeRange;
}

export interface ProviderCapabilities {
  historical: boolean;
  forecast: boolean;
  realtime: boolean;

  minimumTimeStepMinutes?: number;
  approximateSpatialResolutionMetres?: number;

  notes?: string[];
}


// ============================================================
// PROVIDER RESULT
// ============================================================
//
// A provider can succeed without having every requested field.
//
// Example:
//
// A marine model may return swell and wave height but have no
// useful local tidal-stream information.
//
// We therefore carry warnings rather than filling gaps with
// fabricated values.
// ============================================================

export interface ProviderResult<T> {
  data: T | null;

  provenance: DataProvenance[];

  warnings: string[];

  partial: boolean;
}


// ============================================================
// WEATHER PROVIDER
// ============================================================

export interface WeatherProvider {
  readonly id: string;
  readonly name: string;

  getCapabilities(): ProviderCapabilities;

  getWeather(
    request: EnvironmentalRequest,
  ): Promise<ProviderResult<WeatherState>>;

  getWeatherRange?(
    request: EnvironmentalRangeRequest,
  ): Promise<ProviderResult<WeatherState[]>>;
}


// ============================================================
// MARINE PROVIDER
// ============================================================

export interface MarineProvider {
  readonly id: string;
  readonly name: string;

  getCapabilities(): ProviderCapabilities;

  getSeaState(
    request: EnvironmentalRequest,
  ): Promise<ProviderResult<SeaState>>;

  getSeaStateRange?(
    request: EnvironmentalRangeRequest,
  ): Promise<ProviderResult<SeaState[]>>;
}


// ============================================================
// TIDE PROVIDER
// ============================================================

export interface TideProvider {
  readonly id: string;
  readonly name: string;

  getCapabilities(): ProviderCapabilities;

  getTideState(
    request: EnvironmentalRequest,
  ): Promise<ProviderResult<TideState>>;

  getTideRange?(
    request: EnvironmentalRangeRequest,
  ): Promise<ProviderResult<TideState[]>>;
}


// ============================================================
// TIDAL STREAM PROVIDER
// ============================================================
//
// Kept separate from TideProvider deliberately.
//
// Water level and local current behaviour are different physical
// quantities and may come from different data/models.
// ============================================================

export interface TidalStreamProvider {
  readonly id: string;
  readonly name: string;

  getCapabilities(): ProviderCapabilities;

  getTidalStream(
    request: EnvironmentalRequest,
  ): Promise<ProviderResult<TidalStreamState>>;

  getTidalStreamRange?(
    request: EnvironmentalRangeRequest,
  ): Promise<ProviderResult<TidalStreamState[]>>;
}


// ============================================================
// BATHYMETRY / STRUCTURE PROVIDER
// ============================================================

export interface BathymetryProvider {
  readonly id: string;
  readonly name: string;

  getCapabilities(): ProviderCapabilities;

  getStructure(
    position: Coordinate,
  ): Promise<ProviderResult<StructureState>>;
}


// ============================================================
// PROVIDER REGISTRY
// ============================================================
//
// Providers are optional individually.
//
// The application should remain usable if one source is
// temporarily unavailable. Prediction confidence can then be
// reduced instead of the whole application failing.
// ============================================================

export interface ProviderRegistry {
  weather?: WeatherProvider;
  marine?: MarineProvider;
  tide?: TideProvider;
  tidalStream?: TidalStreamProvider;
  bathymetry?: BathymetryProvider;
}


// ============================================================
// PROVIDER HEALTH
// ============================================================

export type ProviderHealth =
  | "available"
  | "degraded"
  | "unavailable"
  | "unknown";

export interface ProviderStatus {
  id: string;
  name: string;

  health: ProviderHealth;

  checkedAt: string;

  message?: string;
}
