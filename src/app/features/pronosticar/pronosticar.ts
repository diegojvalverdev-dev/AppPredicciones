import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { RouterLink }        from '@angular/router';
import { NavbarComponent }   from '../../shared/components/nav/bottom-nav';
import { AlertComponent }    from '../../shared/components/alert/alert';
import { AlertService }      from '../../shared/services/alert.service';
import { ApiService, GrupoUsuario } from '../../core/services/api.service';
import { AuthService }       from '../../core/services/auth';
import { extractErrorMessage } from '../../core/utils/error.utils';

interface Partido {
  id: number; local: string; visitante: string;
  fecha: string; hora: string; grupoPartido: string; torneo: string;
  golesLocal: number | null; golesVisitante: number | null;
  pronostico: 'local' | 'empate' | 'visitante' | null;
  pronosticoGuardado: boolean; guardando: boolean;
}
interface GrupoFecha { fecha: string; label: string; items: Partido[]; }

@Component({
  selector: 'app-pronosticar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, AlertComponent],
  templateUrl: './pronosticar.html',
})
export class PronosticarComponent implements OnInit {

  // ── Grupos del usuario ────────────────────────────────────────
  gruposUsuario: GrupoUsuario[] = [];
  grupoActivo: GrupoUsuario | null = null;
  cargandoGrupos = false;

  // ── Grupos de partidos (ej. "Grupo A", "Grupo B") ────────────
  gruposPartidos: string[] = [];
  grupoPartidoActivo = '';

  // ── Vista y fechas ────────────────────────────────────────────
  vista: 'grupos' | 'fechas' = 'grupos';
  fechaDesde = '2026-04-28';
  fechaHasta = '2026-05-12';
  fase = 1;

  partidos: Partido[] = [];
  partidosPorGrupo: Partido[]    = [];
  partidosPorFecha: GrupoFecha[] = [];
  totalCompletos = 0;

  constructor(
    private apiService:   ApiService,
    private authService:  AuthService,
    private alertService: AlertService,
    private cdr:          ChangeDetectorRef,
  ) {}

  ngOnInit() { this.cargarGruposUsuario(); }

  // ── 1. Cargar grupos del usuario ──────────────────────────────
  cargarGruposUsuario() {
    this.cargandoGrupos = true;
    this.apiService.getGruposUsuario().subscribe({
      next: (res) => {
        this.gruposUsuario = Array.isArray(res) ? res : [];
        this.cargandoGrupos = false;
        if (this.gruposUsuario.length) {
          this.grupoActivo = this.gruposUsuario[0];
          this.cargarGruposPartidos(this.grupoActivo.gru_id);
        }
        this.cdr.detectChanges();
      },
      error: () => { this.cargandoGrupos = false; this.cdr.detectChanges(); },
    });
  }

  // ── 2. Al cambiar grupo: cargar grupos de partidos ────────────
  onCambiarGrupo(id: string) {
    const g = this.gruposUsuario.find(x => x.gru_id === Number(id));
    if (g) {
      this.grupoActivo = g;
      this.cargarGruposPartidos(g.gru_id);
    }
  }

  cargarGruposPartidos(grupoId: number) {
    this.apiService.getGruposEquipos(grupoId).subscribe({
      next: (res: any) => {
        const lista: any[] = Array.isArray(res) ? res : (res?.data ?? res?.Data ?? []);
        // Extraer nombres únicos de grupo de partido
        this.gruposPartidos = [...new Set(lista.map((x: any) =>
          x.grupo ?? x.Grupo ?? x.grupo_nombre ?? x.GrupoNombre ?? 'Grupo A'
        ))] as string[];
        this.grupoPartidoActivo = this.gruposPartidos[0] ?? '';
        this.recalcular();
        this.cdr.detectChanges();
      },
      error: () => {
        // Si falla, dejar lista vacía
        this.gruposPartidos = [];
        this.recalcular();
      },
    });
  }

  cambiarGrupoPartido(g: string) {
    this.grupoPartidoActivo = g;
    this.recalcular();
  }

  cambiarVista(v: 'grupos' | 'fechas') { this.vista = v; this.recalcular(); }
  aplicarFechas()                      { this.recalcular(); }

  recalcular() {
    this.partidosPorGrupo = this.partidos.filter(
      p => p.grupoPartido === this.grupoPartidoActivo
    );
    this.partidosPorFecha = this.calcularPorFecha();
    this.totalCompletos   = this.partidos.filter(p => p.pronostico !== null).length;
  }

  private calcularPorFecha(): GrupoFecha[] {
    const desde = new Date(this.fechaDesde + 'T00:00:00');
    const hasta  = new Date(this.fechaHasta  + 'T23:59:59');
    const filtrados = this.partidos.filter(p => {
      const d = new Date(p.fecha + 'T12:00:00');
      return d >= desde && d <= hasta;
    });
    const mapa: Record<string, Partido[]> = {};
    filtrados.forEach(p => { if (!mapa[p.fecha]) mapa[p.fecha] = []; mapa[p.fecha].push(p); });
    return Object.entries(mapa)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([fecha, items]) => ({
        fecha,
        label: new Date(fecha + 'T12:00:00')
          .toLocaleDateString('es-EC', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
          .toUpperCase(),
        items,
      }));
  }

  seleccionar(p: Partido, op: 'local' | 'empate' | 'visitante') {
    p.pronostico = p.pronostico === op ? null : op;
    this.totalCompletos = this.partidos.filter(x => x.pronostico !== null).length;
  }

  guardarPronostico(p: Partido) {
    if (p.golesLocal === null || p.golesVisitante === null) {
      this.alertService.error('Ingresa el marcador completo.');
      return;
    }
    const usuario = this.authService.getUsuario();
    if (!usuario || !this.grupoActivo) { this.alertService.error('Sesión expirada.'); return; }

    p.guardando = true;
    const body = {
      UsuarioId: usuario['id'], GrupoId: this.grupoActivo.gru_id,
      PartidoId: p.id, Fase: this.fase,
      GolesLocal: p.golesLocal, GolesVisita: p.golesVisitante,
      EquipoClasifica: null,
    };
    const accion$ = p.pronosticoGuardado
      ? this.apiService.modificarPronostico(body)
      : this.apiService.crearPronostico(body);

    accion$.subscribe({
      next: () => { p.guardando = false; p.pronosticoGuardado = true; this.alertService.success('Pronóstico guardado.'); },
      error: (err) => { p.guardando = false; this.alertService.error(`Error al guardar. ${extractErrorMessage(err)}`); },
    });
  }

  guardarTodos() {
    const con = this.partidos.filter(p => p.golesLocal !== null && p.golesVisitante !== null);
    if (!con.length) { this.alertService.error('Ingresa al menos un marcador.'); return; }
    con.forEach(p => this.guardarPronostico(p));
  }
}
