import type { Coordinate } from "@/types/fishing";

// ============================================================
// Milford Haven Bass Chart
// Primary geographic study region
// ============================================================
//
// This is the initial HIGH-DETAIL fishing-analysis area.
//
// It deliberately extends beyond the immediate coastline so
// offshore reefs, banks, channels, depth changes and potential
// bass movement routes are not clipped.
//
// These bounds control initial data acquisition/processing.
// They are NOT intended to permanently limit the application.
// ============================================================

export interface GeographicBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface FishingRegion {
  id: string;
  name: string;
  description: string;

  centre: Coordinate;
  bounds: GeographicBounds;

  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
}

export const MILFORD_HAVEN_REGION: FishingRegion = {
  id: "milford-haven-pembrokeshire",

  name: "Milford Haven & St Ann's Bass Region",

  description:
    "High-detail bass fishing study area covering Milford Haven, Dale and Angle, the Haven entrance, St Ann's Head, surrounding offshore ground and the coast towards Freshwater West.",

  centre: {
    latitude: 51.69,
    longitude: -5.10,
  },

  /*
   * Deliberately generous initial bounds.
   *
   * NORTH
   * Includes Dale, outer Milford Haven and useful water north
   * of the immediate St Ann's Head area.
   *
   * SOUTH
   * Extends beyond Freshwater West so offshore structure and
   * movement opportunities are not clipped at the beach.
   *
   * WEST
   * Provides offshore room beyond St Ann's Head for reefs,
   * contour changes and tidal features.
   *
   * EAST
   * Extends well into Milford Haven and beyond the Angle side
   * of the entrance.
   */
  bounds: {
    north: 51.78,
    south: 51.58,
    west: -5.32,
    east: -4.90,
  },

  /*
   * MapLibre itself can zoom much further than the useful
   * resolution of some environmental datasets.
   *
   * We allow high visual zoom for extremely accurate manual
   * catch placement while separately exposing the true source
   * resolution of bathymetric/environmental information.
   */
  defaultZoom: 10,
  minZoom: 8,
  maxZoom: 20,
};


// ============================================================
// KEY REFERENCE AREAS
//
// These are navigation/search references only.
// They are NOT fishing predictions and carry no fishing score.
// ============================================================

export const REGION_REFERENCE_POINTS = {
  milfordHaven: {
    latitude: 51.71,
    longitude: -5.04,
  },

  dale: {
    latitude: 51.71,
    longitude: -5.17,
  },

  stAnnsHead: {
    latitude: 51.68,
    longitude: -5.18,
  },

  freshwaterWest: {
    latitude: 51.66,
    longitude: -5.06,
  },
} satisfies Record<string, Coordinate>;


// ============================================================
// GEOGRAPHIC HELPERS
// ============================================================

export function isInsidePrimaryRegion(position: Coordinate): boolean {
  const { north, south, east, west } = MILFORD_HAVEN_REGION.bounds;

  return (
    position.latitude <= north &&
    position.latitude >= south &&
    position.longitude <= east &&
    position.longitude >= west
  );
}

export function clampToPrimaryRegion(position: Coordinate): Coordinate {
  const { north, south, east, west } = MILFORD_HAVEN_REGION.bounds;

  return {
    latitude: Math.min(north, Math.max(south, position.latitude)),
    longitude: Math.min(east, Math.max(west, position.longitude)),
  };
}
