import { Component, Input } from '@angular/core';
import { CommonModule }     from '@angular/common';
import { AlertData }        from '../../services/alert.service';

/**
 * Componente de alerta SIMPLE — recibe los datos vía @Input.
 * El componente padre controla el estado directamente (sin servicio).
 */
@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="data"
      style="position:fixed;inset:0;background:rgba(0,0,0,.65);
             display:flex;align-items:center;justify-content:center;
             z-index:9999;padding:20px;"
      (click)="data = null">
      <div (click)="$event.stopPropagation()"
        style="background:#112614;border-radius:20px;padding:32px 28px 24px;
               max-width:340px;width:100%;text-align:center;
               animation:slideUp .2s ease;"
        [style.borderColor]="data.type==='success' ? 'rgba(74,222,128,.5)' : 'rgba(239,68,68,.4)'"
        style2="border:1px solid;">

        <!-- Ícono -->
        <div style="width:64px;height:64px;border-radius:50%;
                    display:flex;align-items:center;justify-content:center;margin:0 auto 16px;"
          [style.background]="data.type==='success' ? 'rgba(74,222,128,.15)' : 'rgba(239,68,68,.15)'"
          [style.color]="data.type==='success' ? '#4ade80' : '#f87171'">
          <svg *ngIf="data.type==='success'" width="32" height="32" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="9 12 11.5 14.5 15 10"/>
          </svg>
          <svg *ngIf="data.type==='error'" width="32" height="32" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <p style="font-size:18px;font-weight:900;margin:0 0 8px;color:#fff;">
          {{ data.type === 'success' ? '¡Éxito!' : '¡Atención!' }}
        </p>
        <p style="font-size:14px;margin:0 0 24px;line-height:1.5;"
          [style.color]="data.type==='success' ? '#6b9c78' : '#fca5a5'">
          {{ data.message }}
        </p>

        <button (click)="data = null"
          style="width:100%;padding:12px;border-radius:10px;border:none;
                 font-size:14px;font-weight:700;cursor:pointer;letter-spacing:.5px;"
          [style.background]="data.type==='success' ? '#4ade80' : '#f87171'"
          style2="color:#000">
          Aceptar
        </button>
      </div>
    </div>
  `,
})
export class AlertComponent {
  @Input() data: AlertData | null = null;
}
