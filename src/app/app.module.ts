import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BlocklyComponent } from './blockly/blockly.component';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  imports: [BrowserModule, NgbModalModule],
  declarations: [AppComponent, BlocklyComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
