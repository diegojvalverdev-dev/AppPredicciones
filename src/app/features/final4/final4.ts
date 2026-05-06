import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { RouterLink }      from '@angular/router';
import { NavbarComponent } from '../../shared/components/nav/bottom-nav';
import { AlertComponent }  from '../../shared/components/alert/alert';
import { AlertService }    from '../../shared/services/alert.service';
import { ApiService, GrupoUsuario } from '../../core/services/api.service';
import { extractErrorMessage } from '../../core/utils/error.utils';

@Component({
  selector: 'app-final4',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, AlertComponent],
  templateUrl: './final4.html',
})
export class Final4Component implements OnInit {

  // ── Estado de habilitación ────────────────────────────────────
  cargando   = true;
  habilitado = false;

  // Grupo que tiene Final 4 activo (el primero que lo tenga)
  grupoActivo: GrupoUsuario | null = null;
  grupos: GrupoUsuario[] = [];

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

  constructor(
    private apiService:   ApiService,
    private alertService: AlertService,
    private cdr:          ChangeDetectorRef,
  ) {}

  ngOnInit() {
    // 1. Cargar grupos del usuario
    this.apiService.getGruposUsuario().subscribe({
      next: (res: any) => {
        this.grupos = Array.isArray(res) ? res : [];
        // 2. Por cada grupo, cargar su detalle y verificar FINAL_4_HABILITADO
        this.verificarFinal4();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  private verificarFinal4() {
    if (!this.grupos.length) {
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    let pendientes = this.grupos.length;
    let encontrado = false;

    this.grupos.forEach(g => {
      this.apiService.getGrupoDetalle(g.gru_id).subscribe({
        next: (detalle: any) => {
          pendientes--;

          if (!encontrado) {
            const paramF4 = (detalle.Parametros ?? []).find(
              (p: any) => p.par_clave_parametro === 'FINAL_4_HABILITADO'
            );
            const activo = paramF4?.par_valorStr === '1' ||
                           paramF4?.par_valorStr === 'true' ||
                           paramF4?.par_valorNum === 1;

            if (activo) {
              encontrado    = true;
              this.habilitado = true;
              this.grupoActivo = g;
              this.grupo  = g.gru_nombre;
              this.torneo = 'COPA DEMO 2026';

              // Cargar equipos disponibles del grupo
              this.cargarEquipos(g.gru_id);
            }
          }

          if (pendientes === 0 && !encontrado) {
            this.habilitado = false;
            this.cargando   = false;
            this.cdr.detectChanges();
          }
        },
        error: () => {
          pendientes--;
          if (pendientes === 0 && !encontrado) {
            this.habilitado = false;
            this.cargando   = false;
            this.cdr.detectChanges();
          }
        },
      });
    });
  }

  private cargarEquipos(grupoId: number) {
    this.apiService.getGruposEquipos(grupoId).subscribe({
      next: (res: any) => {
        const lista: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        // Extraer países únicos de los partidos
        const paises = new Set<string>();
        lista.forEach((p: any) => {
          if (p.pais1 ?? p.equipo1 ?? p.local)
            paises.add(p.pais1 ?? p.equipo1 ?? p.local);
          if (p.pais2 ?? p.equipo2 ?? p.visitante)
            paises.add(p.pais2 ?? p.equipo2 ?? p.visitante);
        });
        this.equipos  = paises.size ? [...paises] : this.equiposPorDefecto();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.equipos  = this.equiposPorDefecto();
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  private equiposPorDefecto(): string[] {
    return ['Ecuador','Argentina','Brasil','Colombia','Uruguay',
            'Chile','México','Paraguay','Perú','Bolivia','Venezuela'];
  }

  opcionesDisponibles(excluir: string[]): string[] {
    return this.equipos.filter(e => !excluir.includes(e));
  }

  guardar() {
    this.error = '';
    if (!this.campeon || !this.subcampeon || !this.tercero || !this.cuarto) {
      this.error = 'Debes seleccionar los 4 puestos del podio.';
      return;
    }
    const sel = [this.campeon, this.subcampeon, this.tercero, this.cuarto];
    if (new Set(sel).size !== 4) {
      this.error = 'No puedes seleccionar el mismo equipo en dos puestos.';
      return;
    }
    this.alertService.success('Final 4 guardado exitosamente.');
  }
}
