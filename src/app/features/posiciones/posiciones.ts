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

  // ── Tabla ─────────────────────────────────────────────────────
  tabla: PosicionJugador[] = [];
  tablaFinal4: PosicionFinal4[] = [];
  cargando = false;

  esAdmin = false;
  generando = false;

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
        this.fases       = Array.isArray(res) ? res : (res?.data ?? []);
        this.cargandoFases = false;
        if (this.fases.length) {
          this.faseActiva = this.fases[0];
          this.cargarPosiciones();
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
    this.faseActiva = f;
    this.cargarPosiciones();
  }

  // ── 3. Cargar ranking ─────────────────────────────────────────
  cargarPosiciones() {
    if (!this.grupoActivo || !this.faseActiva) return;
    this.cargando = true;
    this.tabla    = [];
    this.cdr.detectChanges();

    const eventoId = this.grupoActivo.gru_idEvento;
    const fase     = this.getFaseId(this.faseActiva);

    this.apiService.getPosiciones(this.grupoActivo.gru_id, eventoId, fase).subscribe({
      next: (res: any) => {
        const lista: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.tabla = lista.map((p: any, i: number) => ({
          pos:      i + 1,
          alias:    p.Alias    ?? p.alias    ?? p.gusr_alias ?? `Jugador ${i + 1}`,
          usuario:  p.Usuario  ?? p.usuario  ?? p.login      ?? '',
          puntos:   p.Puntos   ?? p.puntos   ?? p.PuntosTotales      ?? 0,
          resultado: p.Resultado ?? p.resultado ?? p.PuntosResultado ?? 0,
          marcador: p.Marcador ?? p.marcador ?? p.PuntosMarcador ?? 0,
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

  // ── 4. Cargar ranking fINAL 4─────────────────────────────────────────
  cargarPosicionesFinal4() {
    if (!this.grupoActivo || !this.faseActiva) return;
    this.cargando = true;
    this.tablaFinal4    = [];
    this.cdr.detectChanges();

    this.apiService.getPosicionesFinal4(this.grupoActivo.gru_id).subscribe({
      next: (res: any) => {
        const lista: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.tablaFinal4 = lista.map((p: any, i: number) => ({
          pos:      i + 1,
          alias:    p.Alias    ?? p.alias    ?? p.gusr_alias ?? `Jugador ${i + 1}`,
          usuario:  p.Usuario  ?? p.usuario  ?? p.login      ?? '',
          campeon:   p.PuntosCampeon      ?? 0,
          subcampeon: p.PuntosSubcampeon ?? 0,
          tercer: p.PuntosTercerLugar ?? 0,
          cuarto: p.PuntosCuartoLugar ?? 0,
          goleador: p.PuntosGoleador ?? 0,
          goles: p.PuntosGoles ?? 0,
          mvp: p.PuntosMVP ?? 0,
          top4: p.PuntosAdicionalTop4 ?? 0,
          total: p.TotalPuntos ?? 0,
        }));
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.alertService.error(`Error al cargar posiciones. ${extractErrorMessage(err)}`);
        this.cdr.detectChanges();
      },
    });
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
