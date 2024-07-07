import * as Blockly from 'blockly';
import { transformedBlocks } from './toolbox';

Blockly.Blocks['onboot'] = {
  init() {
    this.appendDummyInput().appendField('On Every Boot');
    this.setNextStatement(true);
    this.setColour(20);
    this.setTooltip(
      "This is a very long description of how this block works, which has been placed into a space which is only meant for a URL. Hopefully Blockly allows this to be placed here, and doesn't check for a URL with regex or such. Anyway, onto the description of this block. This is the block that is used to select what other blocks run when the Raspberry Pi is first booted up. Lets see if we can fit some more words."
    );
  }
};

Blockly.Blocks['onfirstboot'] = {
  init() {
    this.appendDummyInput().appendField('On First Boot');
    this.setNextStatement(true);
    this.setColour(20);
  }
};

Blockly.Blocks['onnextboot'] = {
  init() {
    this.appendDummyInput().appendField('On Next Boot');
    this.setNextStatement(true);
    this.setColour(20);
  }
};

Blockly.defineBlocksWithJsonArray(transformedBlocks);

export { Blockly };
