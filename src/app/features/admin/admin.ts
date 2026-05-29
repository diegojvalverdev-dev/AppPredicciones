import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule, ReactiveFormsModule  }       from '@angular/forms';
import { ApiService }          from '../../core/services/api.service';
import { AlertService }      from '../../shared/services/alert.service';
import { extractErrorMessage } from '../../core/utils/error.utils';
import { NavbarComponent }     from '../../shared/components/nav/bottom-nav';
import { AuthService } from '../../core/services/auth';

export interface Usuario {
  Login:   string;
  Nombre:   string;
  Telefono: string;
  Email: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, ReactiveFormsModule],
  templateUrl: './admin.html',
})
export class AdminComponent implements OnInit {
  //form: FormGroup;
  loading = false;
  IdUsuario = 0;
  nombre = '';
  telefono = '';
  email = '';
  varError = 0;

  constructor(
    private apiService:   ApiService,
    private alertService: AlertService,
    private cdr:          ChangeDetectorRef,
    private authService:  AuthService,
  ) { }

  ngOnInit() {
    const usuario     = this.authService.getUsuario();
    this.IdUsuario    = usuario?.['id'] ?? usuario?.['Id'] ?? 0;
    console.log(this.IdUsuario);
    this.TraerInfoUsuario(this.IdUsuario);
  }

  TraerInfoUsuario(id: number){
    this.apiService.getTraerTelefono(id).subscribe({
      next: (info) => {
        this.nombre = info.Nombre;
        this.telefono = info.Telefono.substring(3); 
        this.email = info.Email;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.alertService.error(`Error al traer información. ${extractErrorMessage(err)}`);
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit() {

    this.loading = true;
    this.varError = 0;

    if(this.nombre == ''){
      this.alertService.error('Debe agregar un nombre.');
      this.varError = 1;
    }

    if(this.telefono == ''){
      this.alertService.error('Debe agregar un telefono.');
      this.varError = 1;
    }

    if(this.telefono.length < 9 || this.telefono.length > 9){
      this.alertService.error('Debe agregar un telefono válido.');
      this.varError = 1;
    }

    if(this.email == ''){
      this.alertService.error('Debe agregar un email.');
      this.varError = 1;
    }

    if(this.varError == 1){
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.apiService.actualizarDatos(this.IdUsuario,{
      Login:    '',
      Nombre:   this.nombre.trim(),
      Telefono: `593${this.telefono.trim()}`,
      Email: this.email.trim(),
    }).subscribe({
      next: () => {
        this.loading = false;
        this.alertService.success('Usuario actualizado exitosamente.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.alertService.error(`Error al actualizar. ${extractErrorMessage(err)}`);
        this.cdr.detectChanges();
      },
    });
  }
}
