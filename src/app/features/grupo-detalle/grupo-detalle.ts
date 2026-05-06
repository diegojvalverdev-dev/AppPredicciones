import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NavbarComponent }   from '../../shared/components/nav/bottom-nav';
import { ApiService, GrupoDetalle, TelefonoGrupo, ParametroGrupo } from '../../core/services/api.service';
import { AuthService }       from '../../core/services/auth';
import { extractErrorMessage } from '../../core/utils/error.utils';

interface AlertData { type: 'success' | 'error'; message: string; }

@Component({
  selector: 'app-grupo-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './grupo-detalle.html',
})
export class GrupoDetalleComponent implements OnInit {
  tabActivo: 'miembros' | 'reglas' = 'miembros';
  grupoId = 0;
  cargando = false;

  // Datos del grupo desde la API
  grupo: GrupoDetalle | null = null;
  telefonos: TelefonoGrupo[] = [];
  parametros: ParametroGrupo[] = [];
  usuarioAdmin: any = null;

  nuevoTelefono = '';
  nuevoAlias    = '';
  cargandoTel   = false;
  errorTelefono = '';

  // Toggles para reglas adicionales (basado en parámetros)
  soloMinutos90   = true;
  habilitarFinal4 = true;
  guardandoReglas = false;

  // Alert inline
  alertData: AlertData | null = null;
  private alertTimer: any;

  constructor(
    private route:       ActivatedRoute,
    private apiService:  ApiService,
    private authService: AuthService,
    private cdr:         ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.grupoId = Number(this.route.snapshot.paramMap.get('id')) || 0;
    if (this.grupoId) this.cargarGrupo();
  }

  cargarGrupo() {
    this.cargando = true;
    this.apiService.getGrupoDetalle(this.grupoId).subscribe({
      next: (res) => {
        this.grupo     = res;
        this.telefonos = res.Telefonos  ?? [];
        this.parametros = res.Parametros ?? [];
        this.usuarioAdmin = (res.Usuarios ?? []).find(
          (u: any) => u.gusr_idUsuario === res.gru_idUsuario_Admin
        ) ?? (res.Usuarios ?? [])[0] ?? null;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.showAlert('error', `Error al cargar el grupo. ${extractErrorMessage(err)}`);
      },
    });
  }

  get nombreGrupo()  { return this.grupo?.gru_nombre  ?? 'Cargando...'; }
  get torneoLabel()  { return 'COPA DEMO 2026'; }
  get esOwner(): boolean {
    const uid = this.authService.getUsuario()?.['id'];
    return this.grupo?.gru_idUsuario_Admin === uid;
  }
  get aliasAdmin()   { return this.usuarioAdmin?.gusr_alias ?? '—'; }

  // ── Agregar teléfono ─────────────────────────────────────────
  agregarMiembro() {
    this.errorTelefono = '';
    if (!this.nuevoTelefono.trim()) { this.errorTelefono = 'Ingresa el número.'; return; }
    if (!/^\d{9}$/.test(this.nuevoTelefono.trim())) {
      this.errorTelefono = 'Debe tener 9 dígitos (ej: 991234567).'; return;
    }
    this.cargandoTel = true;
    this.cdr.detectChanges();

    this.apiService.agregarTelefono({
      GrupoId:  this.grupoId,
      Telefono: `593${this.nuevoTelefono.trim()}`,
    }).subscribe({
      next: () => {
        this.cargandoTel = false;
        // Agregar a lista local
        this.telefonos.push({
          tel_idGrupo:          this.grupoId,
          tel_numero_telefono:  `593${this.nuevoTelefono.trim()}`,
          tel_estado_solicitud: 'P',
          tel_hora:             new Date().toISOString(),
        });
        this.nuevoTelefono = '';
        this.nuevoAlias    = '';
        this.showAlert('success', 'Miembro agregado exitosamente.');
      },
      error: (err) => {
        this.cargandoTel = false;
        const msg = extractErrorMessage(err);
        this.showAlert('error', err?.status === 400 ? msg : `Error al agregar. ${msg}`);
      },
    });
  }

  // ── Eliminar teléfono ────────────────────────────────────────
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
        this.showAlert('success', 'Miembro eliminado.');
      },
      error: (err) => {
        const msg = extractErrorMessage(err);
        this.showAlert('error', err?.status === 400 ? msg : `Error al eliminar. ${msg}`);
      },
    });
  }

  // ── Guardar parámetros ───────────────────────────────────────
  guardarReglas() {
    this.guardandoReglas = true;
    this.apiService.guardarParametros(this.grupoId, {
      IdGrupo:    this.grupoId,
      Parametros: this.parametros,
    }).subscribe({
      next: () => {
        this.guardandoReglas = false;
        this.showAlert('success', 'Reglas guardadas correctamente.');
      },
      error: (err) => {
        this.guardandoReglas = false;
        this.showAlert('error', `Error al guardar reglas. ${extractErrorMessage(err)}`);
      },
    });
  }

  // ── Mapping de claves → etiquetas visibles ──────────────────
  readonly puntajesClave = [
    { clave: 'PUNTOS_MARCADOR',           label: 'Acertar marcador exacto'                  },
    { clave: 'PUNTOS_RESULTADO',          label: 'Acertar resultado del partido'             },
    { clave: 'PUNTOS_EQUIPO_CLASIFICADO', label: 'Acertar equipo clasificado (eliminatorias)'},
    { clave: 'PUNTOS_GOLEADOR',           label: 'Acertar al goleador del torneo'            },
    { clave: 'PUNTOS_MVP_TORNEO',         label: 'Acertar al MVP del torneo'                 },
    { clave: 'PUNTOS_GOLES_GOLEADOR',     label: 'Acertar cantidad de goles del goleador'    },
    { clave: 'PUNTOS_LUGAR1',             label: 'Acertar al CAMPEÓN'                        },
    { clave: 'PUNTOS_LUGAR2',             label: 'Acertar al subcampeón'                     },
    { clave: 'PUNTOS_LUGAR3',             label: 'Acertar al 3er puesto'                     },
    { clave: 'PUNTOS_LUGAR4',             label: 'Acertar al 4to puesto'                     },
  ];

  // ── Helpers de parámetros ────────────────────────────────────
  getParam(clave: string): ParametroGrupo | undefined {
    return this.parametros.find(p => p.par_clave_parametro === clave);
  }

  /** Incrementa/decrementa par_valorNum entre 1 y 10 */
  stepParam(p: ParametroGrupo, delta: number) {
    p.par_valorNum = Math.max(1, Math.min(10, (p.par_valorNum ?? 0) + delta));
  }

  /** Cambia par_valorStr entre '1' y '0' para toggles */
  toggleParam(p: ParametroGrupo, checked: boolean) {
    p.par_valorStr = checked ? '1' : '0';
  }

  setParamDate(clave: string, value: string) {
    const p = this.getParam(clave);
    if (p) p.par_valorDate = value ? `${value}T00:00:00` : null;
  }

  getParamDate(clave: string): string {
    const v = this.getParam(clave)?.par_valorDate;
    if (!v) return '';
    try { return v.substring(0, 10); } catch { return ''; }
  }

  // ── Alert local ──────────────────────────────────────────────
  showAlert(type: 'success' | 'error', message: string) {
    clearTimeout(this.alertTimer);
    this.alertData = { type, message };
    this.cdr.detectChanges();
    this.alertTimer = setTimeout(() => {
      this.alertData = null;
      this.cdr.detectChanges();
    }, 5000);
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = { P: 'Pendiente', A: 'Aceptado', R: 'Rechazado' };
    return map[estado] ?? estado;
  }

  // Número sin prefijo 593 para mostrar
  numSinPrefijo(tel: string): string {
    return tel.startsWith('593') ? tel.substring(3) : tel;
  }
}
