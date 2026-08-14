import avsc from "avsc";
import type { SchemaObjectChunk } from "./types";
import type { Chunk, Schema } from "./types";
import { decodeChunks, encodeChunks } from "../blockencode";
const shortestAvroSchema = avsc.Type.forSchema({
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
  ],
});

export type ShortestSchemaObject = {
  headers: Buffer;
  name: string;
  x: number;
  y: number;
  z: number;
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  chunks: SchemaObjectChunk[];
};

export type ShortestNormailzedSchema = {
  name: string;
  pos: [number, number, number];
  size: [number, number, number];
  chunks: Chunk[];
};

export const ShortestSchema: Schema<
  ShortestSchemaObject,
  ShortestNormailzedSchema
> = {
  avroType: shortestAvroSchema,
  bufferToSchemaObject(buffer) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return shortestAvroSchema.fromBuffer(buffer) as ShortestSchemaObject;
  },
  schemaObjectToBuffer(object) {
    return shortestAvroSchema.toBuffer(object);
  },
  schemaObjectToNormalizedSchema(object) {
    return {
      name: object.name,
      pos: [object.x, object.y, object.z],
      size: [object.sizeX, object.sizeY, object.sizeZ],
      chunks: decodeChunks(object.chunks),
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
    };
  },
};
