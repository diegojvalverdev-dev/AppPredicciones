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
  mostrarPassword = false;
  mostrarPassword2 = false;
  valemail = false;
  valpassword = false;

  constructor(
    private fb:           FormBuilder,
    private router:       Router,
    private apiService:   ApiService,
    private alertService: AlertService,
  ) {
    this.form = this.fb.group({
      login:    ['', [Validators.required, Validators.minLength(3), Validators.maxLength(40)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password2: ['', [Validators.required, Validators.minLength(6)]],
      nombre:   ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      email: ['', [Validators.required, Validators.minLength(6)]],
      email2: ['', [Validators.required, Validators.minLength(6)]],
    }, { validators: [this.matchPasswords.bind(this), this.matchEmails.bind(this)] });
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

  private matchPasswords = (group: FormGroup) => {
    const pass = group.get('password')?.value;
    const confirm = group.get('password2')?.value;
    this.valpassword = pass !== confirm && pass !== '' && confirm !== '' ? true : false;
    return pass === confirm ? null : { mismatch: true };
  }

  private matchEmails = (group: FormGroup) => {
    const email = group.get('email')?.value;
    const confirm = group.get('email2')?.value;
    this.valemail = email !== confirm && email !== '' && confirm !== '' ? true : false;
    return email === confirm ? null : { mismatch: true };
  }
}
