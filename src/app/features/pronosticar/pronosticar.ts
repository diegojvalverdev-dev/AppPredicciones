import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { NavbarComponent }   from '../../shared/components/nav/bottom-nav';
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
  fase: number; PartidoEliminacion?: boolean; EquipoClasifica?: string; 
  GrupoEquipo?: string; Bandera1?: string; Bandera2?: string;
}

interface GrupoFecha { fecha: string; label: string; items: Partido[]; }

@Component({
  selector: 'app-pronosticar',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './pronosticar.html',
})
export class PronosticarComponent implements OnInit {

  gruposUsuario:      GrupoUsuario[] = [];
  grupoActivo:        GrupoUsuario | null = null;
  cargandoGrupos    = false;
  gruposPartidos:     string[] = [];
  grupoPartidoActivo = '';
  cargandoPartidos  = false;

  vista: 'grupos' | 'fechas' = 'grupos';
  fechaDesde = this.hoy();
  fechaHasta = this.hoy();

  // Listas separadas por vista
  partidosGrupo: Partido[]    = [];
  partidosFecha: Partido[]    = [];

  get partidos(): Partido[] {
    return this.vista === 'grupos' ? this.partidosGrupo : this.partidosFecha;
  }

  private hoy(): string {
    return new Date().toISOString().substring(0, 10);
  }

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

  // ── Grupos del usuario ────────────────────────────────────────
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

  onCambiarGrupo(id: string) {
    const g = this.gruposUsuario.find(x => x.gru_id === Number(id));
    if (g) {
      this.grupoActivo   = g;
      this.partidosGrupo = [];
      this.partidosFecha = [];
      this.cargarGruposPartidos(g.gru_id);
    }
  }

  // ── Grupos de partidos (Grupo A, B...) ───────────────────────
  cargarGruposPartidos(grupoId: number) {
    this.cargandoPartidos = true;
    this.gruposPartidos   = [];
    this.cdr.detectChanges();

    this.apiService.getGruposEquipos(grupoId).subscribe({
      next: (res: any) => {
        const lista: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.gruposPartidos = [...new Set(
          lista.map((x: any) => x.grupo ?? x.Grupo ?? 'Grupo A')
        )] as string[];

        if (this.gruposPartidos.length) {
          this.grupoPartidoActivo = this.gruposPartidos[0];
          this.cargarPronosticos(grupoId, this.grupoPartidoActivo);
        } else {
          this.cargandoPartidos = false;
          this.recalcular();
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.cargandoPartidos = false;
        this.recalcular();
        this.cdr.detectChanges();
      },
    });
  }

  cambiarGrupoPartido(g: string) {
    this.grupoPartidoActivo = g;
    if (this.grupoActivo) {
      this.cargarPronosticos(this.grupoActivo.gru_id, g);
    }
  }

  // ── Pronósticos por agrupación → lista GRUPOS ────────────────
  cargarPronosticos(grupoId: number, agrupacion: string) {
    this.cargandoPartidos = true;
    this.cdr.detectChanges();

    this.apiService.getPronosticosPorAgrupacion(grupoId, agrupacion).subscribe({
      next: (res: any) => {
        this.partidosGrupo    = (Array.isArray(res) ? res : []).map((p: any) => this.mapPronostico(p));
        this.cargandoPartidos = false;
        this.recalcular();
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoPartidos = false;
        this.recalcular();
        this.cdr.detectChanges();
      },
    });
    this.buscarPorFechas();
  }

  // ── Cambio de vista ───────────────────────────────────────────
  cambiarVista(v: 'grupos' | 'fechas') {
    this.vista = v;
    this.recalcular();
  }

  // ── Búsqueda por fechas → lista FECHAS ───────────────────────
  aplicarFechas() {
    if (this.grupoActivo && this.fechaDesde && this.fechaHasta) {
      this.buscarPorFechas();
    }
  }

  buscarPorFechas() {
    if (!this.grupoActivo) return;
    this.cargandoPartidos = true;
    this.cdr.detectChanges();

    this.apiService.getPronosticosPorFechas(
      this.grupoActivo.gru_id, this.fechaDesde, this.fechaHasta,
    ).subscribe({
      next: (res: any) => {
        this.partidosFecha    = (Array.isArray(res) ? res : []).map((p: any) => this.mapPronostico(p));
        this.cargandoPartidos = false;
        this.recalcular();
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoPartidos = false;
        this.recalcular();
        this.cdr.detectChanges();
      },
    });
  }

  // ── Recalcular vistas ─────────────────────────────────────────
  recalcular() {
    if (this.vista === 'grupos') {
      this.partidosPorGrupo = this.partidosGrupo.filter(
        p => p.grupoPartido === this.grupoPartidoActivo
      );
    } else {
      this.partidosPorFecha = this.calcularPorFecha(this.partidosFecha);
    }
    this.totalCompletos = this.partidos.filter(p => p.pronosticoGuardado).length;
  }

  private calcularPorFecha(lista: Partido[]): GrupoFecha[] {
    const mapa: Record<string, Partido[]> = {};
    lista.forEach(p => {
      if (!p.fecha) return;
      if (!mapa[p.fecha]) mapa[p.fecha] = [];
      mapa[p.fecha].push(p);
    });
    return Object.entries(mapa)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([fecha, items]) => ({
        fecha,
        label: new Date(fecha + 'T12:00:00')
          .toLocaleDateString('es-EC', {
            weekday:'long', day:'numeric', month:'long', year:'numeric',
          }).toUpperCase(),
        items,
      }));
  }

  imagenBandera(pais: string): string {
    if(pais == null || pais.trim() === '') pais = 'Sin_bandera.svg';
    return document.baseURI + `img/banderas_mundial2026/${pais}`;
  }

  // ── Map API → Partido ─────────────────────────────────────────
  private mapPronostico(p: any): Partido {
    const fechaRaw = p['HoraPartido'] ?? p['Hora'] ?? '';
    const g1 = p['Goles1'];
    const g2 = p['Goles2'];
    const Bandera1 = p['Bandera1'];
    const Bandera2 = p['Bandera2'];

    // Calcular pronostico correcto según goles guardados
    let pronostico: 'local' | 'empate' | 'visitante' | null = null;
    if (g1 != null && g2 != null) {
      if      (Number(g1) > Number(g2)) pronostico = 'local';
      else if (Number(g1) < Number(g2)) pronostico = 'visitante';
      else                               pronostico = 'empate';
    }

    // Calcular clasificado automático si es eliminación
    const esEliminacion = p['PartidoEliminacion'] ?? false;
    const local     = p['PaisLocal']     ?? '—';
    const visitante = p['PaisVisitante'] ?? '—';

    let equipoClasifica = p['PaisClasifica'] ?? null;
    if (esEliminacion && g1 != null && g2 != null && !equipoClasifica) {
      if      (Number(g1) > Number(g2)) equipoClasifica = local;
      else if (Number(g1) < Number(g2)) equipoClasifica = visitante;
      // empate → null, usuario elige
    }

    return {
      id:             p['IdPartido']     ?? 0,
      local,
      visitante,
      fecha:          fechaRaw ? fechaRaw.substring(0, 10) : '',
      hora:           fechaRaw ? new Date(fechaRaw).toLocaleTimeString('es-EC',
                        { hour:'2-digit', minute:'2-digit' }) : '',
      grupoPartido:   this.grupoPartidoActivo,
      torneo:         this.grupoActivo?.gru_nombre ?? '',
      golesLocal:     g1 ?? null,
      golesVisitante: g2 ?? null,
      pronostico,
      pronosticoGuardado: g1 != null,
      guardando:      false,
      fase:           p['Fase'] ?? 1,
      PartidoEliminacion: esEliminacion,
      GrupoEquipo:    p['GrupoEquipo'] ?? '—',
      EquipoClasifica: equipoClasifica,
      Bandera1: Bandera1,
      Bandera2: Bandera2,
    };
  }

  // ── Selección y guardado ──────────────────────────────────────
  seleccionar(p: Partido, op: 'local' | 'empate' | 'visitante') {
    if (p.golesLocal !== null && p.golesVisitante !== null) return;
      p.pronostico = p.pronostico === op ? null : op;
  }

  /**
   * Calcula automáticamente el resultado (local/empate/visitante)
   * según los goles ingresados y actualiza p.pronostico.
   */
  calcularResultado(p: Partido) { 
    const g1 = p.golesLocal;
    const g2 = p.golesVisitante;
    if (g1 === null || g2 === null || g1 === undefined || g2 === undefined) return;

    if (g1 > g2) {
      p.pronostico     = 'local';
      if (p.PartidoEliminacion) p.EquipoClasifica = p.local;

    } else if (g1 < g2) {
      p.pronostico     = 'visitante';
      if (p.PartidoEliminacion) p.EquipoClasifica = p.visitante;

    } else {
      // Empate — en eliminación el usuario debe elegir manualmente
      p.pronostico     = 'empate';
      if (p.PartidoEliminacion) p.EquipoClasifica = ''; // ← limpiar para que elija
    }

  }

  /**
   * Valida que el clasificado elegido manualmente sea coherente con el marcador.
   * Solo aplica en empate — si hay ganador el clasificado ya es automático.
   */
  validarClasificado(p: Partido, equipoElegido: string) {
    const g1 = p.golesLocal;
    const g2 = p.golesVisitante;

    // Si no hay marcador completo, permitir selección
    if (g1 === null || g2 === null) {
      p.EquipoClasifica = equipoElegido;
      return;
    }

    // Si hay ganador claro, el clasificado ya está fijo — no puede cambiarse
    if (g1 !== g2) {
      const autoClasifica = g1 > g2 ? p.local : p.visitante;
      if (equipoElegido !== autoClasifica) {
        this.alertService.error(
          `No puedes elegir a ${equipoElegido} como clasificado — ` +
          `${autoClasifica} gana el partido ${g1}-${g2}.`
        );
        // Revertir a automático
        p.EquipoClasifica = autoClasifica;
      }
      return;
    }

    // Empate — el usuario puede elegir libremente
    p.EquipoClasifica = equipoElegido;
  }

  guardarPronostico(p: Partido) {
    if (p.golesLocal === null || p.golesVisitante === null) {
      this.alertService.error('Ingresa el marcador completo.');
      return;
    }
    const usuario = this.authService.getUsuario();
    if (!usuario || !this.grupoActivo) {
      this.alertService.error('Sesión expirada. Vuelve a iniciar sesión.');
      return;
    }

    const PartidoEliminacion = p.PartidoEliminacion ?? false;
    if (PartidoEliminacion && !p.EquipoClasifica) {
      this.alertService.error('Para partidos de eliminación, selecciona el equipo clasificado.');
      return;
    }

    p.guardando = true;
    const body = {
      UsuarioId:       usuario['id'],
      GrupoId:         this.grupoActivo.gru_id,
      PartidoId:       p.id,
      Fase:            p.fase,
      GolesLocal:      p.golesLocal,
      GolesVisita:     p.golesVisitante,
      EquipoClasifica: p.EquipoClasifica ?? null,
    };

    const accion$ = p.pronosticoGuardado
      ? this.apiService.modificarPronostico(body)
      : this.apiService.crearPronostico(body);

    accion$.subscribe({
      next: () => {
        p.guardando = false;
        p.pronosticoGuardado = true;
        // Sincronizar en la otra lista si el partido existe allí
        const otras = this.vista === 'grupos' ? this.partidosFecha : this.partidosGrupo;
        const enOtra = otras.find(x => x.id === p.id);
        if (enOtra) {
          enOtra.golesLocal         = p.golesLocal;
          enOtra.golesVisitante     = p.golesVisitante;
          enOtra.pronosticoGuardado = true;
        }
        this.totalCompletos = this.partidos.filter(x => x.pronosticoGuardado).length;
        this.alertService.success('Pronóstico guardado exitosamente.');
      },
      error: (err) => {
        p.guardando = false;
        const msg = extractErrorMessage(err);
        this.alertService.error(err?.status === 400 ? msg : `Error al guardar. ${msg}`);
      },
    });
  }

  guardarTodos() {
    const con = this.partidos.filter(
      p => p.golesLocal !== null && p.golesVisitante !== null
    );
    if (!con.length) {
      this.alertService.error('Ingresa al menos un marcador para guardar.');
      return;
    }
    con.forEach(p => this.guardarPronostico(p));
  }

  soloEntero(event: Event, p: Partido, campo: 'local' | 'visitante') {
    const input  = event.target as HTMLInputElement;
    // Eliminar decimales y negativos
    let valor = Math.floor(Math.abs(Number(input.value)));
    // Máximo 20
    if (valor > 20) valor = 0;
    // Actualizar el input visualmente
    input.value = isNaN(valor) ? '' : String(valor);
    // Actualizar el modelo
    if (campo === 'local') {
      p.golesLocal = isNaN(valor) ? null : valor;
    } else {
      p.golesVisitante = isNaN(valor) ? null : valor;
    }
    // Calcular resultado automático
    this.calcularResultado(p);
  }

  enfocarVisitante(partidoId: number) {
    const input = document.getElementById(`visitante-${partidoId}`) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select(); // selecciona el texto para reemplazar fácilmente
    }
  }
}
