import avsc from "avsc";
import type { SchemaObjectBlockdata } from "./types";
import type {
  ShortestNormailzedSchema,
  ShortestSchemaObject,
} from "./shortest";
import type { BlockData, Schema } from "./types";
import { decodeChunks, encodeChunks } from "../blockencode";
const middleAvroSchema = avsc.Type.forSchema({
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
    },
  ],
});

export type MiddleSchemaObject = ShortestSchemaObject & {
  blockdatas: SchemaObjectBlockdata[];
};

export type MiddleNormailedSchema = ShortestNormailzedSchema & {
  blockdatas: BlockData[];
};
export const MiddleSchema: Schema<MiddleSchemaObject, MiddleNormailedSchema> = {
  avroType: middleAvroSchema,
  bufferToSchemaObject(buffer) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return middleAvroSchema.fromBuffer(buffer) as MiddleSchemaObject;
  },
  schemaObjectToBuffer(object) {
    return middleAvroSchema.toBuffer(object);
  },
  schemaObjectToNormalizedSchema(object) {
    return {
      name: object.name,
      pos: [object.x, object.y, object.z],
      size: [object.sizeX, object.sizeY, object.sizeZ],
      chunks: decodeChunks(object.chunks),
      blockdatas: object.blockdatas,
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
    };
  },
};
