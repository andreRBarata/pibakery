import { dirname, resolve, join, basename } from 'path';
import { program } from 'commander';
import { Blockly } from '../pibakery-blocks/blockly';
import { generateScript } from './lib/scripts';
import { createImage, updateImage } from './lib/image';
import { generator } from './lib/generator';

const workspace = new Blockly.Workspace();

const collect = (
  value: string,
  previous: Array<{ source: string; destination: string }>
) => {
  const [source, destination] = value.split('=');

  return previous.concat([{ source: resolve(source), destination }]);
};

program
  .command('create <baseImage> <recipe> [destination]')
  .option('-i, --include <file>', 'Paths to include in the image', collect, [])
  .description('Create a new image using a base image and a recipe')
  .action((baseImage, recipe, destination, options) => {
    Blockly.serialization.workspaces.load(require(recipe), workspace);

    generateScript(generator, workspace)
      .then((scripts) =>
        createImage(
          baseImage,
          destination ||
            join(dirname(baseImage), basename(recipe, '.json') + '.img'),
          scripts,
          options.include
        )
      )
      .then(() => console.log('Image Created'));
  });

program
  .command('update <image> <recipe>')
  .option('-i, --include <file>', 'Paths to include in the image', collect, [])
  .description('Update existing image using a recipe')
  .action((image, recipe, options) => {
    Blockly.serialization.workspaces.load(require(recipe), workspace);

    generateScript(generator, workspace)
      .then((scripts) => updateImage(image, scripts, options.include))
      .then(() => console.log('Image Updated'));
  });

program.parse();
