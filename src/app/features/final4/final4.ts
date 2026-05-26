import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { RouterLink }      from '@angular/router';
import { NavbarComponent } from '../../shared/components/nav/bottom-nav';
import { AlertService }    from '../../shared/services/alert.service';
import { ApiService, GrupoUsuario, Final4Response } from '../../core/services/api.service';
import { CrearFinalFourRequest } from '../../core/services/api.service';
import { extractErrorMessage }  from '../../core/utils/error.utils';

@Component({
  selector: 'app-final4',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './final4.html',
})
export class Final4Component implements OnInit {

  // ── Grupos del usuario ────────────────────────────────────────
  grupos: GrupoUsuario[]    = [];
  grupoActivo: GrupoUsuario | null = null;
  cargando   = true;

  // Final 4 habilitado para el grupo activo
  habilitado = false;

  grupo  = '';
  torneo = '';

  // ── Formulario ────────────────────────────────────────────────
  equipos: string[] = [];
  campeon    = '';
  subcampeon = '';
  tercero    = '';
  cuarto     = '';
  mvp        = '';
  goleador   = '';
  golesGoleador: number | null = null;
  error = '';
  fechatope = new Date().toISOString().slice(0,16); // formato 'YYYY-MM-DDTHH:mm'
  fechaHoy = new Date().toISOString().slice(0,16);

  // ── Buscador de jugadores ─────────────────────────────────────
  jugadores: any[]         = [];
  cargandoJugadores        = false;

  dropdownAbierto: string | null = null; // nombre del campo activo
  busquedaMvp              = '';   // ← agregar
  busquedaGoleador         = '';   // ← agregar

  //cargando información del grupo y equipos
  cargandoDatos   = false;
  yaGuardado      = false;

  constructor(
    private apiService:   ApiService,
    private alertService: AlertService,
    private cdr:          ChangeDetectorRef,
  ) {}
  

  ngOnInit() {
    this.apiService.getGruposUsuario().subscribe({
      next: (res: any) => {
        this.grupos = Array.isArray(res) ? res : [];
        if (this.grupos.length) {
          this.seleccionarGrupo(this.grupos[0]);
        } else {
          this.cargando = false;
          this.cdr.detectChanges();
        }
      },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });
  }

  onCambiarGrupo(id: string) {
    const g = this.grupos.find(x => x.gru_id === Number(id));
    if (g) this.seleccionarGrupo(g);
  }

  seleccionarGrupo(g: GrupoUsuario) {
    this.grupoActivo = g;
    this.grupo       = g.gru_nombre;
    this.cargando    = true;
    this.habilitado  = false;

    // Limpiar búsqueda al cambiar de grupo
    this.busquedaMvp      = '';
    this.busquedaGoleador = '';
    this.mvp              = '';
    this.goleador         = '';
    this.golesGoleador    = null;
    this.dropdownAbierto  = null;

    this.resetForm();
    this.cdr.detectChanges();

    // Verificar parámetro FINAL_4_HABILITADO del grupo
    this.apiService.getGrupoDetalle(g.gru_id).subscribe({
      next: (detalle: any) => {
        const paramF4 = (detalle.Parametros ?? []).find(
          (p: any) => p.par_clave_parametro === 'FINAL_4_HABILITADO'
        );
        this.habilitado =
          paramF4?.par_valorStr === 'SI'    ||
          paramF4?.par_valorStr === 'true' ||
          paramF4?.par_valorNum  === 1;

        const paramFecha = (detalle.Parametros ?? []).find(
          (p: any) => p.par_clave_parametro === 'FECHA_TOPE_GOLEADOR'
        );

        if (paramFecha?.par_valorDate) {
          const fecha = new Date(paramFecha.par_valorDate);
          const año   = fecha.getFullYear();

          // Si el año es mayor a 9000 (fecha "infinita" del servidor), dejar vacío
          if (año > 9000) {
            this.fechatope = '';
          } else {
            fecha.setDate(fecha.getDate() + 1);
            this.fechatope = fecha.toISOString().slice(0, 16);
          }
        } else {
          this.fechatope = '';
        }

        if (this.habilitado) {
          this.cargarEquipos(g.gru_idEvento);
          this.cargarFinal4(g.gru_id);
          this.cargarJugadores(g.gru_idEvento); 
        } else {
          this.cargando = false;
          this.cdr.detectChanges();
        }
      },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });
  }

  private cargarEquipos(eventoId: number) {
  this.apiService.getTraerEquipos(eventoId).subscribe({
    next: (res: any) => {
      const lista: any[] = Array.isArray(res) ? res : (res?.data ?? []);

      this.equipos = lista
        .map((p: any) => p.Nombre ?? p.nombre ?? p.pais1 ?? p.equipo1 ?? '')
        .filter((nombre: string) => nombre.trim() !== '');

      if (!this.equipos.length) this.equipos = this.defaultEquipos();
      this.cargando = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.equipos  = this.defaultEquipos();
      this.cargando = false;
      this.cdr.detectChanges();
    },
  });
}

  private defaultEquipos(): string[] {
    return [
      "México",
      "Canadá",
      "Estados Unidos",
      "Argentina",
      "Brasil",
      "Colombia",
      "Ecuador",
      "Paraguay",
      "Uruguay",
      "Australia",
      "Irán",
      "Japón",
      "Jordania",
      "Corea del Sur",
      "Catar",
      "Arabia Saudita",
      "Uzbekistán",
      "Irak",
      "Nueva Zelanda",
      "Argelia",
      "Cabo Verde",
      "Costa de Marfil",
      "Egipto",
      "Ghana",
      "Marruecos",
      "Senegal",
      "Sudáfrica",
      "Túnez",
      "República Democrática del Congo",
      "Curazao",
      "Haití",
      "Panamá",
      "Austria",
      "Bélgica",
      "Bosnia y Herzegovina",
      "Croacia",
      "República Checa",
      "Inglaterra",
      "Francia",
      "Alemania",
      "Países Bajos",
      "Noruega",
      "Portugal",
      "Escocia",
      "España",
      "Suecia",
      "Suiza",
      "Turquía"
    ];
  }

  opcionesDisponibles(excluir: string[]): string[] {
    return this.equipos.filter(e => !excluir.includes(e));
  }

  resetForm() {
    this.campeon = ''; this.subcampeon = ''; this.tercero = '';
    this.cuarto  = ''; this.mvp = ''; this.goleador = '';
    this.golesGoleador = null; this.error = '';
  }
  
  guardando = false;

  guardar() {
    this.error = '';

    if (!this.campeon || !this.subcampeon || !this.tercero || !this.cuarto) {
      this.error = 'Debes seleccionar los 4 puestos del podio.';
      this.alertService.error(this.error);
      return;
    }

    const sel = [this.campeon, this.subcampeon, this.tercero, this.cuarto];
    if (new Set(sel).size !== 4) {
      this.error = 'No puedes seleccionar el mismo equipo en dos puestos.';
      this.alertService.error(this.error);
      return;
    }

    //validar fecha goleador para permitir guardar, se suma 1 día para validar la fecha tope.
    if (this.fechatope) {
      const fechaTope = new Date(this.fechatope);
      const añoTope   = fechaTope.getFullYear();

      if (añoTope <= 9000 && añoTope >= 2000) {
        // Sumar 1 día en variable temporal — sin modificar this.fechatope
        const fechaTopeConDia = new Date(fechaTope);
        fechaTopeConDia.setDate(fechaTopeConDia.getDate() + 1);

        const fechaHoy = new Date();
        if (fechaTopeConDia < fechaHoy) {
          this.error = 'La fecha tope para guardar el Final 4 ya ha pasado.';
          this.alertService.error(this.error);
          return;
        }
      }
      // Si año > 9000 → fecha infinita → permitir sin restricción
    }

    const esFechaVacia = (fecha: string): boolean => {
      if (!fecha) return true;
      const año = new Date(fecha).getFullYear();
      // Si el año es mayor a 9000 o menor a 2000, se considera vacía/infinita
      return año > 9000 || año < 2000;
    };

    if (!esFechaVacia(this.fechatope) && this.fechatope < this.fechaHoy) {
      this.error = 'La fecha tope para guardar el Final 4 ya ha pasado.';
      this.alertService.error(this.error);
      return;
    }

    if(this.golesGoleador == 0 || this.golesGoleador == null) {
      this.error = 'Debe ingresar los goles del goleador.';
      this.alertService.error(this.error);
      return;
    }

    if (!this.grupoActivo) return;

    this.guardando = true;

    const body: CrearFinalFourRequest = {
      IdGrupo:       this.grupoActivo.gru_id,
      IdEvento:      this.grupoActivo.gru_idEvento,
      Campeon:       this.campeon,
      Subcampeon:    this.subcampeon,
      Tercero:       this.tercero,
      Cuarto:        this.cuarto,
      mvpEvento:     this.mvp,
      goleador:      this.goleador,
      cantGoles:     this.golesGoleador,
      horaCreacion:  new Date().toISOString(),
    };

    const accion$ = this.yaGuardado
    ? this.apiService.modificarFinalFour(body)
    : this.apiService.crearFinalFour(body);

    accion$.subscribe({
      next: () => {
        this.guardando = false;
        this.yaGuardado = true;
        this.alertService.success(
          this.yaGuardado ? 'Final 4 actualizado exitosamente.' : 'Final 4 guardado exitosamente.'
        );
      },
      error: (err: any) => {
        this.guardando = false;
        const msg = extractErrorMessage(err);
        this.alertService.error(err?.status === 400 ? msg : `Error al guardar. ${msg}`);
      },
    });
  }

  cargarFinal4(grupoId: number) {
    this.cargandoDatos = true;
    this.cdr.detectChanges();

    this.apiService.getFinalFour(grupoId).subscribe({
      next: (res: any) => {
        this.cargandoDatos = false;
        if (res) {
          // Rellenar el formulario con los datos guardados
          this.campeon       = res.Campeon        ?? res.campeon       ?? '';
          this.subcampeon    = res.Subcampeon     ?? res.subcampeon    ?? '';
          this.tercero       = res.Tercero        ?? res.Tercero       ?? '';
          this.cuarto        = res.Cuarto         ?? res.Cuarto        ?? '';
          this.mvp           = res.MVPEvento      ?? res.MVPEvento     ?? '';
          this.goleador      = res.Goleador       ?? res.goleador      ?? '';
          this.golesGoleador = res.CantGoles      ?? res.CantGoles     ?? null;
          this.yaGuardado    = true;
          this.fechatope     = res.FechaTope      ?? res.fechaTope     ?? this.fechatope;
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargandoDatos = false;
        // Si es 404 significa que aún no hay datos — no es un error real
        if (err?.status !== 404) {
          this.alertService.error(`Error al cargar Final 4. ${extractErrorMessage(err)}`);
        }
        this.cdr.detectChanges();
      },
    });
  }

  cargarJugadores(eventoId: number) {
    this.cargandoJugadores = true;
    // Ajusta el endpoint a la dirección real de tu servidor
    this.apiService.getJugadoresPorGrupo(eventoId).subscribe({
      next: (res: any) => {
        this.jugadores      = Array.isArray(res) ? res : (res?.data ?? []);
        this.cargandoJugadores = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoJugadores = false;
        this.cdr.detectChanges();
      },
    });
  }

  jugadoresFiltrados(busqueda: string): any[] {
    if (!busqueda.trim()) return this.jugadores;
    const q = busqueda.toLowerCase();
    return this.jugadores.filter(j =>
      this.nombreJugador(j).toLowerCase().includes(q)
    );
  }

  nombreJugador(j: any): string {
    return j?.nombre ?? j?.Nombre ?? j?.name ?? j?.Name ?? '';
  }

  seleccionarJugador(campo: string, nombre: string) { 
    switch (campo) {
      case 'mvp':      this.mvp      = nombre; this.busquedaMvp      = nombre; break;
      case 'goleador': this.goleador = nombre; this.busquedaGoleador = nombre; break;
    }
    this.dropdownAbierto = null;
  }

  abrirDropdown(campo: string) {
    this.dropdownAbierto = this.dropdownAbierto === campo ? null : campo;
  }

  cerrarDropdown() {
    setTimeout(() => { this.dropdownAbierto = null; }, 200);
  }
}

