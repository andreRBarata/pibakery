import { glob } from 'glob';
import path from 'path';
import {promisify as _promisify} from 'util';

export const getBlockPathMap = (): Promise<Record<string, string>> =>
  glob(path.resolve(__dirname, '../pibakery-blocks/*/*.json'))
    .then((blocks) =>
      blocks.map((blockPath) => ({
        blockName: require(blockPath).name,
        blockPath
      }))
    )
    .then((blocks) =>
      blocks.reduce(
        (acc, { blockName, blockPath }) => ({
          ...acc,
          [blockName]: path.relative(path.join(__dirname, '../'), blockPath)
        }),
        {}
      )
    );

export const bashEscape = (arg: string) => {
  // Thanks to creationix on GitHub
  const safePattern = /^[a-z0-9_\/\-.,?:@#%^+=\[\]]*$/i;
  const safeishPattern = /^[a-z0-9_\/\-.,?:@#%^+=\[\]{}|&()<>; *']*$/i;
  const reverseString = (str: string) => str.split('').reverse().join('');
  const quote = (value: string, q = "'") => `${q}${value}${reverseString(q)}`;

  if (safePattern.test(arg)) {
    return arg;
  }

  if (safeishPattern.test(arg)) {
    return quote(arg, '"');
  }

  return quote(
    arg.replace(/'+/g, (val) => {
      if (val.length < 3) {
        return quote(val.replace(/'/g, "\\'"));
      }

      return quote(val, `'"`);
    })
  );
};


type InitialParameters<F extends (...args: any) => any> =
  Parameters<F> extends [...infer InitPs, any] ? InitPs : never;

type Promisify<T extends (...args: [...any[], TCb]) => any, TCb extends (...args: any[]) => any> = (func: T) => (... args: InitialParameters<T>) => Promise<Parameters<TCb>[0]>;

export const promisify = <T extends (...args: any) => any, TCb extends (...args: any[]) => any>(func: T) => (_promisify as Promisify<T, TCb>)(func);