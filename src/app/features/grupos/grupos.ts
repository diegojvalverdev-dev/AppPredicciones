import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { NavbarComponent }     from '../../shared/components/nav/bottom-nav';
import { AlertService }        from '../../shared/services/alert.service';
import { ApiService }          from '../../core/services/api.service';
import { Router }  from '@angular/router';
import { extractErrorMessage } from '../../core/utils/error.utils';
import { Usuario }         from '../../core/models/usuario.model';
import { AuthService }     from '../../core/services/auth';

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './grupos.html',
})
export class GruposComponent implements OnInit {
  form: FormGroup;
  loading          = false;
  cargandoEventos  = false;
  eventos: any[]   = [];
  modalOtp = false;
  otp: string | null = null;
  nombreGrupo = '';
  usuario: Usuario | null = null;  
  telefonoUser = '';
  telefonoNuevo = '';

  constructor(
    private fb:           FormBuilder,
    private authService: AuthService,
    private apiService:   ApiService,
    private alertService: AlertService,
    private cdr:          ChangeDetectorRef,
    private router:       Router,
  ) {
    this.form = this.fb.group({
      nombre:    ['', Validators.required],
      alias:     [''],
      idEvento:  [null, Validators.required],
      telefonos: this.fb.array([this.nuevoTel()]),
    });
  }

  ngOnInit() {
    this.cargandoEventos = true;
    this.apiService.getEventosDisponibles().subscribe({
      next: (res: any) => {
        this.eventos = Array.isArray(res) ? res : (res?.data ?? res?.Data ?? []);
        if (this.eventos.length) {
          this.form.patchValue({ idEvento: this.getIdEvento(this.eventos[0]) });
        }        
        this.cargandoEventos = false;
        this.usuario = this.authService.getUsuario();
        this.TraerTelefonoUser(this.usuario?.['id'] ?? 0);
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoEventos = false;
        this.cdr.detectChanges();
      },
    });
  }

  TraerTelefonoUser(idUsuario: number) {
    this.apiService.getTraerTelefono(idUsuario).subscribe({
      next: (res: any) => {
        this.telefonoUser = res?.Telefono ?? '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });
  }

  // Helpers para acceder a campos del evento sin importar el nombre exacto
  getIdEvento(e: any): number {
    return e?.eve_id ?? e?.id ?? 0;
  }

  getNombreEvento(e: any): string {
    return e?.eve_descripcion ?? e?.eve_description ?? 'Evento';
  }

  get telefonos() { return this.form.get('telefonos') as FormArray; }
  nuevoTel()      { return this.fb.group({ numero: ['', Validators.pattern(/^\d{9}$/)] }); }
  agregar()       { 
    // Obtener el último campo de teléfono ingresado
    const ultimoIndex  = this.telefonos.length - 1;
    const ultimoNumero = this.telefonos.at(ultimoIndex).get('numero')?.value ?? '';

    // Validar que no sea el teléfono del admin (con o sin prefijo 593)
    const telConPrefijo    = `593${ultimoNumero}`;
    const telUserSinPrefijo = this.telefonoUser.startsWith('593')
      ? this.telefonoUser.substring(3)
      : this.telefonoUser;

    if (ultimoNumero === telUserSinPrefijo || telConPrefijo === this.telefonoUser) {
      this.alertService.error('El número del Administrador no puede ser agregado.');
      // Limpiar el campo
      this.telefonos.at(ultimoIndex).get('numero')?.setValue('');
      return;
    }

    // Validar que no esté duplicado en la lista
    const yaExiste = this.telefonos.controls.some((ctrl, i) =>
      i !== ultimoIndex && ctrl.get('numero')?.value === ultimoNumero && ultimoNumero !== ''
    );

    if (yaExiste) {
      this.alertService.error('Este número ya fue agregado a la lista.');
      this.telefonos.at(ultimoIndex).get('numero')?.setValue('');
      return;
    }
    this.telefonos.push(this.nuevoTel()); 
  }
  quitar(i: number) { if (this.telefonos.length > 1) this.telefonos.removeAt(i); }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;

    const { nombre, alias, idEvento, telefonos } = this.form.value;
    const telList: string[] = telefonos
      .filter((t: any) => t.numero && /^\d{9}$/.test(t.numero))
      .map((t: any) => `593${t.numero}`);

    this.nombreGrupo = nombre.trim();

    this.apiService.crearGrupo({
      IdGrupo:   null,
      IdEvento:  Number(idEvento),
      Nombre:    nombre.trim(),
      Alias:     alias?.trim() || '',
      Telefonos: telList,
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.otp = res?.tokenGrupo || null;
        //this.alertService.success('Grupo creado exitosamente.');
        this.modalOtp = true;
        this.cdr.detectChanges(); 
        //setTimeout(() => this.router.navigate(['/inicio']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.alertService.error(`Error al crear el grupo. ${extractErrorMessage(err)}`);
      },
    });
  }

  llevarInicio() {
    this.modalOtp = false;
    this.router.navigate(['/inicio']);
  }
}
