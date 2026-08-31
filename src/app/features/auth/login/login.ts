import { Component }           from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink }  from '@angular/router';
import { CommonModule }        from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService }         from '../../../core/services/auth';
import { AlertService }        from '../../../shared/services/alert.service';
import { extractErrorMessage } from '../../../core/utils/error.utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  mostrarPassword = false;

  constructor(
    private fb:           FormBuilder,
    private authService:  AuthService,
    private alertService: AlertService,
    private router:       Router,
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.maxLength(40)]],
      password: ['', [Validators.required, Validators.maxLength(100)]],
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;

    const { username, password } = this.form.value;

    this.authService.login(username.trim(), password).subscribe({
      next: () => this.router.navigate(['/inicio']),
      error: (err) => {
        this.loading = false;
        const msg = extractErrorMessage(err);
        // Detectar "usuario no encontrado" en el mensaje del servidor
        const notFound =
          err?.status === 404 || err?.status === 401 ||
          msg.toLowerCase().includes('no encontrado') ||
          msg.toLowerCase().includes('not found')     ||
          msg.toLowerCase().includes('no existe')     ||
          msg.toLowerCase().includes('usuario');

        this.alertService.error(notFound ? `Datos de login incorrectos.` : `Error de Login. ${msg}`);
      },
    });
  }
}
