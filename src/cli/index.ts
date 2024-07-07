import { BlockConfig } from '../types';

import { program } from 'commander';
import { Blockly } from '../pibakery-blocks/blockly';
import { blocks } from '../pibakery-blocks/blocks';
import { bashEscape } from './lib/helpers';
import { generateScript } from './lib/scripts';

program.option('--first').option('-s, --separator <char>');

program.parse();

const options = program.opts();

const generator = new Blockly.CodeGenerator('PiBakery');

generator.forBlock['onboot'] = (block, _generator) =>
  '_pibakery-oneveryboot ' +
  block
    .getChildren(true)
    .map((child) => _generator.blockToCode(child))
    .join();

generator.forBlock['onfirstboot'] = (block, _generator) =>
  '_pibakery-onfirstboot ' +
  block
    .getChildren(true)
    .map((child) => _generator.blockToCode(child))
    .join();

generator.forBlock['onnextboot'] = (block, _generator) =>
  '_pibakery-onnextboot ' +
  block
    .getChildren(true)
    .map((child) => _generator.blockToCode(child))
    .join();

Object.entries(blocks).forEach(
  ([blockName, blockJSON]: [string, BlockConfig]) => {
    generator.forBlock[blockName] = (block) => {
      let code =
        '\n\tchmod 755 /boot/PiBakery/blocks/' +
        blockName +
        '/' +
        blockJSON.script +
        '\n\t/boot/PiBakery/blocks/' +
        blockName +
        '/' +
        blockJSON.script +
        ' ';

      for (let i = 0; i < (blockJSON.args?.length || 0); i++) {
        let currentArg = bashEscape(block.getFieldValue((i + 1).toString()));

        if (currentArg === '') {
          currentArg = '""';
        }
        code = code + currentArg + ' ';
      }
      code = code.slice(0, -1);

      if (blockJSON.network) {
        code = code + '\n\tNETWORK=True';
      }

      return code;
    };
  }
);

const workspace = new Blockly.Workspace();
generator.init(workspace);

Blockly.serialization.workspaces.load(
  {
    blocks: {
      languageVersion: 0,
      blocks: [
        {
          type: 'onfirstboot',
          id: 'onfirstboot',
          x: 168,
          y: 74,
          next: {
            block: {
              type: 'dockerinstall',
              id: 'dockerinstall'
            }
          }
        }
      ]
    }
  },
  workspace
);

generateScript(generator, workspace).then((scripts) => console.log(scripts));
