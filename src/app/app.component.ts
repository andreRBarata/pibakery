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
  @ViewChild('importModal') private importModal!: TemplateRef<any>;
  @ViewChild('exportModal') private exportModal!: TemplateRef<any>;

  private modalService = inject(NgbModal);

  public exportedWorkspace!: string;

  readFile<T = any>(file: File): Promise<T> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.addEventListener('loadend', () =>
        resolve(JSON.parse((fileReader.result || '').toString()))
      );
      fileReader.addEventListener('error', reject);

      fileReader.readAsText(file);
    });
  }

  createFileUrl(fileContents: string) {
    const fileType = 'text/json';

    if (!fileContents) {
      return '';
    }

    return `data:${fileType};charset=utf-8,${encodeURIComponent(fileContents)}`;
  }

  import() {
    const { result } = this.modalService.open(this.importModal);

    result
      .then((file) => this.readFile(file))
      .then((fileContents) => this.blockly.importWorkspace(fileContents));
  }

  export() {
    this.exportedWorkspace = JSON.stringify(
      this.blockly.exportWorkspace(),
      undefined,
      3
    );

    this.modalService.open(this.exportModal);
  }
}
