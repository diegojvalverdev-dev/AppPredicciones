import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule, ReactiveFormsModule }     from '@angular/forms';
import { NavbarComponent } from '../../shared/components/nav/bottom-nav';
import { ApiService }      from '../../core/services/api.service';

interface Partido {
  id:              number;
  idEvento:        number;
  numero_partido:  number;
  fase:            number;
  grupo:           string;
  fecha:           string;
  pais1:           string;
  pais2:           string;
  goles1:          number | null;
  goles2:          number | null;
  estado:          string;
}

interface GrupoFecha { label: string; partidos: Partido[]; }

@Component({
  selector: 'app-partidos',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, ReactiveFormsModule],
  templateUrl: './partidos.html',
})
export class PartidosComponent implements OnInit {
  // Eventos
  eventos: any[]    = [];
  eventoActivo: any = null;

  // Fechas — por defecto: semana actual
  desde = this.hoy();
  hasta = this.enDias(7);

  // Rangos rápidos
  rangoActivo = 'Esta semana';
  rangos = ['Hoy', 'Esta semana', 'Este mes'];

  // Partidos
  partidos: Partido[]    = [];
  fechas:   GrupoFecha[] = [];
  cargando  = false;

  estadoId = 'PEN';

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.apiService.getEventosDisponibles().subscribe({
      next: (res: any) => {
        this.eventos = Array.isArray(res) ? res : (res?.data ?? []);
        if (this.eventos.length) {
          this.eventoActivo = this.eventos[0];
          this.buscarPartidos();
        }
        this.cdr.detectChanges();
      },
    });
  }

  get eventoNombre(): string {
    return this.eventoActivo?.eve_descripcion ?? this.eventoActivo?.eve_description ?? 'Evento';
  }

  get eventoId(): number {
    return this.eventoActivo?.eve_id ?? this.eventoActivo?.id ?? 0;
  }

  onCambiarEvento(id: string) {
    this.eventoActivo = this.eventos.find(e => (e.eve_id ?? e.id) === Number(id)) ?? null;
    this.buscarPartidos();
  }

  aplicarRango(rango: string) {
    this.rangoActivo = rango;
    switch (rango) {
      case 'Hoy':        this.desde = this.hoy();      this.hasta = this.hoy();      break;
      case 'Esta semana':this.desde = this.hoy();      this.hasta = this.enDias(7);  break;
      case 'Este mes':   this.desde = this.hoy();      this.hasta = this.enDias(30); break;
    }
    this.buscarPartidos();
  }

  buscarPartidos() {
    if (!this.eventoActivo || !this.desde || !this.hasta) return;
    this.cargando = true;
    this.partidos = [];
    this.fechas   = [];
    this.cdr.detectChanges();

    this.apiService.getPartidosPorRango(this.eventoId, this.desde, this.hasta, this.estadoId).subscribe({
      next: (res: any) => {
        this.partidos = Array.isArray(res) ? res : [];
        this.fechas   = this.agruparPorFecha(this.partidos);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  private agruparPorFecha(lista: Partido[]): GrupoFecha[] {
    const mapa: Record<string, Partido[]> = {};
    lista.forEach(p => {
      const dia = p.fecha?.substring(0, 10) ?? '';
      if (!mapa[dia]) mapa[dia] = [];
      mapa[dia].push(p);
    });
    return Object.entries(mapa)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dia, partidos]) => ({
        label: new Date(dia + 'T12:00:00')
          .toLocaleDateString('es-EC', {
            weekday: 'long', day: 'numeric',
            month: 'long', year: 'numeric',
          }).toUpperCase(),
        partidos,
      }));
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = { PEN: 'Pendiente', FIN: 'Finalizado' };
    return map[estado] ?? estado;
  }

  estadoColor(estado: string): string {
    return estado === 'FIN' ? '#4ade80' : '#fbbf24';
  }

  formatHora(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  }

  private hoy(): string {
    return new Date().toISOString().substring(0, 10);
  }

  private enDias(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().substring(0, 10);
  }
}
