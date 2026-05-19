// Este componente ya no se usa.
// El sistema de alertas global está en src/app/app.ts
// usando AlertService con patrón de callback.
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: '',
})
export class AlertComponent {}
