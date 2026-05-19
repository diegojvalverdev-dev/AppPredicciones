import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { RouterLink }        from '@angular/router';
import { NavbarComponent }   from '../../shared/components/nav/bottom-nav';
import { AlertService }      from '../../shared/services/alert.service';
import { ApiService, GrupoUsuario } from '../../core/services/api.service';
import { extractErrorMessage } from '../../core/utils/error.utils';

export interface PronosticoPartido {
  fecha: string; grupo: string; local: string; visitante: string;
  golesLocal: number; golesVisitante: number;
  marcadorReal1: number | null; marcadorReal2: number | null;
  marcador: number | null; resultado: number | null;
  clasificado: number | null; total: number | null;
  pendiente: boolean; estado: string; equipoClasifica: string | null;
}

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './historial.html',
})
export class HistorialComponent implements OnInit {
  grupos: GrupoUsuario[]    = [];
  grupoSeleccionado: GrupoUsuario | null = null;
  cargandoGrupos  = false;
  cargando        = false;
  sinDatos        = false;
  partidos: PronosticoPartido[] = [];
  vistaHistorial: 'tarjetas' | 'tabla' = 'tarjetas';

  constructor(
    private apiService:   ApiService,
    private alertService: AlertService,
    private cdr:          ChangeDetectorRef,
    
  ) {}

  ngOnInit() { this.cargarGrupos(); }

  cargarGrupos() {
    this.cargandoGrupos = true;
    this.apiService.getGruposUsuario().subscribe({
      next: (res) => {
        this.grupos = Array.isArray(res) ? res : [];
        this.cargandoGrupos = false;
        if (this.grupos.length) {
          this.grupoSeleccionado = this.grupos[0];
          this.cargarHistorial();
        }
        this.cdr.detectChanges();
      },
      error: () => { this.cargandoGrupos = false; this.cdr.detectChanges(); },
    });
  }

  onCambiarGrupo(id: string) {
    const g = this.grupos.find(x => x.gru_id === Number(id));
    if (g) { this.grupoSeleccionado = g; this.cargarHistorial(); }
  }

  cargarHistorial() {
    if (!this.grupoSeleccionado) return;
    this.cargando = true; this.sinDatos = false; this.partidos = [];
    this.cdr.detectChanges();

    this.apiService.getHistorial(this.grupoSeleccionado.gru_id).subscribe({
      next: (res: any) => {
        const lista: any[] = Array.isArray(res) ? res : [];
        this.partidos = lista.map(p => this.mapPartido(p));
        this.sinDatos = this.partidos.length === 0;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargando = false; this.sinDatos = true;
        this.cdr.detectChanges();
        this.alertService.error(`Error al cargar historial. ${extractErrorMessage(err)}`);
      },
    });
  }

  private mapPartido(p: any): PronosticoPartido {
    const fechaRaw = p['HoraPartido'] ?? p['Hora'] ?? '';
    return {
      fecha:          fechaRaw ? new Date(fechaRaw).toLocaleString('es-EC',
                        { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }).toUpperCase() : '—',
      grupo:          p['Fase'] != null ? `FASE ${p['Fase']}` : '—',
      local:          p['PaisLocal']           ?? '—',
      visitante:      p['PaisVisitante']       ?? '—',
      golesLocal:     p['Goles1']              ?? 0,
      golesVisitante: p['Goles2']              ?? 0,
      marcadorReal1:  p['MarcadorFinalGoles1'] ?? null,
      marcadorReal2:  p['MarcadorFinalGoles2'] ?? null,
      marcador:       p['Marcador']            ?? null,
      resultado:      p['Resultado']           ?? null,
      clasificado:    p['Clasificado']         ?? null,
      equipoClasifica:p['MarcadorFinalPaisClasifica']         ?? null,
      pendiente:      p['Estado'] === 'PEN' || p['PuntajeProcesado'] === false,
      estado:         p['Estado']              ?? '—',
      total:          p['Puntos'] == null ? 0 : p['Puntos'],
    };
  }

  get totalPuntos(): number {
    return this.partidos.reduce((s, p) => s + (p.total ?? 0), 0);
  }
}
