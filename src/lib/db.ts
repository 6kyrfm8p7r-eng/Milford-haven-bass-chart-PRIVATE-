import Dexie, { type EntityTable } from "dexie";

import type {
  BassCatch,
  BassPrediction,
  Drift,
  EnvironmentalSnapshot,
  FishingEffort,
  FishingMark,
  FishingTrip,
  StructureState,
} from "@/types/fishing";


// ============================================================
// Milford Haven Bass Chart
// Local private fishing database
// ============================================================
//
// This database lives in the browser using IndexedDB.
//
// PRIVATE USER DATA MUST NOT BE IMPORTED INTO THE APPLICATION
// SOURCE CODE.
//
// Catches, marks, trips, tracks and fishing effort belong here,
// not in GitHub.
//
// The schema is deliberately designed so raw observations can
// survive changes to environmental providers and prediction
// algorithms.
// ============================================================


// ------------------------------------------------------------
// Stored structure record
// ------------------------------------------------------------
//
// StructureState itself represents the measured/derived ground.
// This wrapper gives each stored result a stable ID and allows
// us to replace/recalculate structure data independently.
// ------------------------------------------------------------

export interface StoredStructure {
  id: string;
  structure: StructureState;
  createdAt: string;
  updatedAt: string;
}


// ------------------------------------------------------------
// Prediction cache
// ------------------------------------------------------------
//
// Predictions are derived information rather than permanent
// observations.
//
// Keeping them in a separate table means the entire prediction
// cache can be deleted/rebuilt without touching fishing history.
// ------------------------------------------------------------

export interface StoredPrediction extends BassPrediction {
  modelVersion?: string;
}


// ------------------------------------------------------------
// Application metadata
// ------------------------------------------------------------
//
// Used for schema versions, enrichment versions, migration
// state and other non-fishing application information.
// ------------------------------------------------------------

export interface AppMetadata {
  key: string;
  value: string | number | boolean | null;
  updatedAt: string;
}


// ============================================================
// DATABASE
// ============================================================

export class BassChartDatabase extends Dexie {
  catches!: EntityTable<BassCatch, "id">;

  trips!: EntityTable<FishingTrip, "id">;

  effort!: EntityTable<FishingEffort, "id">;

  drifts!: EntityTable<Drift, "id">;

  marks!: EntityTable<FishingMark, "id">;

  environments!: EntityTable<EnvironmentalSnapshot, "id">;

  structures!: EntityTable<StoredStructure, "id">;

  predictions!: EntityTable<StoredPrediction, "id">;

  metadata!: EntityTable<AppMetadata, "key">;


  constructor() {
    super("MilfordHavenBassChart");

    // ========================================================
    // VERSION 1
    // ========================================================
    //
    // IMPORTANT:
    //
    // IndexedDB indexes are NOT the same thing as SQL columns.
    //
    // Only fields we expect to search/filter/sort on need to
    // appear below. Dexie still stores the complete object.
    //
    // Nested properties can be indexed using dot notation.
    // ========================================================

    this.version(1).stores({
      catches:
        "id, caughtAt, tripId, driftId, effortId, " +
        "position.latitude, position.longitude, " +
        "environmentId, structureId",

      trips:
        "id, startedAt, endedAt, launchName",

      effort:
        "id, tripId, startedAt, endedAt, method, catchCount",

      drifts:
        "id, tripId, effortId, startedAt, endedAt",

      marks:
        "id, name, createdAt, updatedAt, " +
        "position.latitude, position.longitude",

      environments:
        "id, observedAt, " +
        "position.latitude, position.longitude",

      structures:
        "id, createdAt, updatedAt, " +
        "structure.position.latitude, " +
        "structure.position.longitude, " +
        "structure.structure, " +
        "structure.seabed",

      predictions:
        "id, generatedAt, validFrom, validTo, " +
        "confidence, opportunityType, score, " +
        "position.latitude, position.longitude",

      metadata:
        "key, updatedAt",
    });
  }
}


// ============================================================
// SINGLE DATABASE INSTANCE
// ============================================================
//
// Do not construct separate Dexie databases throughout the app.
// All database access should use this instance.
// ============================================================

export const db = new BassChartDatabase();


// ============================================================
// DATABASE METADATA
// ============================================================

export const DATABASE_SCHEMA_VERSION = 1;

export const DATABASE_METADATA_KEYS = {
  schemaVersion: "schema-version",
  enrichmentVersion: "enrichment-version",
  predictionModelVersion: "prediction-model-version",
  lastEnvironmentalRefresh: "last-environmental-refresh",
  lastStructureRefresh: "last-structure-refresh",
  lastPredictionRefresh: "last-prediction-refresh",
} as const;


// ============================================================
// INITIALISATION
// ============================================================

export async function initialiseDatabase(): Promise<void> {
  await db.open();

  const existingVersion = await db.metadata.get(
    DATABASE_METADATA_KEYS.schemaVersion,
  );

  if (!existingVersion) {
    await db.metadata.put({
      key: DATABASE_METADATA_KEYS.schemaVersion,
      value: DATABASE_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
    });
  }
}


// ============================================================
// PRIVATE DATA RESET
// ============================================================
//
// This deliberately clears fishing information separately from
// the database definition itself.
//
// Later the UI can require an explicit confirmation before this
// function is ever called.
// ============================================================

export async function clearPrivateFishingData(): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.catches,
      db.trips,
      db.effort,
      db.drifts,
      db.marks,
      db.environments,
      db.structures,
      db.predictions,
    ],
    async () => {
      await Promise.all([
        db.catches.clear(),
        db.trips.clear(),
        db.effort.clear(),
        db.drifts.clear(),
        db.marks.clear(),
        db.environments.clear(),
        db.structures.clear(),
        db.predictions.clear(),
      ]);
    },
  );
}


// ============================================================
// DERIVED DATA RESET
// ============================================================
//
// Environmental enrichment, derived seabed information and
// predictions can all be regenerated.
//
// Raw catches, trips, marks, effort and drift tracks survive.
// ============================================================

export async function clearDerivedData(): Promise<void> {
  await db.transaction(
    "rw",
    [db.environments, db.structures, db.predictions],
    async () => {
      await Promise.all([
        db.environments.clear(),
        db.structures.clear(),
        db.predictions.clear(),
      ]);
    },
  );
}
