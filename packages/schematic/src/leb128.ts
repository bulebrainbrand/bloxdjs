export function decodeLEB128(buf: Buffer, offset: { i: number }): number {
  let shift = 0;
  let value = 0;
  while (true) {
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
