// src/types/JSONStream.d.ts
declare module "JSONStream" {
  import { Transform } from "stream";
  function parse(pattern: string): Transform;
  export { parse };
}