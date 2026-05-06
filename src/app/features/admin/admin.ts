import { Component, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { RouterLink }      from '@angular/router';
import { NavbarComponent } from '../../shared/components/nav/bottom-nav';
import { ApiService }      from '../../core/services/api.service';
import { extractErrorMessage } from '../../core/utils/error.utils';

interface AlertData { type: 'success'|'error'; message: string; }
export interface Partido {
  id: number; grupo: string; fase: string; local: string; visitante: string;
  fecha: string; golesLocal: number|null; golesVisitante: number|null; guardado: boolean;
}
export interface Evento { id: number; nombre: string; partidos: Partido[]; }

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './admin.html',
})
export class AdminComponent implements OnInit {

  // Eventos cargados del API + locales creados en esta sesión
  eventosAPI: any[]    = [];
  eventos = signal<Evento[]>([]);
  cargandoEventos = false;

  // Alert inline
  alertData: AlertData | null = null;
  private alertTimer: any;
  showAlert(type: 'success'|'error', msg: string) {
    clearTimeout(this.alertTimer);
    this.alertData = { type, message: msg };
    this.cdr.detectChanges();
    this.alertTimer = setTimeout(() => { this.alertData = null; this.cdr.detectChanges(); }, 5000);
  }

  // Popup nuevo evento
  showPopup    = false;
  popupNombre  = '';
  popupLoading = false;

  abrirPopup()  { this.showPopup = true; this.popupNombre = ''; this.popupLoading = false; }
  cerrarPopup() { if (!this.popupLoading) this.showPopup = false; }

  crearEvento() {
    if (!this.popupNombre.trim()) return;
    const nuevo: Evento = { id: Date.now(), nombre: this.popupNombre.trim(), partidos: [] };
    this.eventos.update(evs => [...evs, nuevo]);
    this.showAlert('success', `Evento "${nuevo.nombre}" creado.`);
    this.showPopup = false;
  }

  eliminarEvento(id: number) {
    if (!confirm('¿Eliminar este evento y todos sus partidos?')) return;
    this.eventos.update(evs => evs.filter(e => e.id !== id));
    this.showAlert('success', 'Evento eliminado.');
  }

  // Formulario partido por evento
  formPartido: Record<number, { grupo:string; fase:string; local:string; visitante:string; fecha:string; }> = {};

  initForm(eventoId: number) {
    if (!this.formPartido[eventoId]) {
      this.formPartido[eventoId] = { grupo:'Grupo A', fase:'Grupos', local:'', visitante:'', fecha:'' };
    }
    return this.formPartido[eventoId];
  }

  agregarPartido(evento: Evento) {
    const f = this.formPartido[evento.id];
    if (!f?.local.trim() || !f?.visitante.trim()) { this.showAlert('error', 'Completa Local y Visitante.'); return; }
    const nuevo: Partido = {
      id: Date.now(), grupo: f.grupo.toUpperCase(), fase: f.fase,
      local: f.local.trim(), visitante: f.visitante.trim(),
      fecha: f.fecha ? new Date(f.fecha).toLocaleString('es-EC') : new Date().toLocaleString('es-EC'),
      golesLocal: null, golesVisitante: null, guardado: false,
    };
    this.eventos.update(evs => evs.map(e => e.id === evento.id ? { ...e, partidos: [...e.partidos, nuevo] } : e));
    f.local = ''; f.visitante = ''; f.fecha = '';
    this.showAlert('success', 'Partido agregado.');
  }

  eliminarPartido(eventoId: number, partidoId: number) {
    this.eventos.update(evs => evs.map(e => e.id === eventoId ? { ...e, partidos: e.partidos.filter(p => p.id !== partidoId) } : e));
  }

  guardarResultado(p: Partido) {
    if (p.golesLocal === null || p.golesVisitante === null) { this.showAlert('error', 'Ingresa el marcador completo.'); return; }
    p.guardado = true;
    this.showAlert('success', `${p.local} ${p.golesLocal} - ${p.golesVisitante} ${p.visitante} guardado.`);
  }

  resumenEvento(e: Evento): string {
    const grupos = [...new Set(e.partidos.map(p => p.grupo))];
    return `${grupos.join(' · ')}${grupos.length ? ' — ' : ''}${e.partidos.length} partido${e.partidos.length !== 1 ? 's' : ''}`;
  }

  getNombreEvento(e: any): string { return e?.nombre ?? e?.evt_nombre ?? e?.Nombre ?? '—'; }

  fases  = ['Grupos','Octavos','Cuartos','Semifinal','Final'];
  grupos = ['Grupo A','Grupo B','Grupo C','Grupo D'];

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargandoEventos = true;
    this.apiService.getEventosDisponibles().subscribe({
      next: (res: any) => {
        this.eventosAPI     = Array.isArray(res) ? res : [];
        this.cargandoEventos = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargandoEventos = false; this.cdr.detectChanges(); },
    });
  }
}
