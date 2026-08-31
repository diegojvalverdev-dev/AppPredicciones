import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet }      from '@angular/router';
import { CommonModule }      from '@angular/common';
import { AlertService, AlertData } from './shared/services/alert.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <router-outlet />

    <!-- Global Alert Overlay -->
    <div *ngIf="alerta"
      style="position:fixed;inset:0;background:rgba(0,0,0,.65);
             display:flex;align-items:center;justify-content:center;
             z-index:99999;padding:20px;"
      (click)="cerrar()">
      <div (click)="$event.stopPropagation()"
        [style.border]="alerta.type==='success'?'1px solid rgba(74,222,128,.5)':'1px solid rgba(239,68,68,.4)'"
        style="background:#112614;border-radius:20px;padding:32px 28px 24px;
               max-width:340px;width:100%;text-align:center;">

        <!-- Ícono -->
        <div [style.background]="alerta.type==='success'?'rgba(74,222,128,.15)':'rgba(239,68,68,.15)'"
          [style.color]="alerta.type==='success'?'#4ade80':'#f87171'"
          style="width:64px;height:64px;border-radius:50%;display:flex;
                 align-items:center;justify-content:center;margin:0 auto 16px;">
          <svg *ngIf="alerta.type==='success'" width="32" height="32" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="9 12 11.5 14.5 15 10"/>
          </svg>
          <svg *ngIf="alerta.type==='error'" width="32" height="32" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8"  x2="12"   y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <!-- Título -->
        <p style="font-size:18px;font-weight:900;margin:0 0 8px;color:#fff;">
          {{ alerta.type === 'success' ? '¡Éxito!' : '¡Atención!' }}
        </p>

        <!-- Mensaje -->
        <p [style.color]="alerta.type==='success'?'#6b9c78':'#fca5a5'"
          style="font-size:14px;margin:0 0 24px;line-height:1.5;">
          {{ alerta.message }}
        </p>

        <!-- Botón -->
        <button (click)="cerrar()"
          [style.background]="alerta.type==='success'?'#4ade80':'#f87171'"
          style="width:100%;padding:12px;border-radius:10px;border:none;
                 font-size:14px;font-weight:700;cursor:pointer;color:#000;">
          Aceptar
        </button>
      </div>
    </div>
  `,
})
export class App implements OnInit {
  alerta: AlertData | null = null;

  constructor(private alertService: AlertService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.alertService.register((data) => {
      this.alerta = data;
      this.cdr.detectChanges();
    });
  }

  cerrar() { this.alertService.dismiss(); }
}
