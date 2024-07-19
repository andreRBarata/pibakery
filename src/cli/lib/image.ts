import * as Fs from 'fs/promises';
import { join } from 'path';
import { ScriptData } from './scripts';
import { interact } from 'balena-image-fs';
import { copyToImage, expandGlobPaths, promisifyAll } from './helpers';
import { ImageFs } from '../types';

// the drive has been mounted, now write the scripts to it
const writeBootScripts = (
  imageFS: ImageFs,
  data: ScriptData,
  includedDirs: Array<{ source: string; destination: string }> = []
) =>
  expandGlobPaths([
    {
      source: join(__dirname, '../../pibakery-raspbian', '**'),
      destination: '/usr/lib/PiBakery/pibakery-raspbian'
    },
    {
      source: join(
        __dirname,
        '../../pibakery-raspbian/etc/systemd/system/pibakery.service'
      ),
      destination: '/etc/systemd/system/pibakery.service'
    },
    {
      source: join(__dirname, '../../pibakery-raspbian/opt/**'),
      destination: '/opt'
    },
    // convert the data object into blocks to copy
    ...data.blockPaths.map((source: string, i: number) => ({
      source: join(__dirname, '../..', source, '**'),
      destination: join('/usr/lib/PiBakery/blocks/', data.blocks[i])
    })),
    ...includedDirs
  ])
    .then((workPaths) =>
      Promise.all([
        ...workPaths.map(({ source, destination }) =>
          copyToImage(imageFS, source, destination)
        ),
        imageFS.symlink(
          '/etc/systemd/system/pibakery.service',
          '/etc/systemd/system/multi-user.target.wants/pibakery.service'
        ),
        imageFS
          .access('/lib/systemd/system/lightdm.service')
          .then(() =>
            copyToImage(
              imageFS,
              join(
                __dirname,
                '../../pibakery-raspbian/lib/systemd/system/lightdm.service'
              ),
              '/lib/systemd/system/lightdm.service'
            )
          )
          .catch(() =>
            copyToImage(
              imageFS,
              join(
                __dirname,
                '../../pibakery-raspbian/opt/PiBakery/console-lite.sh'
              ),
              '/opt/PiBakery/console.sh'
            )
          )
      ])
    )
    .then(() =>
      Promise.all(
        [
          {
            file: '/usr/lib/PiBakery/everyBoot.sh',
            contents: data.everyBoot
          },
          {
            file: '/usr/lib/PiBakery/firstBoot.sh',
            contents: data.firstBoot
          },
          {
            file: '/usr/lib/PiBakery/nextBoot.sh',
            contents: data.nextBoot
          },
          {
            file: '/usr/lib/PiBakery/recipe.json',
            contents: data.json
          },
          {
            file: '/usr/lib/PiBakery/runFirstBoot',
            contents: ''
          },
          {
            file: '/usr/lib/PiBakery/runNextBoot',
            contents: ''
          },
          ...['EveryBoot', 'FirstBoot', 'NextBoot']
            .filter((fileName, i) => !!data.waitForNetwork[i])
            .map((fileName) => ({
              file: join('/usr/lib/PiBakery/', 'waitForNetwork' + fileName),
              contents: ''
            }))
        ].map(({ file, contents }) => imageFS.writeFile(file, contents))
      )
    );

const installPiBakery = (
  imagePath: string,
  data: ScriptData,
  includedDirs: Array<{ source: string; destination: string }> = []
) =>
  interact(imagePath, 2, (imageFS) =>
    writeBootScripts(promisifyAll(imageFS), data, includedDirs)
  );

export const updateImage = (
  imagePath: string,
  script: ScriptData,
  includedDirs: Array<{ source: string; destination: string }> = []
) => installPiBakery(imagePath, script, includedDirs);

export const createImage = (
  baseImagePath: string,
  imageDestination: string,
  script: ScriptData,
  includedDirs: Array<{ source: string; destination: string }> = []
) =>
  Fs.copyFile(baseImagePath, imageDestination).then(() =>
    installPiBakery(imageDestination, script, includedDirs)
  );
