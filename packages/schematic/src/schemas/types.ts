import type { Type } from "avsc";
import type { ShortestSchemaObject } from "./shortest";
import type { MiddleSchemaObject } from "./middle";
import type { LongestSchemaObject } from "./longest";

export interface Schema<SchemaObject, NomralizedSchema> {
  avroType: Type;
  schemaObjectToBuffer: (object: SchemaObject) => Buffer;
  bufferToSchemaObject: (buffer: Buffer) => SchemaObject;
  schemaObjectToNormalizedSchema: (object: SchemaObject) => NomralizedSchema;
  normalizedSchemaToSchemaObject: (schema: NomralizedSchema) => SchemaObject;
}
export interface SchemaObjectChunk {
  x: number;
  y: number;
  z: number;
  blocks: Buffer;
}
export interface Chunk {
  // Chunk pos
  pos: [number, number, number];
  blocks: Blocks;
}
export type Blocks = number[];
export interface BlockData {
  blockX: number;
  blockY: number;
  blockZ: number;
  blockdataStr: string;
}
export type SchemaObject =
  | { type: "shortest"; shortest: ShortestSchemaObject }
  | { type: "middle"; middle: MiddleSchemaObject }
  | { type: "longest"; longest: LongestSchemaObject };
export interface SchemaObjectBlockdata {
  blockX: number;
  blockY: number;
  blockZ: number;
  blockdataStr: string;
}
