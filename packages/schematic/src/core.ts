import avsc from "avsc";
import { decodeLEB128, encodeLEB128 } from "./leb128";
import type { AvroBlockdata, AvroSchematic, Schematic } from "./types";
const fullSchema = avsc.Type.forSchema({
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
    {
      name: "tail_magic",
      type: { type: "fixed", name: "tail_magic_element", size: 2 },
      default: "\u0000\u0000",
    },
  ],
});

function decodeBlocks(buf: Buffer): number[] {
  const blocks: number[] = [];
  const offset = { i: 0 };
  while (offset.i < buf.length) {
    const amount = decodeLEB128(buf, offset);
    const id = decodeLEB128(buf, offset);
    for (let i = 0; i < amount; i++) blocks.push(id);
  }
  return blocks;
}

// ---- RLE圧縮 ----

function encodeBlocks(blocks: number[]): Buffer {
  const bytes: number[] = [];
  let currId = blocks[0];
  let currAmt = 1;

  for (let i = 1; i <= blocks.length; i++) {
    const id = blocks[i];
    if (id === currId) {
      currAmt++;
    } else {
      bytes.push(...encodeLEB128(currAmt));
      bytes.push(...encodeLEB128(currId!));
      currAmt = 1;
      currId = id;
    }
  }
  return Buffer.from(bytes);
}

export function avroSchematicToObjectSchematic(avro: AvroSchematic): Schematic {
  return {
    name: avro.name,
    pos: [avro.x, avro.y, avro.z],
    size: [avro.sizeX, avro.sizeY, avro.sizeZ],
    chunks: avro.chunks.map((avroChunk) => ({
      pos: [avroChunk.x, avroChunk.y, avroChunk.z],
      blocks: decodeBlocks(avroChunk.blocks),
    })),
    blockdatas: avro.blockdatas,
  };
}
export function objectSchmeticToAvroSchematic(schem: Schematic): AvroSchematic {
  const avro: AvroSchematic = {
    headers: HEADER_DEFAULT,
    name: schem.name,
    x: schem.pos[0],
    y: schem.pos[1],
    z: schem.pos[2],
    sizeX: schem.size[0],
    sizeY: schem.size[1],
    sizeZ: schem.size[2],
    chunks: schem.chunks.map((chunk) => ({
      x: chunk.pos[0],
      y: chunk.pos[1],
      z: chunk.pos[2],
      blocks: encodeBlocks(chunk.blocks),
    })),
    blockdatas: schem.blockdatas,
    globalX: 0,
    globalY: 0,
    globalZ: 0,
    tail_magic: TAIL_MAGIC,
  };
  return avro;
}
export function splitBloxdschem(avro: AvroSchematic): {
  schems: AvroSchematic[];
  sliceSize: number;
} {
  const zySize = Math.ceil(avro.sizeY / 32) * Math.ceil(avro.sizeZ / 32);
  const sliceSize = Math.floor(200 / zySize);
  const schems: AvroSchematic[] = [];
  let currOffset = 0;

  let remainingBlockdatas = avro.blockdatas.slice();

  while (true) {
    const chunksSlice = avro.chunks.splice(0, zySize * sliceSize);
    if (chunksSlice.length === 0) break;

    const chunkCountX = chunksSlice.length / zySize;
    const blockXStart = currOffset * 32;
    const blockXEnd = blockXStart + chunkCountX * 32;

    const blockdatasSlice: AvroBlockdata[] = [];
    const stillRemaining: AvroBlockdata[] = [];
    for (const bd of remainingBlockdatas) {
      if (bd.blockX >= blockXStart && bd.blockX < blockXEnd) {
        blockdatasSlice.push({ ...bd, blockX: bd.blockX - blockXStart });
      } else {
        stillRemaining.push(bd);
      }
    }
    remainingBlockdatas = stillRemaining;

    for (const chunk of chunksSlice) chunk.x -= currOffset;

    schems.push({
      headers: avro.headers,
      name: avro.name,
      x: 0,
      y: 0,
      z: 0,
      sizeX: Math.min(avro.sizeX, sliceSize * 32),
      sizeY: avro.sizeY,
      sizeZ: avro.sizeZ,
      chunks: chunksSlice,
      blockdatas: blockdatasSlice,
      globalX: 0,
      globalY: 0,
      globalZ: 0,
      tail_magic: avro["tail_magic"],
    });
    currOffset += sliceSize;
  }

  if (remainingBlockdatas.length > 0) {
    throw new Error(
      `out of range blockdata amount:${remainingBlockdatas.length}\n` +
        JSON.stringify(remainingBlockdatas),
    );
  }

  return { schems, sliceSize };
}

// ---- 公開API ----

export function parseBloxdschem(buffer: Uint8Array<ArrayBuffer>): Schematic {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const avro = fullSchema.fromBuffer(
    Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength),
  ) as AvroSchematic;

  return avroSchematicToObjectSchematic(avro);
}

const HEADER_DEFAULT = Buffer.from([0x04, 0x00, 0x00, 0x00]);
const TAIL_MAGIC = Buffer.from([0x00, 0x00]);
export function writeBloxdschem(schem: Schematic): Uint8Array<ArrayBufferLike> {
  return fullSchema.toBuffer(objectSchmeticToAvroSchematic(schem));
}
