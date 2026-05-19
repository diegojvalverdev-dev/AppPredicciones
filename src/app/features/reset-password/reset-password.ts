import { Component, OnInit, ChangeDetectorRef }   from '@angular/core';
import { CommonModule }        from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AlertService }        from '../../shared/services/alert.service';
import { extractErrorMessage }  from '../../core/utils/error.utils';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.html',
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading        = false;
  exitoso        = false;
  nuevoPassword  = '';
  modalCambioContrasena = false;
  error: string | null = null;
  idSolicitud = '';
  telefonoGuardado = '';
  tokenValido = true;
  otp: string | null = null;

  constructor(
    private fb:     FormBuilder,
    private route:  ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group(
      {
        nuevoPassword:  ['', [Validators.required, Validators.minLength(6)]],
        repetirPassword: ['', Validators.required],
      },
      { validators: this.matchPasswords }
    );
  }

  ngOnInit() {
    const params             = this.route.snapshot.queryParams;
    this.idSolicitud         = params['idSolicitud'] ?? '';
    this.telefonoGuardado    = params['telefono']    ?? '';
    this.otp                 = params['otp']         ?? '';
    this.tokenValido         = !!(this.idSolicitud && this.telefonoGuardado && this.otp);

    if (this.tokenValido) {
      this.modalCambioContrasena = true;
    }

    this.cdr.detectChanges();
  }  
  private matchPasswords(group: FormGroup) {
    const pass = group.get('nuevoPassword')?.value;
    const confirm = group.get('repetirPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  resetearPassword() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error   = null;

    if(this.matchPasswords(this.form)) {
      this.loading = false;
      this.alertService.error('Las contraseñas no coinciden.');
      return;
    }
    
    this.apiService.resetearPassword(
      this.idSolicitud,
      this.telefonoGuardado, 
      this.otp ?? '', 
      this.form.value.nuevoPassword).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.exitoso = true;
        this.alertService.success('Contraseña cambiada exitosamente. Ingrese nuevamente');        
        this.modalCambioContrasena = false;
        this.router.navigate(['/login']);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        const msg = extractErrorMessage(err);
        this.alertService.error(`Error al resetear contraseña. ${msg}`);   
        this.router.navigate(['/forgot-password']);  
        this.cdr.detectChanges(); 
      },
    }); 
  }


}
