import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { NavbarComponent } from '../../shared/components/nav/bottom-nav';
import { ApiService, GrupoUsuario } from '../../core/services/api.service';

@Component({
  selector: 'app-posiciones',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './posiciones.html',
})
export class PosicionesComponent implements OnInit {
  grupos: GrupoUsuario[] = [];
  grupoSeleccionado: GrupoUsuario | null = null;
  tabla: any[] = [];

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.apiService.getGruposUsuario().subscribe({
      next: (res) => {
        this.grupos = Array.isArray(res) ? res : [];
        if (this.grupos.length) this.grupoSeleccionado = this.grupos[0];
        this.cdr.detectChanges();
      },
    });
  }

  onCambiarGrupo(id: string) {
    const g = this.grupos.find(x => x.gru_id === Number(id));
    if (g) this.grupoSeleccionado = g;
  }
}
