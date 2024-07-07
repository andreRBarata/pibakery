import { Component, TemplateRef, ViewChild, inject } from '@angular/core';
import { BlocklyComponent } from './blockly/blockly.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  @ViewChild(BlocklyComponent) private blockly!: BlocklyComponent;
  @ViewChild('content') private content!: TemplateRef<any>;

  private modalService = inject(NgbModal);

  import() {
    this.modalService.open(this.content);
  }

  export() {
    const workspace = this.blockly.exportWorkspace();
    const fileData = JSON.stringify(workspace, undefined, 3);
    const fileType = 'text/json';

    const blob = new Blob([fileData], { type: fileType });
    const url = URL.createObjectURL(blob);

    window.open(url);
  }
}
