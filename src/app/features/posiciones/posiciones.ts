import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule }     from '@angular/forms';
import { NavbarComponent } from '../../shared/components/nav/bottom-nav';
import { ApiService, GrupoUsuario } from '../../core/services/api.service';
import { extractErrorMessage }      from '../../core/utils/error.utils';
import { AlertService }             from '../../shared/services/alert.service';
import { Usuario }         from '../../core/models/usuario.model';
import { AuthService } from '../../core/services/auth';

interface PosicionJugador {
  pos:      number;
  alias:    string;
  usuario:  string;
  puntos:   number;
  resultado: number;
  marcador: number;
  clasificacion: number;
  [key: string]: any;
}

interface PosicionFinal4 {
  pos:      number;
  alias:    string;
  usuario:  string;
  campeon:   number;
  subcampeon: number;
  tercer: number;
  cuarto: number;
  goleador: number;
  goles: number;
  mvp: number;
  top4: number;
  total: number;
  [key: string]: any;
}

interface PosicionCombinada {
  pos:             number;
  alias:           string;
  usuario:         string;
  puntosGenerales: number;
  puntosFinal4:    number;
  puntosTotales:   number;
}

@Component({
  selector: 'app-posiciones',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, ReactiveFormsModule],
  templateUrl: './posiciones.html',
})
export class PosicionesComponent implements OnInit {

  // ── Grupos ────────────────────────────────────────────────────
  grupos: GrupoUsuario[]    = [];
  grupoActivo: GrupoUsuario | null = null;
  cargandoGrupos = false;

  // ── Fases ─────────────────────────────────────────────────────
  fases: any[]    = [];
  faseActiva: any = null;
  cargandoFases  = false;
  loading          = false;
  usuario: Usuario | null = null;

  // Fases "virtuales" que no vienen del backend, sino que se agregan
  // al selector para poder mostrar directamente la tabla Final 4
  // o la tabla Acumulado Total sin depender de una fase real.
  private readonly FASE_FINAL4 = { ef_numFase: -1, ef_descripcion: 'FINAL 4', esVirtual: true };
  private readonly FASE_ACUMULADO_TOTAL = { ef_numFase: -2, ef_descripcion: 'ACUMULADO TOTAL', esVirtual: true };

  // ── Tabla ─────────────────────────────────────────────────────
  tabla: PosicionJugador[] = [];
  tablaFinal4: PosicionFinal4[] = [];
  cargando = false;

  tablaCombinada: PosicionCombinada[] = [];

  esAdmin = false;
  generando = false;

  // ── Visibilidad de tablas según fase ──────────────────────────
  mostrarGeneral    = true;
  mostrarFinal4     = false;
  mostrarCombinada  = false;

  constructor(
    private apiService:   ApiService,
    private authService:  AuthService,
    private fb:           FormBuilder,
    private alertService: AlertService,
    private cdr:          ChangeDetectorRef,
  ) {}

  ngOnInit() { this.cargarGrupos(); }

  // ── 1. Cargar grupos del usuario ──────────────────────────────
  cargarGrupos() {
    this.cargandoGrupos = true;
    this.apiService.getGruposUsuario().subscribe({
      next: (res: any) => {
        this.grupos        = Array.isArray(res) ? res : [];
        this.cargandoGrupos = false;
        if (this.grupos.length) {
          this.grupoActivo = this.grupos[0];
          // Con el grupo cargado, cargar las fases de su evento
          this.cargarFases(this.grupoActivo.gru_idEvento);
          this.verificarAdmin();
        }
        this.cdr.detectChanges();
      },
      error: () => { this.cargandoGrupos = false; this.cdr.detectChanges(); },
    });
  }

  onCambiarGrupo(id: string) {
    const g = this.grupos.find(x => x.gru_id === Number(id));
    if (!g) return;
    this.grupoActivo = g;
    this.tabla       = [];
    this.tablaFinal4 = [];
    this.tablaCombinada = [];
    this.fases       = [];
    this.faseActiva  = null;
    this.esAdmin     = false;  
    this.cdr.detectChanges();
    this.cargarFases(g.gru_idEvento);
    this.verificarAdmin(); 
  }  

  // ── 2. Cargar fases del evento ────────────────────────────────
  cargarFases(idEvento: number) {
    this.cargandoFases = true;
    this.fases = [];
    this.faseActiva = null;
    this.tabla = [];
    this.cdr.detectChanges();

    this.apiService.getFasesPorEvento(idEvento).subscribe({
      next: (res: any) => {
        const fasesApi: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.fases = [...fasesApi, this.FASE_FINAL4, this.FASE_ACUMULADO_TOTAL]
          .sort((a, b) => this.getFaseLabel(a).localeCompare(this.getFaseLabel(b), 'es', { sensitivity: 'base' }));
        this.cargandoFases = false;

        if (fasesApi.length) {
          // Antes: this.faseActiva = fasesApi[0]  ← primera de la API sin ordenar
          // Ahora: primera fase del arreglo YA ordenado, para que coincida
          // con lo que el <select> muestra seleccionado visualmente.
          this.activarFase(this.fases[0]);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoFases = false;
        this.alertService.error(`Error al cargar fases. ${extractErrorMessage(err)}`);
        this.cdr.detectChanges();
      },
    });
  }

  onCambiarFase(id: string) {
    const f = this.fases.find(x => this.getFaseId(x) === Number(id));
    if (!f) return;
    this.activarFase(f);
  }

  // ── 3. Cargar ranking ─────────────────────────────────────────
  cargarPosiciones() {
    if (!this.grupoActivo || !this.faseActiva) return;

    const fase = this.getFaseId(this.faseActiva);

    if (fase === 0) {
      this.cargarPosicionesTotalGeneral();
      return;
    }

    this.cargando = true;
    this.tabla    = [];
    this.cdr.detectChanges();

    const eventoId = this.grupoActivo.gru_idEvento;

    this.apiService.getPosiciones(this.grupoActivo.gru_id, eventoId, fase).subscribe({
      next: (res: any) => {
        const lista: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.tabla = lista.map((p: any, i: number) => ({
          pos:           i + 1,
          alias:         p.Alias    ?? p.alias    ?? p.gusr_alias ?? `Jugador ${i + 1}`,
          usuario:       p.Usuario  ?? p.usuario  ?? p.login      ?? '',
          puntos:        p.Puntos   ?? p.puntos   ?? p.PuntosTotales      ?? 0,
          resultado:     p.Resultado ?? p.resultado ?? p.PuntosResultado ?? 0,
          marcador:      p.Marcador ?? p.marcador ?? p.PuntosMarcador ?? 0,
          clasificacion: p.Clasificacion ?? p.clasificacion ?? p.PuntosClasificacion ?? 0,
        }));
        this.cargando = false;
        this.cargarPosicionesFinal4();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.alertService.error(`Error al cargar posiciones. ${extractErrorMessage(err)}`);
        this.cdr.detectChanges();
      },
    });
  }

  // ── 3b. Cargar el acumulado general (fase === 0) ────────────────
  // Extraído para poder reutilizarlo desde la opción virtual
  // "ACUMULADO TOTAL" sin depender de que la fase activa sea 0.
  private cargarPosicionesTotalGeneral() {
    if (!this.grupoActivo) return;
    this.cargando = true;
    this.tabla    = [];
    this.cdr.detectChanges();

    const eventoId = this.grupoActivo.gru_idEvento;

    this.apiService.getPosicionesTotal(this.grupoActivo.gru_id, eventoId).subscribe({
      next: (res: any) => {
        const lista: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.tabla = lista.map((p: any, i: number) => ({
          pos:           i + 1,
          alias:         p.Alias    ?? p.alias    ?? p.gusr_alias ?? `Jugador ${i + 1}`,
          usuario:       p.Usuario  ?? p.usuario  ?? p.login      ?? '',
          puntos:        p.Puntos   ?? p.puntos   ?? p.PuntosTotales ?? p.TotalPuntos ?? 0,
          resultado:     p.Resultado ?? p.resultado ?? p.PuntosResultado ?? p.TotalResultados ?? 0,
          marcador:      p.Marcador ?? p.marcador ?? p.PuntosMarcador ?? p.TotalMarcadores ?? 0,
          clasificacion: p.Clasificacion ?? p.clasificacion ?? p.PuntosClasificacion ?? p.TotalClasificaciones ?? 0,
        }));
        this.cargando = false;
        this.cargarPosicionesFinal4();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.alertService.error(`Error al cargar posiciones. ${extractErrorMessage(err)}`);
        this.cdr.detectChanges();
      },
    });
  }

  // ── 3c. Cargar datos para la opción virtual "ACUMULADO TOTAL" ──
  private cargarAcumuladoTotal() {
    // Reutiliza el mismo flujo que "fase 0": trae el acumulado general
    // y, encadenado, la tabla Final 4 + combinarTablas().
    this.cargarPosicionesTotalGeneral();
  }

  // ── 4. Cargar ranking fINAL 4─────────────────────────────────────────
  cargarPosicionesFinal4() {
    if (!this.grupoActivo) return;
    this.cargando = true;
    this.tablaFinal4    = [];
    this.cdr.detectChanges();

    this.apiService.getPosicionesFinal4(this.grupoActivo.gru_id).subscribe({
      next: (res: any) => {
        const lista: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.tablaFinal4 = lista.map((p: any, i: number) => ({
          pos:        i + 1,
          alias:      p.Alias    ?? p.alias    ?? p.gusr_alias ?? `Jugador ${i + 1}`,
          usuario:    p.Usuario  ?? p.usuario  ?? p.login      ?? '',
          campeon:    p.PuntosCampeon      ?? 0,
          subcampeon: p.PuntosSubcampeon ?? 0,
          tercer:     p.PuntosTercerLugar ?? 0,
          cuarto:     p.PuntosCuartoLugar ?? 0,
          goleador:   p.PuntosGoleador ?? 0,
          goles:      p.PuntosCantidadGoles ?? 0,
          mvp:        p.PuntosMvp ?? 0,
          top4:       p.PuntosAdicionalTop4 ?? 0,
          total:      p.TotalPuntos ?? 0,
        }));
        this.cargando = false;
        this.combinarTablas(); 
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.alertService.error(`Error al cargar posiciones. ${extractErrorMessage(err)}`);
        this.cdr.detectChanges();
      },
    });
  }

  combinarTablas() {
    const mapa = new Map<string, PosicionCombinada>();

    // Base: puntos generales
    this.tabla.forEach(p => {
      const key = p.usuario || p.alias;
      mapa.set(key, {
        pos: 0,
        alias: p.alias,
        usuario: p.usuario,
        puntosGenerales: p.puntos,
        puntosFinal4: 0,
        puntosTotales: p.puntos,
      });
    });

    // Sumar/mezclar puntos final 4
    this.tablaFinal4.forEach(p => {
      const key = p.usuario || p.alias;
      const existente = mapa.get(key);
      if (existente) {
        existente.puntosFinal4  = p.total;
        existente.puntosTotales = existente.puntosGenerales + p.total;
      } else {
        mapa.set(key, {
          pos: 0,
          alias: p.alias,
          usuario: p.usuario,
          puntosGenerales: 0,
          puntosFinal4: p.total,
          puntosTotales: p.total,
        });
      }
    });

    const lista = Array.from(mapa.values())
      .sort((a, b) => b.puntosTotales - a.puntosTotales);

    lista.forEach((item, i) => item.pos = i + 1);
    this.tablaCombinada = lista;
  }

  actualizarVisibilidadTablas() {
    const label = this.normalizarTexto(this.getFaseLabel(this.faseActiva));

    switch (label) {
      case 'FASE DE GRUPOS':
      case 'FASE DE ELIMINACION':
        this.mostrarGeneral   = true;
        this.mostrarFinal4    = false;
        this.mostrarCombinada = false;
        break;

      case 'FINAL 4':
        this.mostrarGeneral   = false;
        this.mostrarFinal4    = true;
        this.mostrarCombinada = false;
        break;

      case 'ACUMULADO GENERAL':
        this.mostrarGeneral   = true;
        this.mostrarFinal4    = true;
        this.mostrarCombinada = false;
        break;

      case 'ACUMULADO TOTAL':
        this.mostrarGeneral   = false;
        this.mostrarFinal4    = false;
        this.mostrarCombinada = true;
        break;

      default:
        // Fallback por si aparece una fase con otro nombre
        this.mostrarGeneral   = true;
        this.mostrarFinal4    = false;
        this.mostrarCombinada = false;
    }
  }

  // Normaliza para comparar sin importar tildes/mayúsculas/espacios extra
  private normalizarTexto(texto: string): string {
    return (texto ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quita tildes (ELIMINACIÓN -> ELIMINACION)
      .toUpperCase()
      .trim();
  }

  private activarFase(f: any) {
    this.faseActiva = f;
    this.actualizarVisibilidadTablas();

    if (f.esVirtual && this.getFaseId(f) === this.getFaseId(this.FASE_FINAL4)) {
      this.cargarPosicionesFinal4();
      return;
    }

    if (f.esVirtual && this.getFaseId(f) === this.getFaseId(this.FASE_ACUMULADO_TOTAL)) {
      this.cargarAcumuladoTotal();
      return;
    }

    this.cargarPosiciones();
  }

  exportarEstadisticas() {

    if (!this.grupoActivo || !this.faseActiva) return;
    this.generando = true;
    this.apiService.exportarExcelPronosticos(
      this.grupoActivo.gru_id.toString(),
      this.getFaseId(this.faseActiva).toString(),
    ).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.generando = false;
        // Crear blob y disparar descarga
        const blob  = new Blob([res], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url   = window.URL.createObjectURL(blob);
        const link  = document.createElement('a');
        link.href   = url;
        link.download = `posiciones_grupo${this.grupoActivo?.gru_id}_fase${this.getFaseId(this.faseActiva)}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.generando = false;
        this.alertService.error(`Error al crear el excel. ${extractErrorMessage(err)}`);
      },
    });
  }

  // Método renombrado — solo se llama desde el TS, nunca desde el HTML
  verificarAdmin() {
    const usuario = this.authService.getUsuario();
    if (!usuario || !this.grupoActivo) {
      this.esAdmin = false;
      return;
    }

    const idUsuario = usuario['id'] ?? usuario['Id'] ?? usuario['ID'];
    this.esAdmin    = this.grupoActivo.gru_idUsuario_Admin === Number(idUsuario);
    this.cdr.detectChanges();
  }

  // ── Helpers de fases ──────────────────────────────────────────
  getFaseId(f: any): number {
    return f?.ef_numFase ?? f?.id ?? f?.Id ?? f?.fase ?? f?.Fase ?? 0;
  }

  getFaseLabel(f: any): string {
    return f?.ef_descripcion ?? f?.nombre ?? f?.Nombre ?? f?.descripcion ?? `Fase ${this.getFaseId(f)}`;
  }

  get torneoLabel(): string {
    return this.grupoActivo?.gru_nombre ?? '';
  }

  medallaColor(pos: number): string {
    return pos === 1 ? '#fbbf24' : pos === 2 ? '#94a3b8' : pos === 3 ? '#f97316' : 'var(--muted)';
  }
}