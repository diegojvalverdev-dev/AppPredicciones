import { Component }           from '@angular/core';
import { CommonModule }        from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router }  from '@angular/router';
import { ApiService }          from '../../core/services/api.service';
import { AlertService }        from '../../shared/services/alert.service';
import { extractErrorMessage } from '../../core/utils/error.utils';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
})
export class RegistroComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb:           FormBuilder,
    private router:       Router,
    private apiService:   ApiService,
    private alertService: AlertService,
  ) {
    this.form = this.fb.group({
      login:    ['', [Validators.required, Validators.minLength(3), Validators.maxLength(40)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombre:   ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      email: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;

    const { login, password, nombre, telefono, email } = this.form.value;

    this.apiService.crearUsuario({
      Login:    login.trim(),
      Nombre:   nombre.trim(),
      Telefono: `593${telefono.trim()}`,
      Password: password,
      Email: email.trim(),
    }).subscribe({
      next: () => {
        this.loading = false;
        this.alertService.success('Usuario ingresado exitosamente.');
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.loading = false;
        this.alertService.error(`Error de ingreso. ${extractErrorMessage(err)}`);
      },
    });
  }
}
