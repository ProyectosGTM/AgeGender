import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AgeAgenderRoutingModule } from './age-agender-routing.module';
import { UIModule } from 'src/app/shared/ui/ui.module';
import { TableroComponent } from './tablero/tablero.component';
import { DxButtonModule, DxChartModule, DxDataGridModule, DxDateBoxModule, DxLoadPanelModule, DxPieChartModule, DxSelectBoxModule, DxTemplateModule } from 'devextreme-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxiValueAxisModule } from 'devextreme-angular/ui/nested';


@NgModule({
  declarations: [TableroComponent],
  imports: [
    CommonModule,
    AgeAgenderRoutingModule,
    UIModule,
    DxPieChartModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxChartModule,
    FormsModule,
    ReactiveFormsModule,
    DxiValueAxisModule,
    DxTemplateModule,
    DxSelectBoxModule,
    DxDateBoxModule,
    DxButtonModule
  ]
})
export class AgeAgenderModule { }
