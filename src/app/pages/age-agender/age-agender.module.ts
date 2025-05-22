import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AgeAgenderRoutingModule } from './age-agender-routing.module';
import { UIModule } from 'src/app/shared/ui/ui.module';
import { TableroComponent } from './tablero/tablero.component';
import { DxDataGridModule, DxLoadPanelModule, DxPieChartModule } from 'devextreme-angular';


@NgModule({
  declarations: [TableroComponent],
  imports: [
    CommonModule,
    AgeAgenderRoutingModule,
    UIModule,
    DxPieChartModule,
    DxDataGridModule,
    DxLoadPanelModule
  ]
})
export class AgeAgenderModule { }
