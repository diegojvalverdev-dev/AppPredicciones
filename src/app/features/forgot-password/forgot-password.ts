import { Component, OnInit, ChangeDetectorRef, OnDestroy  }           from '@angular/core';
import { CommonModule }        from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink }  from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AlertService }        from '../../shared/services/alert.service';
import { extractErrorMessage }  from '../../core/utils/error.utils';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordComponent implements OnDestroy {
  form: FormGroup;
  loading = false;
  enviado = false;
  error: string | null = null;
  otp: string | null = null; 
  caduca: string | null = null; 
  modalOtp = false;
  modalOtpRechazado = false;  
  telefonoChatbot = '+593 986 409 740'; 

  estadoOtp:   'pendiente' | 'aceptado' | 'rechazado' = 'pendiente';
  pollingTimer: any = null;
  loginGuardado    = '';
  telefonoGuardado = '';
  idSolicitud = '';

  estadoProceso = '';

  constructor(private fb: FormBuilder, private apiService: ApiService, private cdr: ChangeDetectorRef, 
    private alertService: AlertService, private router: Router) {
    this.form = this.fb.group({
      login:    ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9,15}$/)]],
    });
  }

  onSubmit() {
    
    if (this.form.invalid) return;
    this.loading = true;
    this.error   = null;
    const { login, telefono, nuevoPassword, repetirPassword } = this.form.value;
    
    this.apiService.solicitarOTP(login.trim(), telefono.trim()).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.otp = res?.otp ?? res?.Otp ?? res?.OTP ?? res?.token ?? null;
        this.caduca = res?.Caduca ?? res?.caduca ?? null;
        this.idSolicitud = res?.Id ?? null;
        this.loginGuardado    = this.form.value.login.trim();
        this.telefonoGuardado = this.form.value.telefono.trim();
        this.modalOtp = true;
        this.cdr.detectChanges();
        this.iniciarPolling();
      },
      error: (err: any) => {
        this.loading = false;
        const msg = extractErrorMessage(err);
        this.error = err?.status === 400 ? msg : `Error al enviar OTP. ${msg}`;
        this.cdr.detectChanges(); 
      },
    }); 
  }

  cerrarModal() {
    this.modalOtp = false;
    this.detenerPolling();
  }

  soloNumeros(event: Event) {
    const input = event.target as HTMLInputElement;
    // Elimina cualquier carácter que no sea número
    input.value = input.value.replace(/\D/g, '').substring(0, 9);
    // Actualiza el valor en el FormControl
    this.form.get('telefono')?.setValue(input.value, { emitEvent: false });
  }

  iniciarPolling() {
    this.estadoOtp = 'pendiente';
    const { login, telefono } = this.form.value;
    this.detenerPolling();

    this.pollingTimer = setInterval(() => {
      this.apiService.consultarEstadoOTP(
        this.idSolicitud,
        this.telefonoGuardado,
        this.otp ?? ''
      ).subscribe({
        next: (res: any) => {
          const estado = res?.estado ?? res?.Estado ?? res?.status ?? res?.Status ?? '';
          const caduca = res?.caduca ?? res?.Caduca ?? res?.expiry ?? res?.Expiry ?? '';

          const fechaCaducidad = new Date(caduca);
          const ahora          = new Date();
          this.estadoProceso = estado;

          if (ahora > fechaCaducidad) {
            this.estadoProceso = 'R';
          }

          switch (this.estadoProceso) {
            case 'A':
              this.estadoOtp = 'aceptado';
              this.cerrarModal();  
              this.router.navigate(['/reset-password'], {
                queryParams: {
                  idSolicitud: res?.Id       ?? '',
                  telefono:    res?.Telefono ?? '',
                  otp:         res?.Otp      ?? '',
                }
              });
              this.cdr.detectChanges();
            break;
            case 'R':
              this.estadoOtp = 'rechazado';
              this.modalOtpRechazado = true;
              this.limpiarCampos();
              this.cerrarModal();
              this.detenerPolling();
              this.cdr.detectChanges();
            break;
          }
        },
        error: () => {  },
      });
    }, 1500); // cada 1.5 segundos
  }

  detenerPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  ngOnDestroy() {
    this.detenerPolling();
  }

  limpiarCampos(){
    this.form.reset();
    this.error        = null;
    this.enviado      = false;
    this.modalOtp     = false;
    this.otp           = null;
    this.estadoOtp    = 'pendiente';
    this.loginGuardado    = '';
    this.telefonoGuardado = '';
  }
}
