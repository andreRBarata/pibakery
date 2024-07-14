import { glob } from 'glob';
import { resolve, relative, join, dirname, sep } from 'path';
import { readFile } from 'fs/promises';
import { promisify as _promisify } from 'util';
import { AnyFunction, ImageFs, Promisify, PromisifyAll } from '../types';

export const getBlockPathMap = (): Promise<Record<string, string>> =>
  glob(resolve(__dirname, '../../pibakery-blocks/*/*.json'))
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
          [blockName]: relative(join(__dirname, '../../'), dirname(blockPath))
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

export const expandGlobPaths = (
  workPaths: Array<{ source: string; destination: string }>
) =>
  Promise.all(
    workPaths.map((workPath) => {
      if (!workPath.source.endsWith('**')) {
        return Promise.resolve([workPath]);
      }

      return glob(workPath.source, { nodir: true }).then((newSources) =>
        newSources.map((newSource) => ({
          source: newSource,
          destination: join(
            workPath.destination,
            relative(dirname(workPath.source), newSource)
          )
        }))
      );
    })
  ).then((newPaths) => newPaths.flatMap((workPath) => workPath));

export const copyFileToImage = (
  imageFs: ImageFs,
  source: string,
  destination: string
) => {
  console.log(
    'Copying',
    relative(join(__dirname, '../..'), source),
    'to',
    destination
  );

  return readFile(source)
    .then((contents) => imageFs.writeFile(destination, contents))
    .then(() => imageFs.chmod(destination, 0o755));
};

export const imageFsRecursiveMkdir = (imageFs: ImageFs, dirPath: string) =>
  dirPath
    .split(sep)
    .filter((pathSegment) => pathSegment !== '')
    .map((pathSegment, i, splitPath) =>
      join('/', ...(splitPath.slice(0, i + 1) || []))
    )
    .reduce(
      (promise, currDirPath) =>
        promise.then(() => imageFs.mkdir(currDirPath).catch(() => {})),
      Promise.resolve()
    );

export const copyToImage = (
  imageFS: ImageFs,
  source: string,
  destination: string
) =>
  imageFsRecursiveMkdir(imageFS, dirname(destination)).then(() =>
    copyFileToImage(imageFS, source, destination)
  );

export const promisify = <T extends AnyFunction>(func: T) =>
  _promisify(func) as Promisify<T>;

export const promisifyAll = <
  T extends { [_: string | number]: AnyFunction | unknown }
>(
  obj: T
) =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      typeof value === 'function' ? promisify(value as AnyFunction) : value
    ])
  ) as PromisifyAll<T>;
