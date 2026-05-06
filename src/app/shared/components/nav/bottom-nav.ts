import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { Usuario }     from '../../../core/models/usuario.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.html',
})
export class NavbarComponent implements OnInit {
  menuOpen = false;
  usuario: Usuario | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
  }

  get displayName(): string {
    if (!this.usuario) return 'USUARIO';
    const nombre = this.usuario['nombre'] || this.usuario['login'] || 'USUARIO';
    return nombre.toString().toUpperCase();
  }

  toggleMenu() { this.menuOpen = !this.menuOpen; }
  closeMenu()  { this.menuOpen = false;           }

  logout() {
    this.closeMenu();
    this.authService.logout();
  }
}
