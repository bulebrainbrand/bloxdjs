export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export const isOk = <T>(result: Result<T, unknown>): result is Ok<T> =>
  result.ok;

export const isErr = <E>(result: Result<unknown, E>): result is Err<E> =>
  !result.ok;

export const match = <T, E, RT, RE>(
  result: Result<T, E>,
  funcs: { ok: (value: T) => RT; err: (error: E) => RE },
): Result<RT, RE> => {
  if (isOk(result)) {
    return ok(funcs.ok(result.value));
  }
  return err(funcs.err(result.error));
};

export const unwrap = <T>(result: Result<T, unknown>): T => {
  if (result.ok) {
    return result.value;
  }
  throw new TypeError(`unwrap Err<${String(result.error)}>`);
};
