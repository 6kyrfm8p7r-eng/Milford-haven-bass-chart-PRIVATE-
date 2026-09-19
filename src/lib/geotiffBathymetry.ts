import { fromArrayBuffer } from "geotiff";

export interface DecodedBathymetryGrid {
  width: number;
  height: number;

  bounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  };

  values: Array<number | null>;

  statistics: {
    validCells: number;
    noDataCells: number;
    minimumElevationMetres: number | null;
    maximumElevationMetres: number | null;
    maximumWaterDepthMetres: number | null;
  };
}


/**
 * Decode an EMODnet GeoTIFF into a simple application-friendly grid.
 *
 * EMODnet bathymetry is expressed as seabed elevation relative
 * to the vertical datum. Submerged seabed values are normally
 * negative, so a value such as -12.4 represents approximately
 * 12.4 metres of water depth.
 *
 * Fishing analysis only — not for navigation.
 */
export async function decodeBathymetryGeoTiff(
  buffer: ArrayBuffer,
): Promise<DecodedBathymetryGrid> {
  if (buffer.byteLength === 0) {
    throw new Error(
      "Cannot decode an empty bathymetry GeoTIFF.",
    );
  }


  const tiff =
    await fromArrayBuffer(buffer);

  const image =
    await tiff.getImage();


  const width =
    image.getWidth();

  const height =
    image.getHeight();


  if (width <= 0 || height <= 0) {
    throw new Error(
      "Bathymetry GeoTIFF has invalid dimensions.",
    );
  }


  const boundingBox =
    image.getBoundingBox();


  const [
    west,
    south,
    east,
    north,
  ] = boundingBox;


  const noDataRaw =
    image.getGDALNoData();

  const noData =
    noDataRaw === null
      ? null
      : Number(noDataRaw);


  const rasters =
    await image.readRasters({
      interleave: true,
    });


  const rawValues =
    Array.from(
      rasters as ArrayLike<number>,
    );


  const values:
    Array<number | null> = [];


  let validCells = 0;
  let noDataCells = 0;

  let minimumElevation =
    Number.POSITIVE_INFINITY;

  let maximumElevation =
    Number.NEGATIVE_INFINITY;

  let maximumWaterDepth = 0;


  for (const rawValue of rawValues) {
    const value =
      Number(rawValue);


    const isNoData =
      !Number.isFinite(value) ||
      (
        noData !== null &&
        value === noData
      );


    if (isNoData) {
      values.push(null);
      noDataCells += 1;
      continue;
    }


    values.push(value);

    validCells += 1;


    if (value < minimumElevation) {
      minimumElevation =
        value;
    }


    if (value > maximumElevation) {
      maximumElevation =
        value;
    }


    /*
     * Negative seabed elevation becomes positive water depth.
     * Positive values are land / above-datum elevations and
     * therefore do not increase maximum water depth.
     */
    if (value < 0) {
      maximumWaterDepth =
        Math.max(
          maximumWaterDepth,
          Math.abs(value),
        );
    }
  }


  return {
    width,
    height,

    bounds: {
      west,
      south,
      east,
      north,
    },

    values,

    statistics: {
      validCells,
      noDataCells,

      minimumElevationMetres:
        validCells > 0
          ? minimumElevation
          : null,

      maximumElevationMetres:
        validCells > 0
          ? maximumElevation
          : null,

      maximumWaterDepthMetres:
        validCells > 0
          ? maximumWaterDepth
          : null,
    },
  };
}
