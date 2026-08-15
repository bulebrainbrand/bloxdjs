import type { LongestSchemaObject } from "./longest";
import type { MiddleSchemaObject } from "./middle";
import type { ShortestSchemaObject } from "./shortest";
import type { SchemaObjectBlockdata } from "./types";

export const shortestSchemaObjectToMiddleSchemaObject = (
  shortestSchemaObject: ShortestSchemaObject,
  blockdatas: SchemaObjectBlockdata[] = [],
): MiddleSchemaObject => ({
  ...shortestSchemaObject,
  blockdatas,
});
export const shortestSchemaObjectToLongestSchemaObject = (
  shortestSchemaObject: ShortestSchemaObject,
  blockdatas: SchemaObjectBlockdata[] = [],
  globalX: number = 0,
  globalY: number = 0,
  globalZ: number = 0,
): LongestSchemaObject => ({
  ...shortestSchemaObject,
  blockdatas,
  globalX,
  globalY,
  globalZ,
});
