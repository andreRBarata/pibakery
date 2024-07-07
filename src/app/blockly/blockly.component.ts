import { Component, OnInit } from '@angular/core';

import { Blockly } from '../../pibakery-blocks/blockly';
import { toolbox } from '../../pibakery-blocks/toolbox';

@Component({
  selector: 'app-blockly',
  template: `<div id="blocklyDiv"></div>`,
  styles: `
    #blocklyDiv {
      height: 50%;
      width: 100%;
      border: 0px solid #ccc;
      padding-left: 0;
      height: 100%;
    }

    #blockly_editor {
      width: 100%;
      height: calc(100% - 70px);
      display: none;
    }
  `
})
export class BlocklyComponent implements OnInit {
  private workspace!: Blockly.WorkspaceSvg;

  ngOnInit() {
    this.workspace = Blockly.inject('#blocklyDiv', {
      readOnly: false,
      media: 'media/',
      trashcan: true,
      move: {
        scrollbars: false,
        drag: true,
        wheel: true
      },
      toolbox
    });
  }

  importWorkspace(workspace: { [key: string]: any }) {
    return Blockly.serialization.workspaces.load(workspace, this.workspace);
  }

  exportWorkspace() {
    return Blockly.serialization.workspaces.save(this.workspace);
  }
}
