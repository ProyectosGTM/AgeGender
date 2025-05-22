import { Component, OnInit } from '@angular/core';
import { MedalsInfo, Service } from './app.service';
import { AgeGenderService } from '../services/agegender.service';

@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.component.html',
  styleUrl: './tablero.component.scss',
  providers: [Service],
})
export class TableroComponent implements OnInit {
  olympicMedals: MedalsInfo[];
  public informacion: any;
  public informacionGrid: any;
  public edadesAgrupadas: any;
  public edadesMujeres: any;
  public edadesHombres: any;
  public totalHombres: any
  public totalMujeres: any
  public totalGeneral: any
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna"
  public loading: boolean = false;
  public loadingMessage: string = 'Cargando...';

  constructor(service: Service, private genService: AgeGenderService) {
    this.olympicMedals = service.getMedalsData();
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  pointClickHandler(arg) {
    arg.target.select();
  }

  ngOnInit(): void {
    this.obtenerDatos()
  }

  obtenerDatos() {
    this.genService.obtenerGender().subscribe((response) => {
      const hombres = response.filter((item: any) => item.genero.toLowerCase() === 'hombre');
      const mujeres = response.filter((item: any) => item.genero.toLowerCase() === 'mujer');

      this.informacionGrid = response;

      this.informacion = [
        {
          etiqueta: 'Hombres',
          value: hombres.length,
          colors: 2
        },
        {
          etiqueta: 'Mujeres',
          value: mujeres.length,
          colors: 1,
        }
      ];

    
      const grupo_0_20_m = mujeres.filter((item: any) => item.edad >= 0 && item.edad <= 20).length;
      const grupo_21_40_m = mujeres.filter((item: any) => item.edad >= 21 && item.edad <= 40).length;
      const grupo_41_60_m = mujeres.filter((item: any) => item.edad >= 41 && item.edad <= 60).length;
      const grupo_61_mas_m = mujeres.filter((item: any) => item.edad >= 61).length;

      this.edadesMujeres = [
        { etiqueta: '0 - 20', value: grupo_0_20_m, color: 1 },
        { etiqueta: '21 - 40', value: grupo_21_40_m, color: 2 },
        { etiqueta: '41 - 60', value: grupo_41_60_m, color: 3 },
        { etiqueta: '61+', value: grupo_61_mas_m, color: 4 }
      ];

    
      const grupo_0_20_h = hombres.filter((item: any) => item.edad >= 0 && item.edad <= 20).length;
      const grupo_21_40_h = hombres.filter((item: any) => item.edad >= 21 && item.edad <= 40).length;
      const grupo_41_60_h = hombres.filter((item: any) => item.edad >= 41 && item.edad <= 60).length;
      const grupo_61_mas_h = hombres.filter((item: any) => item.edad >= 61).length;

      this.edadesHombres = [
        { etiqueta: '0 - 20', value: grupo_0_20_h, color: 1 },
        { etiqueta: '21 - 40', value: grupo_21_40_h, color: 2 },
        { etiqueta: '41 - 60', value: grupo_41_60_h, color: 3 },
        { etiqueta: '61+', value: grupo_61_mas_h, color: 4 }
      ];

    
      this.edadesAgrupadas = [
        { etiqueta: '0 - 20', value: grupo_0_20_h + grupo_0_20_m, color: 1 },
        { etiqueta: '21 - 40', value: grupo_21_40_h + grupo_21_40_m, color: 2 },
        { etiqueta: '41 - 60', value: grupo_41_60_h + grupo_41_60_m, color: 3 },
        { etiqueta: '61+', value: grupo_61_mas_h + grupo_61_mas_m, color: 4 }
      ];

    
      this.totalHombres = hombres.length;
      this.totalMujeres = mujeres.length;
      this.totalGeneral = response.length;
    });
  }


  customizeTooltip = (pointInfo: any) => {
    return {
      text: `${pointInfo.argument}:   ${pointInfo.value}`
    };
  };


  customizeEdadTooltip = (pointInfo: any) => {
    return {
      text: `${pointInfo.argumentText} Años:   ${pointInfo.valueText} Personas`
    };
  };

  customizeEdadPoint = (point: any) => {
    const colorMap: { [key: number]: string } = {
      1: '#8e44ad',
      2: '#f39c12',
      3: '#16a085',
      4: '#c0392b' 
    };

    return {
      color: colorMap[point.data.color] || '#7f8c8d'
    };
  };


  customizePoint(pointInfo: any) {
    switch (pointInfo.data.colors) {
      case 1:
        return { color: '#ff69b4' }
      case 2:
        return { color: '#4a90e2' }
    }
  };

  customizeEdadMujeresPoint = (point: any) => {
    const colorMap: { [key: number]: string } = {
      1: '#ff69b4',
      2: '#f06292',
      3: '#ec407a',
      4: '#c2185b' 
    };
    return {
      color: colorMap[point.data.color] || '#e1bee7'
    };
  };


  customizeEdadHombresTooltip = (pointInfo: any) => {
    return {
      text: `${pointInfo.argumentText}:   ${pointInfo.value} Hombres`
    };
  };

  customizeEdadHombresPoint = (point: any) => {
    const colorMap: { [key: number]: string } = {
      1: '#0d6efd',
      2: '#3b8beb',
      3: '#5caeff',
      4: '#b6d4fe' 
    };
    return {
      color: colorMap[point.data.color] || '#cfd8dc'
    };
  };



  customizeEdadMujeresTooltip = (pointInfo: any) => {
    return {
      text: `${pointInfo.argumentText}:   ${pointInfo.value} Mujeres`
    };
  };


  capitalizarGenero = (data: any) => {
    return data.genero.charAt(0).toUpperCase() + data.genero.slice(1).toLowerCase();
  };

  formatearFecha = (data: any) => {
    const fecha = new Date(data.fecha);

    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = fecha.toLocaleString('en-US', { month: 'short' });
    const anio = fecha.getFullYear();
    const hora = fecha.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${dia}-${mes}-${anio} ${hora}`;
  };

}