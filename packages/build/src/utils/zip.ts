export function* zip<const Arg extends unknown[][]>(
  ...arrays: Arg
): Generator<
  { [K in keyof Arg]: Arg[K] extends (infer U)[] ? U : never },
  void,
  unknown
> {
  if(arrays.length === 0)return;
  const minLength = Math.min(...arrays.map((a) => a.length));
  for (let i = 0; i < minLength; i++) {
    // this is the only method
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    yield arrays.map((a) => a[i]) as any;
  }
}
