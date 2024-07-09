import { dirname, join, basename } from 'path';
import { program } from 'commander';
import { Blockly } from '../pibakery-blocks/blockly';
import { generateScript } from './lib/scripts';
import { createImage, updateImage } from './lib/image';
import { generator } from './lib/generator';

const workspace = new Blockly.Workspace();

program
  .command('create <baseImage> <recipe> [destination]')
  .description('Create a new image using a base image and a recipe')
  .action((baseImage, recipe, destination) => {
    Blockly.serialization.workspaces.load(require(recipe), workspace);

    generateScript(generator, workspace)
      .then((scripts) =>
        createImage(
          baseImage,
          destination ||
            join(dirname(baseImage), basename(recipe, 'json') + '.img'),
          scripts
        )
      )
      .then(() => console.log('Image Created'));
  });

program
  .command('update <image> <recipe>')
  .description('Update existing image using a recipe')
  .action((image, recipe) => {
    Blockly.serialization.workspaces.load(require(recipe), workspace);

    generateScript(generator, workspace)
      .then((scripts) => updateImage(image, scripts))
      .then(() => console.log('Image Updated'));
  });

program.parse();
