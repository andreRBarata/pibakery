import * as Fs from 'fs';

type InitialParameters<F extends AnyFunction> =
  Parameters<F> extends [...infer InitPs, any] ? InitPs : never;

export type AnyFunction = (...args: any[]) => any;
export type Promisify<
  T extends (...args: [...InitPs, TCb]) => any,
  InitPs extends unknown[] = unknown[],
  TCb extends AnyFunction = AnyFunction
> = (...args: InitPs) => Promise<Parameters<TCb>[1]>;
export type PromisifyAll<
  T extends { [_: string | number]: AnyFunction | unknown }
> = {
  [K in keyof T]: T[K] extends AnyFunction ? Promisify<T[K]> : T[K];
};
export type ImageFs = PromisifyAll<typeof Fs>;
