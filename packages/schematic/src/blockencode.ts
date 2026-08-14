import type { Chunk, SchemaObjectChunk } from "./schemas/types";

export function decodeBlocks(buf: Buffer): number[] {
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

export function encodeBlocks(blocks: number[]): Buffer {
  if (blocks.length === 0) {
    return Buffer.from([]);
  }
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

export function decodeLEB128(buf: Buffer, offset: { i: number }): number {
  let shift = 0;
  let value = 0;
  while (true) {
    if (offset.i >= buf.length) {
      throw new Error(
        `Truncated LEB128: buffer ended at offset ${offset.i} before terminating byte`,
      );
    }
    const byte = buf[offset.i++];
    value |= (byte! & 0x7f) << shift;
    shift += 7;
    if ((byte! & 0x80) === 0) break;
  }
  return value;
}

export function encodeLEB128(value: number): number[] {
  const bytes: number[] = [];
  while ((value & -128) !== 0) {
    bytes.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  bytes.push(value);
  return bytes;
}

export function decodeChunks(chunks: SchemaObjectChunk[]): Chunk[] {
  return chunks.map(({ x, y, z, blocks }) => ({
    pos: [x, y, z],
    blocks: decodeBlocks(blocks),
  }));
}

export function encodeChunks(chunks: Chunk[]): SchemaObjectChunk[] {
  return chunks.map(({ pos: [x, y, z], blocks }) => ({
    x,
    y,
    z,
    blocks: encodeBlocks(blocks),
  }));
}
