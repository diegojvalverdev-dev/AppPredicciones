import { Component, signal } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { RouterLink }        from '@angular/router';
import { NavbarComponent }   from '../../shared/components/nav/bottom-nav';
import { AlertService }      from '../../shared/services/alert.service';

export interface Partido {
  id: number; grupo: string; fase: string;
  local: string; visitante: string; fecha: string;
  golesLocal: number | null; golesVisitante: number | null;
  guardado: boolean;
}

export interface Evento { id: number; nombre: string; partidos: Partido[]; }

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './admin.html',
})
export class AdminComponent {

  eventos = signal<Evento[]>([
    {
      id: 1, nombre: 'Copa Demo 2026',
      partidos: [
        { id:1, grupo:'GRUPO A', fase:'Grupos', local:'Ecuador',   visitante:'Brasil',  fecha:'29/4/2026, 10:21:08 a. m.', golesLocal:null, golesVisitante:null, guardado:false },
        { id:2, grupo:'GRUPO A', fase:'Grupos', local:'Argentina', visitante:'Uruguay', fecha:'29/4/2026, 11:21:08 a. m.', golesLocal:null, golesVisitante:null, guardado:false },
        { id:3, grupo:'GRUPO B', fase:'Grupos', local:'Colombia',  visitante:'Chile',   fecha:'30/4/2026, 10:21:08 a. m.', golesLocal:null, golesVisitante:null, guardado:false },
      ],
    },
  ]);

  showPopup    = false;
  popupNombre  = '';
  popupLoading = false;

  abrirPopup()  { this.showPopup = true; this.popupNombre = ''; }
  cerrarPopup() { if (!this.popupLoading) this.showPopup = false; }

  crearEvento() {
    if (!this.popupNombre.trim()) return;
    const nuevo: Evento = { id: Date.now(), nombre: this.popupNombre.trim(), partidos: [] };
    this.eventos.update(evs => [...evs, nuevo]);
    this.alertService.success(`Evento "${nuevo.nombre}" creado.`);
    this.showPopup = false;
  }

  eliminarEvento(id: number) {
    if (!confirm('¿Eliminar este evento y todos sus partidos?')) return;
    this.eventos.update(evs => evs.filter(e => e.id !== id));
    this.alertService.success('Evento eliminado.');
  }

  formPartido: Record<number, { grupo:string; fase:string; local:string; visitante:string; fecha:string }> = {};

  initForm(eventoId: number) {
    if (!this.formPartido[eventoId])
      this.formPartido[eventoId] = { grupo:'Grupo A', fase:'Grupos', local:'', visitante:'', fecha:'' };
    return this.formPartido[eventoId];
  }

  agregarPartido(evento: Evento) {
    const f = this.formPartido[evento.id];
    if (!f?.local.trim() || !f?.visitante.trim()) {
      this.alertService.error('Completa Local y Visitante.');
      return;
    }
    const nuevo: Partido = {
      id: Date.now(), grupo: f.grupo.toUpperCase(), fase: f.fase,
      local: f.local.trim(), visitante: f.visitante.trim(),
      fecha: f.fecha ? new Date(f.fecha).toLocaleString('es-EC') : new Date().toLocaleString('es-EC'),
      golesLocal: null, golesVisitante: null, guardado: false,
    };
    this.eventos.update(evs =>
      evs.map(e => e.id === evento.id ? { ...e, partidos: [...e.partidos, nuevo] } : e)
    );
    f.local = ''; f.visitante = ''; f.fecha = '';
    this.alertService.success('Partido agregado.');
  }

  eliminarPartido(eventoId: number, partidoId: number) {
    this.eventos.update(evs =>
      evs.map(e => e.id === eventoId
        ? { ...e, partidos: e.partidos.filter(p => p.id !== partidoId) } : e)
    );
  }

  guardarResultado(p: Partido) {
    if (p.golesLocal === null || p.golesVisitante === null) {
      this.alertService.error('Ingresa el marcador completo.');
      return;
    }
    p.guardado = true;
    this.alertService.success(`${p.local} ${p.golesLocal} - ${p.golesVisitante} ${p.visitante} guardado.`);
  }

  resumenEvento(e: Evento): string {
    const grupos = [...new Set(e.partidos.map(p => p.grupo))];
    return `${grupos.join(' · ')}${grupos.length ? ' — ' : ''}${e.partidos.length} partido${e.partidos.length !== 1 ? 's' : ''}`;
  }

  fases  = ['Grupos','Octavos','Cuartos','Semifinal','Final'];
  grupos = ['Grupo A','Grupo B','Grupo C','Grupo D'];

  constructor(private alertService: AlertService) {}
}
