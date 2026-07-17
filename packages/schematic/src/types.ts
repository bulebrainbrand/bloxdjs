export type Blocks = number[];

export interface Chunk {
  // Chunk pos
  pos: [number, number, number];
  blocks: Blocks;
}

export interface Schematic {
  name: string;
  pos: [number, number, number];
  size: [number, number, number];
  chunks: Chunk[];
  blockdatas: BlockData[];
}

export interface BlockData {
  blockX: number;
  blockY: number;
  blockZ: number;
  blockdataStr: string;
}

export interface WriteResult {
  schems: Uint8Array[];
  sliceSize: number;
}

export interface AvroBlockdata {
  blockX: number;
  blockY: number;
  blockZ: number;
  blockdataStr: string;
}

export interface AvroChunk {
  x: number;
  y: number;
  z: number;
  blocks: Buffer;
}

export interface AvroSchematic {
  headers: Buffer;
  name: string;
  x: number;
  y: number;
  z: number;
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  chunks: AvroChunk[];
  blockdatas: AvroBlockdata[];
  globalX: number;
  globalY: number;
  globalZ: number;
  tail_magic: Buffer;
}
