import rewind from "@turf/rewind";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { hint } = require("@mapbox/geojsonhint") as {
  hint: (data: object | string) => { message: string }[];
};

export const validateGeometry = (geometry: any): string[] => {
  if (!geometry || (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")) {
    return ["Geometry must be a Polygon or MultiPolygon"];
  }
  try {
    const fixed = rewind(geometry, { mutate: false });
    return hint(fixed).map((e) => e.message);
  } catch (err) {
    return ["Invalid input: " + (err instanceof Error ? err.message : String(err))];
  }
};