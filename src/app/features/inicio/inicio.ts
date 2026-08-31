import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { RouterLink }      from '@angular/router';
import { FormsModule }     from '@angular/forms';
import { NavbarComponent } from '../../shared/components/nav/bottom-nav';
import { AuthService }     from '../../core/services/auth';
import { ApiService, GrupoUsuario } from '../../core/services/api.service';
import { Usuario }         from '../../core/models/usuario.model';
import { AlertService }        from '../../shared/services/alert.service';
import { extractErrorMessage }  from '../../core/utils/error.utils';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FormsModule],
  templateUrl: './inicio.html',
})
export class InicioComponent implements OnInit {
  usuario: Usuario | null = null;
  grupos: GrupoUsuario[] = [];
  cargando = false;

  modalOtp    = false;
  pasoModal   = 1;          // 1 = OTP, 2 = Alias

  codigoOtp   = '';
  cargandoOtp = false;
  errorOtp    = '';

  grupoIdPendiente: number | null = null; // ID devuelto al validar OTP
  grupoNombre ='';

  aliasNuevo    = '';
  cargandoAlias = false;
  errorAlias    = '';

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
    private alertService: AlertService
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

  eliminarGrupo(event: Event, grupoId: number) {
    event.stopPropagation(); // evita que el click navegue al grupo
    event.preventDefault();
    if (!confirm('¿Eliminar este grupo? Esta acción no se puede deshacer.')) return;

    this.apiService.eliminarGrupo(grupoId).subscribe({
      next: () => {
        this.grupos = this.grupos.filter(g => g.gru_id !== grupoId);
        this.cdr.detectChanges();
        this.alertService.success('Grupo eliminado correctamente.');
      },
      error: (err : any) => {
        this.alertService.error(extractErrorMessage(err));
      },
    });
  }

  abrirModalOtp() {
    this.pasoModal        = 1;
    this.codigoOtp        = '';
    this.aliasNuevo       = '';
    this.errorOtp         = '';
    this.errorAlias       = '';
    this.grupoIdPendiente = null;
    this.modalOtp         = true;
  }

  cerrarModalOtp() {
    this.modalOtp = false;
  }

  validarOtp() {
    if (!this.codigoOtp.trim()) return;

    this.cargandoOtp = true;
    this.errorOtp    = '';

    this.apiService.validarOtp(this.codigoOtp.trim()).subscribe({
      next: (res: any) => {
        if(res.Error == ""){
          this.cargandoOtp      = false;
          this.alertService.success('¡El token es válido!');
          this.grupoIdPendiente = res.IdGrupo; // ajusta según lo que devuelva tu API
          this.grupoNombre = res.NombreGrupo; // ajusta según lo que devuelva tu API
          this.pasoModal = 2;
          this.cdr.detectChanges();
        }else{
          this.cargandoOtp = false;
          this.alertService.error(res.Error);
          this.cdr.detectChanges();
          return;
        }
        
        
      },
      error: (err: any) => {
        this.cargandoOtp = false;
        this.errorOtp    = extractErrorMessage(err) || 'Código inválido o expirado.';
        this.cdr.detectChanges();
      },
    });
  }

  guardarAlias() {
    if (!this.aliasNuevo.trim() || !this.grupoIdPendiente) return;

    this.cargandoAlias = true;
    this.errorAlias    = '';

    this.apiService.unirseAGrupo(this.aliasNuevo.trim(), this.codigoOtp.trim()).subscribe({
      next: () => {
        this.cargandoAlias = false;
        this.cerrarModalOtp();
        this.alertService.success('¡Tu alias ha sido guardado exitosamente!');
        this.cargarGrupos(); // refresca la lista
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargandoAlias = false;
        this.errorAlias    = extractErrorMessage(err) || 'No se pudo guardar el alias.';
        this.cdr.detectChanges();
      },
    });
  }
}
