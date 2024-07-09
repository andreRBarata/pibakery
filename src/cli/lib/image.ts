import * as Fs from 'fs/promises';
import { join, relative } from 'path';
import { ScriptData } from './scripts';
import { interact } from 'balena-image-fs';
import { copyToImage, expandGlobPaths, promisifyAll } from './helpers';
import { ImageFs } from '../types';

const createPiBakeryDirectory = ({ mkdir }: ImageFs) =>
  mkdir('/PiBakery', { recursive: true });

const modifyCmdlineTxt = ({ readFile, writeFile }: ImageFs) => {
  // move /cmdline.txt to /PiBakery/cmdline.txt.original
  const source = '/cmdline.txt';
  const destination = '/PiBakery/cmdline.txt.original';
  const parseCmdline = (fileContents: string) =>
    Object.fromEntries(
      fileContents
        .trim()
        .split(' ')
        .map((field) => field.split('='))
    );
  const toCmdline = (cmdline: Record<string, string>) =>
    Object.entries(cmdline)
      .map((line) => line.filter((seg) => !!seg).join('='))
      .join(' ');

  // only do this if /PiBakery/cmdline.txt.original doesn't already exist
  return readFile(source)
    .then((buffer) =>
      writeFile(destination, buffer)
        .then(() => ({
          ...parseCmdline(buffer.toString('utf8')),
          root: '/dev/mmcblk0p1',
          rootfstype: 'vfat',
          rootflags: 'umask=000',
          init: '/PiBakery/pibakery-mount.sh'
        }))
        .then((cmdline: Record<string, string>) =>
          writeFile(source, toCmdline(cmdline), { encoding: 'utf8', flag: 'w' })
        )
    )
    .catch((err) => console.log('cmdline already patched: ', err));
};

// the drive has been mounted, now write the scripts to it
const writeBootScripts = (imageFS: ImageFs, data: ScriptData) => {
  // write scripts, and then unmount and remove kpartx mappings if necessary
  return expandGlobPaths([
    {
      source: join(__dirname, '../resources/busybox'),
      destination: '/PiBakery/busybox'
    },
    {
      source: join(__dirname, '../resources/pibakery-mount.sh'),
      destination: '/PiBakery/pibakery-mount.sh'
    },
    {
      source: join(__dirname, '../resources/pibakery-install.sh'),
      destination: '/PiBakery/pibakery-install.sh'
    },
    {
      source: join(__dirname, '../../pibakery-raspbian', '**'),
      destination: '/PiBakery/pibakery-raspbian'
    },
    // convert the data object into blocks to copy
    ...data.blockPaths.map((source: string, i: number) => ({
      source: join(__dirname, '../..', source, '**'),
      destination: join('/PiBakery/blocks/', data.blocks[i])
    }))
  ])
    .then((workPaths) =>
      Promise.all(
        workPaths.map(({ source, destination }) =>
          copyToImage(imageFS, source, destination)
        )
      )
    )
    .then(() =>
      Promise.all(
        [
          {
            file: '/PiBakery/everyBoot.sh',
            contents: data.everyBoot
          },
          {
            file: '/PiBakery/firstBoot.sh',
            contents: data.firstBoot
          },
          {
            file: '/PiBakery/nextBoot.sh',
            contents: data.nextBoot
          },
          {
            file: '/PiBakery/recipe.json',
            contents: data.json
          },
          {
            file: '/PiBakery/runFirstBoot',
            contents: ''
          },
          {
            file: '/PiBakery/runNextBoot',
            contents: ''
          },
          ...['EveryBoot', 'FirstBoot', 'NextBoot']
            .filter((fileName, i) => !!data.waitForNetwork[i])
            .map((fileName) => ({
              file: join('/PiBakery/', 'waitForNetwork' + fileName),
              contents: ''
            }))
        ].map(({ file, contents }) => imageFS.writeFile(file, contents))
      )
    );
};

const installPiBakery = (imagePath: string, data: ScriptData) => {
  return interact(imagePath, 1, (imageFS) => {
    const promisifiedFS = promisifyAll(imageFS);

    return createPiBakeryDirectory(promisifiedFS)
      .then(() => modifyCmdlineTxt(promisifiedFS))
      .then(() => writeBootScripts(promisifiedFS, data));
  });
};

export const updateImage = (imagePath: string, script: ScriptData) =>
  installPiBakery(imagePath, script);

export const createImage = (
  baseImagePath: string,
  imageDestination: string,
  script: ScriptData
) =>
  Fs.copyFile(baseImagePath, imageDestination).then(() =>
    installPiBakery(imageDestination, script)
  );
