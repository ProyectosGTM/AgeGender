import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MedalsInfo, Service } from './app.service';
import { AgeGenderService } from '../services/agegender.service';
import Swal from 'sweetalert2';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { SocketService } from 'src/app/shared/socket.service';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver-es';
import { exportDataGrid } from 'devextreme/excel_exporter';
import CustomStore from 'devextreme/data/custom_store';
import { DxDataGridComponent } from 'devextreme-angular';

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
  );

  public fechaInicio: Date = new Date();
  public fechaFin: Date = new Date();
  public resultadoRango: any;
  public buttonInfo: boolean = false;
  public buttonsFecha: boolean = true;
  public modoConsultaPorRango: boolean = false;
  public ultimoHit: any = null;
  public totalFiltrado: number = 0;
  dataSource: any;
  pageSize = 25;
  paginaActual = 1;
  totalRegistros = 0;
  totalPaginas = 0;
  fechaInicioInc: any = '2025-01-30';
  fechaFinInc: any = '2025-07-03';


  constructor(
    service: Service,
    private genService: AgeGenderService,
    private socketService: SocketService
  ) {
    this.olympicMedals = service.getMedalsData();
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  pointClickHandler(arg) {
    arg.target.select();
  }

  onFechaChange(event: any, type: string) {
    if (!event || !event.value) {
      return;
    }

    const selectedDate = new Date(event.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (selectedDate > today) {
      if (type === 'start') {
        this.fechaInicio = new Date();
        Swal.fire({
          icon: 'warning',
          title: 'Fecha inválida',
          text: 'La fecha inicio no puede ser mayor al día actual.',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        this.fechaFin = new Date();
        Swal.fire({
          icon: 'warning',
          title: 'Fecha inválida',
          text: 'La fecha fin no puede ser mayor al día actual.',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } else {
      if (type === 'start') {
        this.fechaInicio = selectedDate;
      } else {
        this.fechaFin = selectedDate;
      }
    }
  }

  @ViewChild('gridRef', { static: false }) gridRef: DxDataGridComponent;
  ngOnInit(): void {
    this.setFechasHoy();
    this.setupDataSource();
    this.obtenerDatos();
    this.actualizarDistribucionPorHora();
    this.obtenerHitActual();

    this.socketService.listen('nueva_incidencia').subscribe((data) => {
      console.log('Nueva incidencia recibida:', data);
      this.setupDataSource();
      // this.reproducirSonidoHit()
      if (this.gridRef) {
        this.gridRef.instance.refresh();
      }
      // Si es modo rango, actualiza lo necesario, si no, los datos normales
      if (this.modoConsultaPorRango) {
        this.consultarPorRango();
      } else {
        this.obtenerDatos();
        this.actualizarDistribucionPorHora();
      }
      this.obtenerHitActual();
    });
  }

  manejarCambioOpciones(e: any) {
    if (e.name === 'columns' && e.fullName?.includes('groupIndex')) {
      setTimeout(() => {
        e.component.option('grouping.autoExpandAll', false);
      });
    }
  }

  actualizarTotalFiltrado(e: any): void {
    this.totalFiltrado = e.component.totalCount();
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

        this.distribucionPorHora = this.filtrarHorasValidas(
          horasEsperadas.map(
            (hora) => datosPorHora[hora] || { hora, hombre: 0, mujer: 0 }
          )
        );
      });
  }

  obtenerDatos(): void {
    this.modoConsultaPorRango = false;
    this.buttonsFecha = true;
    this.buttonInfo = false;
    this.loading = true;

    const hoy = new Date();
    this.fechaInicio = hoy;
    this.fechaFin = hoy;
    this.fechaSeleccionada = hoy;
    this.fechaSeleccionadaTexto = this.formatearFechaTexto(
      this.fechaSeleccionada
    );

    this.setupDataSource()
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
        this.total = response.length;

        this.informacion = [
          { etiqueta: 'Hombres', value: hombres.length, colors: 2 },
          { etiqueta: 'Mujeres', value: mujeres.length, colors: 1 },
        ];

        const agrupar = (grupo: any[], min: number, max?: number) =>
          grupo.filter((i) =>
            max ? i.edad >= min && i.edad <= max : i.edad >= min
          ).length;

        this.edadesMujeres = [
          { etiqueta: '0 - 20', value: agrupar(mujeres, 0, 20), color: 1 },
          { etiqueta: '21 - 40', value: agrupar(mujeres, 21, 40), color: 2 },
          { etiqueta: '41 - 60', value: agrupar(mujeres, 41, 60), color: 3 },
          { etiqueta: '61+', value: agrupar(mujeres, 61), color: 4 },
        ];

        this.edadesHombres = [
          { etiqueta: '0 - 20', value: agrupar(hombres, 0, 20), color: 1 },
          { etiqueta: '21 - 40', value: agrupar(hombres, 21, 40), color: 2 },
          { etiqueta: '41 - 60', value: agrupar(hombres, 41, 60), color: 3 },
          { etiqueta: '61+', value: agrupar(hombres, 61), color: 4 },
        ];

        this.edadesAgrupadas = this.edadesMujeres.map((grupo, i) => ({
          etiqueta: grupo.etiqueta,
          value: grupo.value + this.edadesHombres[i].value,
          color: grupo.color,
        }));

        this.totalHombres = hombres.length;
        this.totalMujeres = mujeres.length;
        this.totalGeneral = response.length;

        this.actualizarDistribucionPorHora();
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
    this.modoConsultaPorRango = true;
    this.loading = true;

    const inicio = this.formatearPorFecha(this.fechaInicio);
    const fin = this.formatearPorFecha(this.fechaFin);

    // LLAMADA 1
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
        this.buttonInfo = false;
        this.buttonsFecha = true;
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: '¡Ops!',
          text: 'Error al obtener datos por rango: ' + error,
        });
      }
    );

    // LLAMADA 2
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

        this.distribucionPorHora = this.filtrarHorasValidas(
          horasEsperadas.map((hora) => datosPorHora[hora] || { hora, hombre: 0, mujer: 0 })
        );

        this.buttonInfo = false;
        this.buttonsFecha = true;
      },
      (error) => {
        this.buttonInfo = false;
        this.buttonsFecha = true;
        Swal.fire({
          icon: 'error',
          title: '¡Ops!',
          text: 'Error al obtener datos por hora: ' + error,
        });
      }
    );
    setTimeout(() => {
      this.buttonInfo = true;
    }, 8000)
    this.fechaInicioInc = this.formatearFechaParaBackend(this.fechaInicio, true);
    this.fechaFinInc = this.formatearFechaParaBackend(this.fechaFin, false);
    this.setupDataSource();
  }

  formatearFechaParaBackend(fecha: any, esInicio: boolean): string {
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const year = fechaObj.getFullYear();
    const month = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
    const day = fechaObj.getDate().toString().padStart(2, '0');
    const hora = esInicio ? '00:00:00' : '23:59:59';
    return `${year}-${month}-${day} ${hora}`;
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

  capitalizarGenero(data: any): string {
    if (!data.genero) return '';
    return data.genero.charAt(0).toUpperCase() + data.genero.slice(1).toLowerCase();
  }

  getColorEstadoAnimo(estado: string): string {
    if (!estado) return '#757575';
    switch (estado.toLowerCase()) {
      case 'feliz': return '#43a047';  // Verde
      case 'neutral': return '#ffa726';  // Naranja
      case 'triste': return '#e53935';  // Rojo
      default: return '#757575';  // Gris
    }
  }


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

  actualizarTotalVisible(e: any) {
    if (e.component) {
      const totalVisibles = e.component.getVisibleRows().length;
      e.component.option('summary.totalItems[0].value', totalVisibles);
    }
  }

  public colorEstado: 'default' | 'hombre' | 'mujer' = 'default';
  private colorTimeout: any = null;
  private hitInicial: boolean = true;

  obtenerHitActual() {
    this.genService.obtenerUltimoHit().subscribe(
      (hit: any) => {
        if (hit && hit.id && hit.fecha) {
          const nuevoId = hit.id;
          const hitPrevioId = this.ultimoHit?.id;
          const esNuevoHit = nuevoId !== hitPrevioId;
          this.ultimoHit = hit;
          if (this.hitInicial) {
            this.hitInicial = false;
            return;
          }

          if (esNuevoHit) {
            this.reproducirSonidoHit();
            this.activarColorTemporario(hit.genero?.toLowerCase());
          }
        } else {
          this.ultimoHit = null;
        }
      },
      () => {
        this.ultimoHit = null;
      }
    );
  }

  activarColorTemporario(genero: string) {
    if (this.colorTimeout) clearTimeout(this.colorTimeout);

    if (genero === 'hombre') {
      this.colorEstado = 'hombre';
    } else if (genero === 'mujer') {
      this.colorEstado = 'mujer';
    } else {
      return;
    }

    this.colorTimeout = setTimeout(() => {
      this.colorEstado = 'default';
    }, 10000);
  }

  filtrarHorasValidas(data: any[]): any[] {
    return data.filter((item) => {
      const h = parseInt(item.hora.split(':')[0], 10);
      return h >= 8 && h <= 21;
    });
  }

  reproducirSonidoHit() {
    const audio = new Audio('assets/audio/newHit.mp3');
    audio.play().catch((error) => {
      console.warn('No se pudo reproducir el sonido:', error);
    });
  }

  onExporting(e: any) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('AgeGender');
    const grid = e.component;
    const accionesColumn = grid.columnOption('Acciones');
    grid.beginUpdate();
    grid.columnOption('Acciones', 'visible', false);
    grid.endUpdate();
    exportDataGrid({
      component: e.component,
      worksheet,
      autoFilterEnabled: true,
    })
      .then(() => {
        grid.beginUpdate();
        grid.columnOption('Acciones', 'visible', true);
        grid.endUpdate();

        workbook.xlsx.writeBuffer().then((buffer) => {
          saveAs(
            new Blob([buffer], { type: 'application/octet-stream' }),
            'Reporte_de_Ventas.xlsx'
          );
        });
      })
      .catch((error) => {
        grid.beginUpdate();
        grid.columnOption('Acciones', 'visible', true);
        grid.endUpdate();
        // console.error("Export failed: ", error);
      });
  }

  setFechasHoy() {
    const ahora = new Date();
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
    const fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
    this.fechaInicioInc = this.formatDateTime(inicio);
    this.fechaFinInc = this.formatDateTime(fin);
  }


  formatDateTime(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return date.getFullYear() + '-' +
      pad(date.getMonth() + 1) + '-' +
      pad(date.getDate()) + ' ' +
      pad(date.getHours()) + ':' +
      pad(date.getMinutes()) + ':' +
      pad(date.getSeconds());
  }

  ngAfterViewInit() {
  }

  scrollToGrid() {
    setTimeout(() => {
      if (this.gridContainerRef && this.gridContainerRef.nativeElement) {
        this.gridContainerRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }

  setupDataSource() {
    this.loading = true;
    this.dataSource = new CustomStore({
      load: (loadOptions: any) => {
        const skipValue = loadOptions.skip || 0;
        const page = Math.floor(skipValue / this.pageSize) + 1;

        return this.genService.obtenerIncidencias(
          this.fechaInicioInc,
          this.fechaFinInc,
          page,
          this.pageSize
        ).toPromise().then((response: any) => {
          this.loading = false;

          let data = [];

          if (Array.isArray(response)) {
            data = response;
          } else {
            data = response.data || [];
          }

          data = data.sort((a, b) => b.id - a.id);

          const hit = data[0];
          if (hit && hit.id && hit.fecha) {
            const nuevoId = hit.id;
            const hitPrevioId = this.ultimoHit?.id;
            const esNuevoHit = nuevoId !== hitPrevioId;
            this.ultimoHit = hit;
            if (this.hitInicial) {
              this.hitInicial = false;
            } else if (esNuevoHit) {
              this.activarColorTemporario(hit.genero?.toLowerCase());
            }
          } else {
            this.ultimoHit = null;
          }

          if (data.length) {
            this.scrollToGrid();
          }

          return {
            data: data,
            totalCount: (response.pagination?.total ?? response.total ?? data.length)
          };
        }).catch((error) => {
          this.loading = false;
          return {
            data: [],
            totalCount: 0
          };
        });
      }
    });
  }

  @ViewChild('gridContainer', { static: false }) gridContainerRef: any;
  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();

    setTimeout(() => {
      
      const grid = document.querySelector('#gridContainer .dx-datagrid-rowsview') as HTMLElement
        || document.getElementById('gridContainer');
      if (grid) {
        const rect = grid.getBoundingClientRect();
        const scrollTop = window.scrollY + rect.top - 30; 
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
      }
    }, 50); 
  }

  getIndex(rowIndex: number): number {
    return rowIndex + 1;
  }

}