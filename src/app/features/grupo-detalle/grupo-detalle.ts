import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NavbarComponent }   from '../../shared/components/nav/bottom-nav';
import { AlertService }      from '../../shared/services/alert.service';
import { ApiService, GrupoDetalle, TelefonoGrupo, ParametroGrupo } from '../../core/services/api.service';
import { AuthService }       from '../../core/services/auth';
import { extractErrorMessage } from '../../core/utils/error.utils';
import { Usuario }         from '../../core/models/usuario.model';

@Component({
  selector: 'app-grupo-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './grupo-detalle.html',
})
export class GrupoDetalleComponent implements OnInit {
  tabActivo: 'miembros' | 'reglas' = 'miembros';
  grupoId  = 0;
  cargando = false;

  grupo: GrupoDetalle | null = null;
  telefonos:  TelefonoGrupo[]  = [];
  parametros: ParametroGrupo[] = [];
  usuarioAdmin: any = null;

  nuevoTelefono = '';
  nuevoAlias    = '';
  cargandoTel   = false;
  errorTelefono = '';
  guardandoReglas = false;

  usuario: Usuario | null = null;  
  telefonoUser = '';
  telefonoNuevo = '';

  readonly puntajesClave = [
    { clave: 'PUNTOS_MARCADOR',           label: 'Acertar marcador exacto'                   },
    { clave: 'PUNTOS_RESULTADO',          label: 'Acertar resultado del partido'              },
    { clave: 'PUNTOS_EQUIPO_CLASIFICADO', label: 'Acertar equipo clasificado (eliminatorias)' },
    { clave: 'PUNTOS_GOLEADOR',           label: 'Acertar al goleador del torneo'             },
    { clave: 'PUNTOS_MVP_TORNEO',         label: 'Acertar al MVP del torneo'                  },
    { clave: 'PUNTOS_GOLES_GOLEADOR',     label: 'Acertar cantidad de goles del goleador'     },
    { clave: 'PUNTOS_LUGAR1',             label: 'Acertar al CAMPEÓN'                         },
    { clave: 'PUNTOS_LUGAR2',             label: 'Acertar al subcampeón'                      },
    { clave: 'PUNTOS_LUGAR3',             label: 'Acertar al 3er puesto'                      },
    { clave: 'PUNTOS_LUGAR4',             label: 'Acertar al 4to puesto'                      },
    { clave: 'PUNTOS_ADICIONALES_TOP4',   label: 'Puntos adicionales Final 4'                   },
  ];

  constructor(
    private route:        ActivatedRoute,
    private apiService:   ApiService,
    private authService:  AuthService,
    private alertService: AlertService,
    private cdr:          ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.grupoId = Number(this.route.snapshot.paramMap.get('id')) || 0;
    if (this.grupoId) this.cargarGrupo();
  }

  cargarGrupo() {
    this.cargando = true;
    this.apiService.getGrupoDetalle(this.grupoId).subscribe({
      next: (res) => {
        this.grupo      = res;
        this.telefonos  = res.Telefonos  ?? [];
        this.parametros = res.Parametros ?? [];
        this.usuarioAdmin = (res.Usuarios ?? []).find(
          (u: any) => u.gusr_idUsuario === res.gru_idUsuario_Admin
        ) ?? (res.Usuarios ?? [])[0] ?? null;
        this.TraerTelefonoUser(res.gru_idUsuario_Admin);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.alertService.error(`Error al cargar el grupo. ${extractErrorMessage(err)}`);
        this.cdr.detectChanges();
      },
    });
  }

  get nombreGrupo()  { return this.grupo?.gru_nombre ?? 'Cargando...'; }
  get torneoLabel()  { return 'COPA DEMO 2026'; }
  get esOwner(): boolean {
    return this.grupo?.gru_idUsuario_Admin === this.authService.getUsuario()?.['id'];
  }
  get aliasAdmin() { return this.usuarioAdmin?.gusr_alias ?? '—'; }

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

  agregarMiembro() {
    this.errorTelefono = '';
    if (!this.nuevoTelefono.trim())          { this.errorTelefono = 'Ingresa el número.'; return; }
    if (!/^\d{9}$/.test(this.nuevoTelefono)) { this.errorTelefono = 'Debe tener 9 dígitos.'; return; }
    if (!this.grupoId)                       { this.alertService.error('No se identificó el grupo.'); return; }

    const ultimoNumero = '593'+this.nuevoTelefono.trim();

    if (ultimoNumero === this.telefonoUser) {
      this.alertService.error('El número del Administrador no puede ser agregado.');
      return;
    }

    // Validar que no esté duplicado en la lista
    const yaExiste = this.telefonos.some(
      t => t.tel_numero_telefono === ultimoNumero
    );

    if (yaExiste) {
      this.alertService.error('Este número ya fue agregado a la lista.');
      return;
    }

    this.cargandoTel = true;
    this.cdr.detectChanges();

    this.apiService.agregarTelefono({
      GrupoId:  this.grupoId,
      Telefono: `593${this.nuevoTelefono.trim()}`,
    }).subscribe({
      next: () => {
        this.cargandoTel = false;
        this.telefonos.push({
          tel_idGrupo:          this.grupoId,
          tel_numero_telefono:  `593${this.nuevoTelefono.trim()}`,
          tel_estado_solicitud: 'P',
          tel_hora:             new Date().toISOString(),
        });
        this.nuevoTelefono = '';
        this.nuevoAlias    = '';
        this.cdr.detectChanges();
        this.alertService.success('Miembro agregado exitosamente.');
      },
      error: (err) => {
        this.cargandoTel = false;
        this.cdr.detectChanges();
        const msg = extractErrorMessage(err);
        this.alertService.error(err?.status === 400 ? msg : `Error al agregar. ${msg}`);
      },
    });
  }

  eliminarTelefono(tel: TelefonoGrupo) {
    if (!confirm(`¿Eliminar ${tel.tel_numero_telefono}?`)) return;
    this.apiService.eliminarTelefono({
      GrupoId:  tel.tel_idGrupo,
      Telefono: tel.tel_numero_telefono,
    }).subscribe({
      next: () => {
        this.telefonos = this.telefonos.filter(
          t => t.tel_numero_telefono !== tel.tel_numero_telefono
        );
        this.cdr.detectChanges();
        this.alertService.success('Miembro eliminado correctamente.');
      },
      error: (err) => {
        const msg = extractErrorMessage(err);
        this.alertService.error(err?.status === 400 ? msg : `Error al eliminar. ${msg}`);
      },
    });
  }

  guardarReglas() {
    this.guardandoReglas = true;
    
    // Convertir 1/0 a SI/NO solo para los parámetros de toggle
  const PARAMS_TOGGLE = ['FINAL_4_HABILITADO', 'MARCADOR_90_MINUTOS'];

  const parametrosConvertidos = this.parametros.map(p => {
    if (PARAMS_TOGGLE.includes(p.par_clave_parametro)) {
      return {
        ...p,
        par_valorStr: p.par_valorStr === '1' || p.par_valorStr === 'SI' || p.par_valorStr === 'true'
          ? 'SI'
          : 'NO',
      };
    }
    return p;
  });

    this.apiService.guardarParametros(this.grupoId, {
      IdGrupo:    this.grupoId,
      Parametros: parametrosConvertidos, 
    }).subscribe({
      next: () => {
        this.guardandoReglas = false;
        this.alertService.success('Reglas guardadas correctamente.');
      },
      error: (err) => {
        this.guardandoReglas = false;
        this.alertService.error(`Error al guardar reglas. ${extractErrorMessage(err)}`);
      },
    });
  }

  getParam(clave: string): ParametroGrupo | undefined {
    return this.parametros.find(p => p.par_clave_parametro === clave);
  }

  /** Devuelve el valor numérico. Si el parámetro no vino del servidor, lo crea con valor 1. */
  getParamNum(clave: string): number {
    let p = this.getParam(clave);
    if (!p) {
      p = { par_idGrupo: this.grupoId, par_clave_parametro: clave,
            par_valorNum: 1, par_valorStr: null, par_valorDate: null };
      this.parametros.push(p);
    }
    return p.par_valorNum ?? 1;
  }

  /** Stepper por clave — garantiza que el parámetro existe antes de modificar */
  stepParamByClave(clave: string, delta: number) {
    this.getParamNum(clave); // crea si no existe
    const p = this.getParam(clave)!;
    p.par_valorNum = Math.max(1, Math.min(10, (p.par_valorNum ?? 1) + delta));
  }

  stepParam(p: ParametroGrupo, delta: number) {
    p.par_valorNum = Math.max(1, Math.min(10, (p.par_valorNum ?? 0) + delta));
  }

  toggleParam(p: ParametroGrupo, checked: boolean) {
    p.par_valorStr = checked ? '1' : '0';
  }

  setParamDate(clave: string, value: string) {
    const p = this.getParam(clave);
    if (p) p.par_valorDate = value ? `${value}T00:00:00` : null;
  }

  getParamDate(clave: string): string {
    const v = this.getParam(clave)?.par_valorDate;
    return v ? v.substring(0, 10) : '';
  }

  estadoLabel(estado: string): string {
    return ({ P:'Pendiente', A:'Aceptado', R:'Rechazado' } as any)[estado] ?? estado;
  }

  numSinPrefijo(tel: string): string {
    return tel.startsWith('593') ? tel.substring(3) : tel;
  }

  quitarEspacios(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\s/g, '').replace(/\D/g, '').substring(0, 9);
    this.nuevoTelefono = input.value;
  }

  onPasteTelefono(event: ClipboardEvent) {
    event.preventDefault(); // evitar que pegue el texto original
    const texto = event.clipboardData?.getData('text') ?? '';
    // Quitar espacios, guiones y todo lo que no sea número
    const limpio = texto.replace(/\D/g, '').substring(0, 9);
    this.nuevoTelefono = limpio;
  }

  copiarInvitacion() {
    const token   = this.grupo?.gru_token_invitacion ?? '';
    const nombre  = this.nombreGrupo;
    const texto   = `¡Te invito a unirte al grupo "${nombre}" en EclipGol! 🏆⚽\n\nTu token de invitación es: ${token}\n\n📲 Escríbele a nuestro bot de WhatsApp: +593 986409740`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(() => {
        this.alertService.success('¡Invitación copiada al portapapeles!');
      }).catch(() => {
        this.copiarFallback(texto);
      });
    } else {
      this.copiarFallback(texto);
    }
  }

  // Fallback para navegadores que no soportan clipboard API (Safari iOS)
  private copiarFallback(texto: string) {
    const el       = document.createElement('textarea');
    el.value       = texto;
    el.style.position = 'fixed';
    el.style.opacity  = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    try {
      document.execCommand('copy');
      this.alertService.success('¡Invitación copiada al portapapeles!');
    } catch {
      this.alertService.error('No se pudo copiar. Copia el token manualmente.');
    }
    document.body.removeChild(el);
  }
}
