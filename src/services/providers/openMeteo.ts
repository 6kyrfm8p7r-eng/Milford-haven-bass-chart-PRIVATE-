import type {
  Coordinate,
  DataProvenance,
  SeaState,
  TidalStreamState,
  WeatherState,
} from "@/types/fishing";

import type {
  EnvironmentalRequest,
  MarineProvider,
  ProviderCapabilities,
  ProviderResult,
  TidalStreamProvider,
  WeatherProvider,
} from "@/services/providers/types";


// ============================================================
// Milford Haven Bass Chart
// Open-Meteo environmental provider
// ============================================================
//
// Open-Meteo supplies broad-scale weather and marine-model
// information.
//
// IMPORTANT:
//
// Marine tide/current information is NOT treated as precise
// reef-scale tidal-stream data.
//
// The provider's coastal marine models have much coarser spatial
// resolution than our catch pins and bathymetric analysis.
//
// Every returned record therefore retains provenance and model
// limitations.
// ============================================================

const WEATHER_ENDPOINT =
  "https://api.open-meteo.com/v1/forecast";

const MARINE_ENDPOINT =
  "https://marine-api.open-meteo.com/v1/marine";

const KPH_TO_KNOTS = 0.539956803;


// ============================================================
// RAW API TYPES
// ============================================================

interface OpenMeteoHourly {
  time?: string[];

  temperature_2m?: Array<number | null>;

  pressure_msl?: Array<number | null>;

  cloud_cover?: Array<number | null>;

  precipitation?: Array<number | null>;

  visibility?: Array<number | null>;

  wind_speed_10m?: Array<number | null>;

  wind_gusts_10m?: Array<number | null>;

  wind_direction_10m?: Array<number | null>;

  wave_height?: Array<number | null>;
  wave_direction?: Array<number | null>;
  wave_period?: Array<number | null>;

  swell_wave_height?: Array<number | null>;
  swell_wave_direction?: Array<number | null>;
  swell_wave_period?: Array<number | null>;

  secondary_swell_wave_height?: Array<number | null>;
  secondary_swell_wave_direction?: Array<number | null>;
  secondary_swell_wave_period?: Array<number | null>;

  sea_surface_temperature?: Array<number | null>;

  ocean_current_velocity?: Array<number | null>;
  ocean_current_direction?: Array<number | null>;
}

interface OpenMeteoResponse {
  latitude?: number;
  longitude?: number;

  hourly?: OpenMeteoHourly;
}


// ============================================================
// HELPERS
// ============================================================

function createProvenance(
  source: string,
  validAt: string,
  resolutionMetres?: number,
  notes?: string,
): DataProvenance {
  return {
    provider: "open-meteo",
    source,
    retrievedAt: new Date().toISOString(),
    validAt,
    resolutionMetres,
    notes,
  };
}


function emptyResult<T>(
  warning: string,
): ProviderResult<T> {
  return {
    data: null,
    provenance: [],
    warnings: [warning],
    partial: true,
  };
}


function nearestTimeIndex(
  times: string[],
  requestedTime: string,
): number {
  const target = Date.parse(requestedTime);

  if (!Number.isFinite(target)) {
    return -1;
  }

  let bestIndex = -1;
  let bestDifference = Number.POSITIVE_INFINITY;

  for (let index = 0; index < times.length; index += 1) {
    const candidate = Date.parse(times[index]);

    if (!Number.isFinite(candidate)) {
      continue;
    }

    const difference = Math.abs(candidate - target);

    if (difference < bestDifference) {
      bestDifference = difference;
      bestIndex = index;
    }
  }

  return bestIndex;
}


function valueAt(
  values: Array<number | null> | undefined,
  index: number,
): number | undefined {
  if (!values || index < 0 || index >= values.length) {
    return undefined;
  }

  const value = values[index];

  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : undefined;
}


function buildURL(
  endpoint: string,
  position: Coordinate,
  variables: string[],
): URL {
  const url = new URL(endpoint);

  url.searchParams.set(
    "latitude",
    String(position.latitude),
  );

  url.searchParams.set(
    "longitude",
    String(position.longitude),
  );

  url.searchParams.set(
    "hourly",
    variables.join(","),
  );

  // UTC gives us an unambiguous internal timeline.
  url.searchParams.set("timezone", "GMT");

  return url;
}


async function fetchJSON(
  url: URL,
): Promise<OpenMeteoResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Open-Meteo request failed: ${response.status}`,
    );
  }

  return response.json() as Promise<OpenMeteoResponse>;
}


// ============================================================
// WEATHER
// ============================================================

const WEATHER_VARIABLES = [
  "temperature_2m",
  "pressure_msl",
  "cloud_cover",
  "precipitation",
  "visibility",
  "wind_speed_10m",
  "wind_gusts_10m",
  "wind_direction_10m",
];

export class OpenMeteoWeatherProvider
  implements WeatherProvider
{
  readonly id = "open-meteo-weather";
  readonly name = "Open-Meteo Weather";

  getCapabilities(): ProviderCapabilities {
    return {
      historical: false,
      forecast: true,
      realtime: true,
      minimumTimeStepMinutes: 60,
      notes: [
        "Forecast provider.",
        "Historical reconstruction will use a separate historical adapter.",
      ],
    };
  }

  async getWeather(
    request: EnvironmentalRequest,
  ): Promise<ProviderResult<WeatherState>> {
    try {
      const url = buildURL(
        WEATHER_ENDPOINT,
        request.position,
        WEATHER_VARIABLES,
      );

      const response = await fetchJSON(url);
      const hourly = response.hourly;

      if (!hourly?.time?.length) {
        return emptyResult(
          "Open-Meteo returned no hourly weather data.",
        );
      }

      const index = nearestTimeIndex(
        hourly.time,
        request.time,
      );

      if (index < 0) {
        return emptyResult(
          "No suitable Open-Meteo weather timestamp was found.",
        );
      }

      const validAt = hourly.time[index];

      const provenance = createProvenance(
        "Open-Meteo Weather API",
        validAt,
      );

      const data: WeatherState = {
        position: request.position,
        observedAt: validAt,

        airTemperatureC:
          valueAt(hourly.temperature_2m, index),

        windSpeedKnots: (() => {
          const value =
            valueAt(hourly.wind_speed_10m, index);

          return value === undefined
            ? undefined
            : value * KPH_TO_KNOTS;
        })(),

        windGustKnots: (() => {
          const value =
            valueAt(hourly.wind_gusts_10m, index);

          return value === undefined
            ? undefined
            : value * KPH_TO_KNOTS;
        })(),

        windDirectionDegrees:
          valueAt(hourly.wind_direction_10m, index),

        pressureHpa:
          valueAt(hourly.pressure_msl, index),

        cloudCoverPercent:
          valueAt(hourly.cloud_cover, index),

        precipitationMm:
          valueAt(hourly.precipitation, index),

        visibilityMetres:
          valueAt(hourly.visibility, index),

        provenance: [provenance],
      };

      return {
        data,
        provenance: [provenance],
        warnings: [],
        partial: false,
      };
    } catch (error) {
      return emptyResult(
        error instanceof Error
          ? error.message
          : "Unknown Open-Meteo weather error.",
      );
    }
  }
}


// ============================================================
// MARINE
// ============================================================

const MARINE_VARIABLES = [
  "wave_height",
  "wave_direction",
  "wave_period",

  "swell_wave_height",
  "swell_wave_direction",
  "swell_wave_period",

  "secondary_swell_wave_height",
  "secondary_swell_wave_direction",
  "secondary_swell_wave_period",

  "sea_surface_temperature",
];

export class OpenMeteoMarineProvider
  implements MarineProvider
{
  readonly id = "open-meteo-marine";
  readonly name = "Open-Meteo Marine";

  getCapabilities(): ProviderCapabilities {
    return {
      historical: false,
      forecast: true,
      realtime: true,

      minimumTimeStepMinutes: 60,

      notes: [
        "Marine model resolution varies by variable and model.",
        "Not suitable for navigation.",
      ],
    };
  }

  async getSeaState(
    request: EnvironmentalRequest,
  ): Promise<ProviderResult<SeaState>> {
    try {
      const url = buildURL(
        MARINE_ENDPOINT,
        request.position,
        MARINE_VARIABLES,
      );

      const response = await fetchJSON(url);
      const hourly = response.hourly;

      if (!hourly?.time?.length) {
        return emptyResult(
          "Open-Meteo returned no hourly marine data.",
        );
      }

      const index = nearestTimeIndex(
        hourly.time,
        request.time,
      );

      if (index < 0) {
        return emptyResult(
          "No suitable Open-Meteo marine timestamp was found.",
        );
      }

      const validAt = hourly.time[index];

      const provenance = createProvenance(
        "Open-Meteo Marine API",
        validAt,
        undefined,
        "Marine-model resolution varies by variable.",
      );

      const data: SeaState = {
        position: request.position,
        observedAt: validAt,

        seaSurfaceTemperatureC:
          valueAt(
            hourly.sea_surface_temperature,
            index,
          ),

        waveHeightMetres:
          valueAt(hourly.wave_height, index),

        waveDirectionDegrees:
          valueAt(hourly.wave_direction, index),

        wavePeriodSeconds:
          valueAt(hourly.wave_period, index),

        swellHeightMetres:
          valueAt(hourly.swell_wave_height, index),

        swellDirectionDegrees:
          valueAt(
            hourly.swell_wave_direction,
            index,
          ),

        swellPeriodSeconds:
          valueAt(hourly.swell_wave_period, index),

        secondarySwellHeightMetres:
          valueAt(
            hourly.secondary_swell_wave_height,
            index,
          ),

        secondarySwellDirectionDegrees:
          valueAt(
            hourly.secondary_swell_wave_direction,
            index,
          ),

        secondarySwellPeriodSeconds:
          valueAt(
            hourly.secondary_swell_wave_period,
            index,
          ),

        provenance: [provenance],
      };

      return {
        data,
        provenance: [provenance],
        warnings: [
          "Marine conditions are modelled and must not be used for navigation.",
        ],
        partial: false,
      };
    } catch (error) {
      return emptyResult(
        error instanceof Error
          ? error.message
          : "Unknown Open-Meteo marine error.",
      );
    }
  }
}


// ============================================================
// BROAD-SCALE TIDAL STREAM
// ============================================================
//
// Open-Meteo's ocean-current model is useful as environmental
// context.
//
// It is NOT sufficiently fine-grained to describe current over
// an individual reef, pinnacle or gully around Pembrokeshire.
// ============================================================

const CURRENT_VARIABLES = [
  "ocean_current_velocity",
  "ocean_current_direction",
];

export class OpenMeteoTidalStreamProvider
  implements TidalStreamProvider
{
  readonly id = "open-meteo-current";
  readonly name = "Open-Meteo Broad-Scale Current";

  getCapabilities(): ProviderCapabilities {
    return {
      historical: false,
      forecast: true,
      realtime: true,

      minimumTimeStepMinutes: 60,

      approximateSpatialResolutionMetres: 8000,

      notes: [
        "Broad-scale model only.",
        "Coastal accuracy is limited.",
        "Do not interpret as reef-scale tidal stream.",
      ],
    };
  }

  async getTidalStream(
    request: EnvironmentalRequest,
  ): Promise<
    ProviderResult<TidalStreamState>
  > {
    try {
      const url = buildURL(
        MARINE_ENDPOINT,
        request.position,
        CURRENT_VARIABLES,
      );

      // Ask Open-Meteo to return current speed in knots.
      url.searchParams.set("wind_speed_unit", "kn");

      const response = await fetchJSON(url);
      const hourly = response.hourly;

      if (!hourly?.time?.length) {
        return emptyResult(
          "Open-Meteo returned no ocean-current data.",
        );
      }

      const index = nearestTimeIndex(
        hourly.time,
        request.time,
      );

      if (index < 0) {
        return emptyResult(
          "No suitable Open-Meteo current timestamp was found.",
        );
      }

      const validAt = hourly.time[index];

      const provenance = createProvenance(
        "Open-Meteo Marine Current Model",
        validAt,
        8000,
        "Approximate 8 km model resolution; coastal accuracy limited.",
      );

      const data: TidalStreamState = {
        position: request.position,
        observedAt: validAt,

        speedKnots:
          valueAt(
            hourly.ocean_current_velocity,
            index,
          ),

        directionDegrees:
          valueAt(
            hourly.ocean_current_direction,
            index,
          ),

        phase: "unknown",

        provenance: [provenance],
      };

      return {
        data,
        provenance: [provenance],
        warnings: [
          "Current is broad-scale model evidence, not a local reef-stream measurement.",
        ],
        partial: false,
      };
    } catch (error) {
      return emptyResult(
        error instanceof Error
          ? error.message
          : "Unknown Open-Meteo current error.",
      );
    }
  }
}


// ============================================================
// DEFAULT INSTANCES
// ============================================================

export const openMeteoWeather =
  new OpenMeteoWeatherProvider();

export const openMeteoMarine =
  new OpenMeteoMarineProvider();

export const openMeteoTidalStream =
  new OpenMeteoTidalStreamProvider();
