import avsc from "avsc";
import type { MiddleNormailedSchema, MiddleSchemaObject } from "./middle";
import type { Schema } from "./types";
import { decodeChunks, encodeChunks } from "../blockencode";
const longestAvroSchema = avsc.Type.forSchema({
  type: "record",
  name: "Schematic",
  fields: [
    {
      name: "headers",
      type: { name: "fixed_header", type: "fixed", size: 4 },
      default: "\u0004\u0000\u0000\u0000",
    },
    { name: "name", type: "string" },
    { name: "x", type: "int" },
    { name: "y", type: "int" },
    { name: "z", type: "int" },
    { name: "sizeX", type: "int" },
    { name: "sizeY", type: "int" },
    { name: "sizeZ", type: "int" },
    {
      name: "chunks",
      type: {
        type: "array",
        items: {
          type: "record",
          name: "chunk_item",
          fields: [
            { name: "x", type: "int" },
            { name: "y", type: "int" },
            { name: "z", type: "int" },
            { name: "blocks", type: "bytes" },
          ],
        },
      },
    },
    {
      name: "blockdatas",
      type: {
        type: "array",
        items: {
          type: "record",
          name: "blockdata_item",
          fields: [
            { name: "blockX", type: "int" },
            { name: "blockY", type: "int" },
            { name: "blockZ", type: "int" },
            { name: "blockdataStr", type: "string" },
          ],
        },
      },
      default: [],
    },
    { name: "globalX", type: "int", default: 0 },
    { name: "globalY", type: "int", default: 0 },
    { name: "globalZ", type: "int", default: 0 },
  ],
});
export type LongestSchemaObject = MiddleSchemaObject & {
  globalX: number;
  globalY: number;
  globalZ: number;
};

export type LongestNormailedSchema = MiddleNormailedSchema & {
  globalPosition: [number, number, number];
};

export const LongestSchema: Schema<
  LongestSchemaObject,
  LongestNormailedSchema
> = {
  avroType: longestAvroSchema,
  bufferToSchemaObject(buffer) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return longestAvroSchema.fromBuffer(buffer) as LongestSchemaObject;
  },
  schemaObjectToBuffer(object) {
    return longestAvroSchema.toBuffer(object);
  },
  schemaObjectToNormalizedSchema(object) {
    return {
      name: object.name,
      pos: [object.x, object.y, object.z],
      size: [object.sizeX, object.sizeY, object.sizeZ],
      chunks: decodeChunks(object.chunks),
      blockdatas: object.blockdatas,
      globalPosition: [object.globalX, object.globalY, object.globalZ],
    };
  },
  normalizedSchemaToSchemaObject(schema) {
    return {
      name: schema.name,
      x: schema.pos[0],
      y: schema.pos[1],
      z: schema.pos[2],
      sizeX: schema.size[0],
      sizeY: schema.size[1],
      sizeZ: schema.size[2],
      headers: Buffer.from("\u0004\u0000\u0000\u0000"),
      chunks: encodeChunks(schema.chunks),
      blockdatas: schema.blockdatas,
      globalX: schema.globalPosition[0],
      globalY: schema.globalPosition[1],
      globalZ: schema.globalPosition[2],
    };
  },
};
