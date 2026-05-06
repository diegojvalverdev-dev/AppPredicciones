import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { RouterLink }      from '@angular/router';
import { NavbarComponent } from '../../shared/components/nav/bottom-nav';
import { AuthService }     from '../../core/services/auth';
import { ApiService, GrupoUsuario } from '../../core/services/api.service';
import { Usuario }         from '../../core/models/usuario.model';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './inicio.html',
})
export class InicioComponent implements OnInit {
  usuario: Usuario | null = null;
  grupos: GrupoUsuario[] = [];
  cargando = false;

  get nombreMostrar(): string {
    if (!this.usuario) return '';
    return this.usuario['nombre'] || this.usuario['login'] || 'Usuario';
  }

  get saludo(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  constructor(
    private authService: AuthService,
    private apiService:  ApiService,
    private cdr:         ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    this.cargarGrupos();
  }

  cargarGrupos() {
    this.cargando = true;
    this.apiService.getGruposUsuario().subscribe({
      next: (res) => {
        this.grupos  = Array.isArray(res) ? res : [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  esOwner(g: GrupoUsuario): boolean {
    return g.gru_idUsuario_Admin === this.usuario?.['id'];
  }
}
