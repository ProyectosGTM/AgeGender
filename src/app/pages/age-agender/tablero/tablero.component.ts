import { Component, OnInit } from '@angular/core';
import { MedalsInfo, Service } from './app.service';
import { AgeGenderService } from '../services/agegender.service';
import Swal from 'sweetalert2';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';

@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.component.html',
  styleUrl: './tablero.component.scss',
  providers: [Service],
  animations: [fadeInUpAnimation],
})
export class TableroComponent implements OnInit {
  olympicMedals: MedalsInfo[];
  public informacion: any;
  public informacionGrid: any;
  public edadesAgrupadas: any;
  public edadesMujeres: any;
  public edadesHombres: any;
  public totalHombres: any;
  public totalMujeres: any;
  public totalGeneral: any;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string =
    'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public loading: boolean = false;
  public loadingMessage: string = 'Cargando...';
  public distribucionPorHora: any;
  public fechaSeleccionada: Date = new Date();
  public fechaSeleccionadaTexto: string = this.formatearFechaTexto(
    this.fechaSeleccionada
  )

  public fechaInicio: Date = new Date();
  public fechaFin: Date = new Date();
  public resultadoRango: any;
  public buttonInfo: boolean = false;
  public buttonsFecha: boolean = true;

  constructor(service: Service, private genService: AgeGenderService) {
    this.olympicMedals = service.getMedalsData();
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  pointClickHandler(arg) {
    arg.target.select();
  }

  ngOnInit(): void {
    this.obtenerDatos();
    this.actualizarDistribucionPorHora();
  }

  manejarCambioOpciones(e: any) {
    if (e.name === 'columns' && e.fullName?.includes('groupIndex')) {
      setTimeout(() => {
        e.component.option('grouping.autoExpandAll', false);
      });
    }
  }

  actualizarDistribucionPorHora() {
    this.fechaSeleccionadaTexto = this.formatearFechaTexto(
      this.fechaSeleccionada
    );

    const fechaFormateada = this.formatearPorFecha(this.fechaSeleccionada);

    this.genService
      .obtenerDistribucionPorDia(fechaFormateada)
      .subscribe((data) => {
        const horasEsperadas = Array.from({ length: 13 }, (_, i) => {
          const hora = (i + 9).toString().padStart(2, '0');
          return `${hora}:00`;
        });

        const datosPorHora = data.reduce((acc: any, item: any) => {
          acc[item.hora] = item;
          return acc;
        }, {});

        this.distribucionPorHora = horasEsperadas.map((hora) => {
          return datosPorHora[hora] || { hora, hombre: 0, mujer: 0 };
        });
      });
  }

  obtenerDatos() {
    this.buttonsFecha = true;
    this.buttonInfo = false;
    this.loading = true;
    this.genService.obtenerGender().subscribe(
      (response) => {
        this.loading = false;
        const hombres = response.filter(
          (item: any) => item.genero.toLowerCase() === 'hombre'
        );
        const mujeres = response.filter(
          (item: any) => item.genero.toLowerCase() === 'mujer'
        );

        this.informacionGrid = response;

        this.informacion = [
          {
            etiqueta: 'Hombres',
            value: hombres.length,
            colors: 2,
          },
          {
            etiqueta: 'Mujeres',
            value: mujeres.length,
            colors: 1,
          },
        ];

        const grupo_0_20_m = mujeres.filter(
          (item: any) => item.edad >= 0 && item.edad <= 20
        ).length;
        const grupo_21_40_m = mujeres.filter(
          (item: any) => item.edad >= 21 && item.edad <= 40
        ).length;
        const grupo_41_60_m = mujeres.filter(
          (item: any) => item.edad >= 41 && item.edad <= 60
        ).length;
        const grupo_61_mas_m = mujeres.filter(
          (item: any) => item.edad >= 61
        ).length;

        this.edadesMujeres = [
          { etiqueta: '0 - 20', value: grupo_0_20_m, color: 1 },
          { etiqueta: '21 - 40', value: grupo_21_40_m, color: 2 },
          { etiqueta: '41 - 60', value: grupo_41_60_m, color: 3 },
          { etiqueta: '61+', value: grupo_61_mas_m, color: 4 },
        ];

        const grupo_0_20_h = hombres.filter(
          (item: any) => item.edad >= 0 && item.edad <= 20
        ).length;
        const grupo_21_40_h = hombres.filter(
          (item: any) => item.edad >= 21 && item.edad <= 40
        ).length;
        const grupo_41_60_h = hombres.filter(
          (item: any) => item.edad >= 41 && item.edad <= 60
        ).length;
        const grupo_61_mas_h = hombres.filter(
          (item: any) => item.edad >= 61
        ).length;

        this.edadesHombres = [
          { etiqueta: '0 - 20', value: grupo_0_20_h, color: 1 },
          { etiqueta: '21 - 40', value: grupo_21_40_h, color: 2 },
          { etiqueta: '41 - 60', value: grupo_41_60_h, color: 3 },
          { etiqueta: '61+', value: grupo_61_mas_h, color: 4 },
        ];

        this.edadesAgrupadas = [
          { etiqueta: '0 - 20', value: grupo_0_20_h + grupo_0_20_m, color: 1 },
          {
            etiqueta: '21 - 40',
            value: grupo_21_40_h + grupo_21_40_m,
            color: 2,
          },
          {
            etiqueta: '41 - 60',
            value: grupo_41_60_h + grupo_41_60_m,
            color: 3,
          },
          { etiqueta: '61+', value: grupo_61_mas_h + grupo_61_mas_m, color: 4 },
        ];

        this.totalHombres = hombres.length;
        this.totalMujeres = mujeres.length;
        this.totalGeneral = response.length;
      },
      (error) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: '¡Ops!',
          text: error,
        });
      }
    );
  }

  public total: any;
  mostrarTotalAcumuladoFn = (info: any) => {
    return `${info.value}`;
  };

  consultarPorRango() {
    this.loading = true;

    const inicio = this.formatearPorFecha(this.fechaInicio);
    const fin = this.formatearPorFecha(this.fechaFin);

    //LLAMADA 1
    this.genService.obtenerGenderPorRango(inicio, fin).subscribe(
      (response) => {
        if (!response || response.length === 0) {
          this.buttonInfo = true;
          this.buttonsFecha = false;
          Swal.fire({
            icon: 'info',
            title: 'Sin Resultados',
            text: 'No se encontraron registros con el rango de fechas seleccionado.',
          });
        } else {
          this.buttonInfo = false;
          this.buttonsFecha = true;
          this.informacionGrid = response;

          const hombres = response.filter(
            (item: any) => item.genero.toLowerCase() === 'hombre'
          );
          const mujeres = response.filter(
            (item: any) => item.genero.toLowerCase() === 'mujer'
          );

          this.informacion = [
            { etiqueta: 'Hombres', value: hombres.length, colors: 2 },
            { etiqueta: 'Mujeres', value: mujeres.length, colors: 1 },
          ];

          const contarPorEdad = (grupo: any[], min: number, max?: number) =>
            grupo.filter((item) =>
              max ? item.edad >= min && item.edad <= max : item.edad >= min
            ).length;

          this.edadesMujeres = [
            {
              etiqueta: '0 - 20',
              value: contarPorEdad(mujeres, 0, 20),
              color: 1,
            },
            {
              etiqueta: '21 - 40',
              value: contarPorEdad(mujeres, 21, 40),
              color: 2,
            },
            {
              etiqueta: '41 - 60',
              value: contarPorEdad(mujeres, 41, 60),
              color: 3,
            },
            { etiqueta: '61+', value: contarPorEdad(mujeres, 61), color: 4 },
          ];

          this.edadesHombres = [
            {
              etiqueta: '0 - 20',
              value: contarPorEdad(hombres, 0, 20),
              color: 1,
            },
            {
              etiqueta: '21 - 40',
              value: contarPorEdad(hombres, 21, 40),
              color: 2,
            },
            {
              etiqueta: '41 - 60',
              value: contarPorEdad(hombres, 41, 60),
              color: 3,
            },
            { etiqueta: '61+', value: contarPorEdad(hombres, 61), color: 4 },
          ];

          this.edadesAgrupadas = this.edadesMujeres.map((grupo, index) => ({
            etiqueta: grupo.etiqueta,
            value: grupo.value + this.edadesHombres[index].value,
            color: grupo.color,
          }));

          this.totalHombres = hombres.length;
          this.totalMujeres = mujeres.length;
          this.totalGeneral = response.length;
        }

        this.loading = false;
      },
      (error) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: '¡Ops!',
          text: 'Error al obtener datos por rango: ' + error,
        });
      }
    );

    //LLAMADA 2
    this.genService.obtenerGenderPorRangoHora(inicio, fin).subscribe(
      (data) => {
        const horasEsperadas = Array.from({ length: 16 }, (_, i) => {
          const hora = (i + 8).toString().padStart(2, '0');
          return `${hora}:00`;
        });

        const datosPorHora = data.reduce((acc: any, item: any) => {
          acc[item.hora] = item;
          return acc;
        }, {});

        this.distribucionPorHora = horasEsperadas.map((hora) => {
          return datosPorHora[hora] || { hora, hombre: 0, mujer: 0 };
        });
      },
      (error) => {
        Swal.fire({
          icon: 'error',
          title: '¡Ops!',
          text: 'Error al obtener datos por hora: ' + error,
        });
      }
    );
  }

  customizeTooltip = (pointInfo: any) => {
    return {
      text: `${pointInfo.argument} - ${pointInfo.value}: ${pointInfo.seriesName}`,
    };
  };

  customizeLabelText = (info: any) => {
    return `${info.value}`;
  };

  customizeEdadTooltip = (pointInfo: any) => {
    return {
      text: `${pointInfo.argumentText} Años:   ${pointInfo.valueText} Personas`,
    };
  };

  customizeEdadPoint = (point: any) => {
    const colorMap: { [key: number]: string } = {
      1: '#8e44ad',
      2: '#f39c12',
      3: '#16a085',
      4: '#c0392b',
    };

    return {
      color: colorMap[point.data.color] || '#7f8c8d',
    };
  };

  customizePoint(pointInfo: any) {
    switch (pointInfo.data.colors) {
      case 1:
        return { color: '#ff69b4' };
      case 2:
        return { color: '#4a90e2' };
    }
  }

  customizeEdadMujeresPoint = (point: any) => {
    const colorMap: { [key: number]: string } = {
      1: '#ff69b4',
      2: '#f06292',
      3: '#ec407a',
      4: '#c2185b',
    };
    return {
      color: colorMap[point.data.color] || '#e1bee7',
    };
  };

  customizeEdadHombresTooltip = (pointInfo: any) => {
    return {
      text: `${pointInfo.argumentText}:   ${pointInfo.value} Hombres`,
    };
  };

  customizeEdadHombresPoint = (point: any) => {
    const colorMap: { [key: number]: string } = {
      1: '#0d6efd',
      2: '#3b8beb',
      3: '#5caeff',
      4: '#b6d4fe',
    };
    return {
      color: colorMap[point.data.color] || '#cfd8dc',
    };
  };

  customizeEdadMujeresTooltip = (pointInfo: any) => {
    return {
      text: `${pointInfo.argumentText}:   ${pointInfo.value} Mujeres`,
    };
  };

  capitalizarGenero = (data: any) => {
    return (
      data.genero.charAt(0).toUpperCase() + data.genero.slice(1).toLowerCase()
    );
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

  private formatearFechaLocal(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const day = fecha.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatearPorFecha(date: Date): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatearFechaTexto(fecha: Date): string {
    const meses = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];

    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();

    return `${dia}-${mes}-${anio}`;
  }
}
