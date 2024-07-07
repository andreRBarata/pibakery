import { mkdir, access, copyFile, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { ScriptData } from './scripts';
import { interact } from 'balena-image-fs';
import { promisify } from './helpers';


const createPiBakeryDirectory = (mountpoint: string) => {
  const pibakeryDir = join(mountpoint, 'PiBakery');

  return mkdir(pibakeryDir, { recursive: true });
};

const modifyCmdlineTxt = (mountpoint: string) => {
  // move /cmdline.txt to /PiBakery/cmdline.txt.original
  const source = join(mountpoint, 'cmdline.txt');
  const destination = join(mountpoint, 'PiBakery/cmdline.txt.original');
  const parseCmdline = (fileContents: string) =>
    Object.fromEntries(
      fileContents
        .trim()
        .split(' ')
        .map((field) => field.split('='))
    );
  const toCmdline = (cmdline: Record<string, string>) =>
    Object.entries(cmdline)
      .map((line) => line.join('='))
      .join(' ');

  // only do this if /PiBakery/cmdline.txt.original doesn't already exist
  return access(destination).catch(() =>
    copyFile(source, destination)
      .then(() => readFile(destination))
      .then((buffer) => ({
        ...parseCmdline(buffer.toString('utf8')),
        root: '/dev/mmcblk0p1',
        rootfstype: 'vfat',
        rootflags: 'umask=000',
        init: '/PiBakery/pibakery-mount.sh'
      }))
      .then((cmdline: Record<string, string>) =>
        writeFile(source, toCmdline(cmdline))
      )
  );
};

// the drive has been mounted, now write the scripts to it
const writeBootScripts = (mountpoint: string, data: ScriptData) => {
  // write scripts, and then unmount and remove kpartx mappings if necessary
  return Promise.all(
    [
      {
        source: join(__dirname, '../resources/busybox'),
        destination: join(mountpoint, 'PiBakery/busybox')
      },
      {
        source: join(__dirname, '../resources/pibakery-mount.sh'),
        destination: join(mountpoint, 'PiBakery/pibakery-mount.sh')
      },
      {
        source: join(__dirname, '../resources/pibakery-install.sh'),
        destination: join(mountpoint, 'PiBakery/pibakery-install.sh')
      },
      {
        source: join(__dirname, '../pibakery-raspbian'),
        destination: join(mountpoint, 'PiBakery/pibakery-raspbian')
      },
      // convert the data object into blocks to copy
      ...data.blockPaths.map((source: string, i: number) => ({
        source,
        destination: join(mountpoint, 'PiBakery/blocks/', data.blocks[i])
      }))
    ].map(({ source, destination }) => copyFile(source, destination))
  ).then(() =>
    Promise.all(
      [
        {
          file: join(mountpoint, 'PiBakery/everyBoot.sh'),
          contents: data.everyBoot
        },
        {
          file: join(mountpoint, 'PiBakery/firstBoot.sh'),
          contents: data.firstBoot
        },
        {
          file: join(mountpoint, 'PiBakery/nextBoot.sh'),
          contents: data.nextBoot
        },
        {
          file: join(mountpoint, 'PiBakery/recipe.json'),
          contents: data.json
        },
        {
          file: join(mountpoint, 'PiBakery/runFirstBoot'),
          contents: ''
        },
        {
          file: join(mountpoint, 'PiBakery/runNextBoot'),
          contents: ''
        },
        ...['EveryBoot', 'FirstBoot', 'NextBoot']
          .filter((fileName, i) => !!data.waitForNetwork[i])
          .map((fileName) => ({
            file: join(mountpoint, 'PiBakery/', 'waitForNetwork' + fileName),
            contents: ''
          }))
      ].map(({ file, contents }) => writeFile(file, contents))
    )
  );
};

const installPiBakery = (mountpoint: string, data: ScriptData) => {
  return createPiBakeryDirectory(mountpoint)
    .then(() => modifyCmdlineTxt(mountpoint))
    .then(() => writeBootScripts(mountpoint, data));
};

export const updateImage = (imagePath: string, script: ScriptData) => {
  promisify(interact)(imagePath, undefined)
    .then((fs) => )

  // see which one(s) exist
  return access(mountpoints).then(() =>
    installPiBakery(join(mountpoints[0], '../'), script)
  );
};
