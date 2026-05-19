import { Injectable } from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable }  from 'rxjs';

// Prefijo /backend → proxy reenvía a https://192.168.111.23/pronosticos/*
const EP = {
  // ── Usuarios ─────────────────────────────────────────────────
  USUARIOS_CREAR:          '/backend/app/usuarios/',

  // ── Grupos ───────────────────────────────────────────────────
  GRUPOS_USUARIO:          '/backend/app/grupos/usuario',
  GRUPOS_DETALLE:          (id: number) => `/backend/app/grupos/${id}`,
  GRUPOS_CREAR:            '/backend/app/grupos/crear',
  GRUPOS_TELEFONO:         '/backend/app/grupos/telefono',
  GRUPOS_PARAMETROS:       (id: number) => `/backend/app/grupos/${id}/parametros`,

  // ── Partidos ─────────────────────────────────────────────────
  PARTIDOS_GRUPOS_EQUIPOS: (grupoId: number) => `/backend/app/partidos/grupo-usuario/${grupoId}/grupos-equipos`,

  // ── Eventos ──────────────────────────────────────────────────
  EVENTOS_DISPONIBLES:     '/backend/app/eventos/disponibles',

  // ── Pronósticos ──────────────────────────────────────────────
  PRONOSTICOS_CREAR:       '/backend/app/pronosticos/crear',
  PRONOSTICOS_MODIFICAR:   '/backend/app/pronosticos/modificar',
  PRONOSTICOS_GRUPO_AGRUP: (grupoId: number, agrupacion: string) => `/backend/app/pronosticos/usuario/grupo/${grupoId}/agrupacionEquipo/${encodeURIComponent(agrupacion)}`,
  HISTORIAL:               (grupoId: number) => `/backend/app/pronosticos/usuario/grupo/${grupoId}`,

  // ── Eventos ──────────────────────────────────────────────────
  FINALFOUR_CREAR:          '/backend/app/final4/crear',
  FINALFOUR_MODIFICAR:     '/backend/app/final4/actualizar',
  FINALFOUR:                (grupoId: number) => `/backend/app/final4/grupo/${grupoId}`,

  //ESTADISTICAS EXCEL
  ADMIN_GRUPO:      (grupoId: number) => `/backend/app/grupos/grupo/${grupoId}`,
};

// ── Interfaces ────────────────────────────────────────────────

export interface GrupoUsuario {
  gru_id:                 number;
  gru_idEvento:           number;
  gru_nombre:             string;
  gru_idUsuario_Admin:    number;
  gru_token_invitacion:   string;
  gru_hora_creacion:      string;
  gru_hora_actualizacion: string | null;
  gusr_alias:             string;
}

export interface GrupoDetalle {
  gru_id:                 number;
  gru_idEvento:           number;
  gru_nombre:             string;
  gru_idUsuario_Admin:    number;
  gru_token_invitacion:   string;
  gru_hora_creacion:      string;
  gru_hora_actualizacion: string | null;
  Telefonos:  TelefonoGrupo[];
  Usuarios:   UsuarioGrupo[];
  Parametros: ParametroGrupo[];
}

export interface TelefonoGrupo {
  tel_idGrupo:             number;
  tel_numero_telefono:     string;
  tel_estado_solicitud:    string;
  tel_hora:                string;
}

export interface UsuarioGrupo {
  gusr_idGrupo:   number;
  gusr_idUsuario: number;
  gusr_alias:     string;
}

export interface ParametroGrupo {
  par_idGrupo:          number;
  par_clave_parametro:  string;
  par_valorNum:         number | null;
  par_valorStr:         string | null;
  par_valorDate:        string | null;
}

export interface GuardarParametrosRequest {
  IdGrupo:    number;
  Parametros: ParametroGrupo[];
}

export interface CrearGrupoRequest {
  IdGrupo:   null;
  IdEvento:  number;
  Nombre:    string;
  Alias:     string;
  Telefonos: string[];
}

export interface AgregarTelefonoRequest {
  GrupoId:  number;
  Telefono: string;
}

export interface CrearPronosticoRequest {
  UsuarioId:       number;
  GrupoId:         number;
  PartidoId:       number;
  Fase:            number;
  GolesLocal:      number;
  GolesVisita:     number;
  EquipoClasifica: string | null;
}

export interface ModificarPronosticoRequest extends CrearPronosticoRequest {}

export interface CrearUsuarioRequest {
  Login:    string;
  Nombre:   string;
  Telefono: string;
  Password: string;
}

export interface CrearFinalFourRequest {
  IdGrupo:       number;
  IdEvento:      number
  Campeon:       string;
  Subcampeon:    string;
  Tercero:       string;
  Cuarto:        string;
  goleador:      string;
  cantGoles:     number | null;
  mvpEvento:     string | null;
  horaCreacion:  string | null;
}

export interface Final4Response {
  IdGrupo:       number;
  IdEvento:      number
  Campeon:       string;
  Subcampeon:    string;
  Tercero:       string;
  Cuarto:        string;
  goleador:      string;
  cantGoles:     number | null;
  mvpEvento:     string | null;
  horaCreacion:  string | null;
  [key: string]: any; // por si el servidor devuelve campos adicionales
}

export interface ModificarFinalFourRequest extends CrearFinalFourRequest {}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // ── Usuarios ─────────────────────────────────────────────────
  crearUsuario(data: CrearUsuarioRequest): Observable<any> {
    return this.http.post(EP.USUARIOS_CREAR, data);
  }

  // ── Grupos ───────────────────────────────────────────────────
  /** GET /app/grupos/usuario — lista grupos del usuario autenticado */
  getGruposUsuario(): Observable<GrupoUsuario[]> {
    return this.http.get<GrupoUsuario[]>(EP.GRUPOS_USUARIO);
  }

  /** GET /app/grupos/:id — detalle de un grupo (teléfonos, usuarios, parámetros) */
  getGrupoDetalle(id: number): Observable<GrupoDetalle> {
    return this.http.get<GrupoDetalle>(EP.GRUPOS_DETALLE(id));
  }

  /** POST /app/grupos/crear */
  crearGrupo(data: CrearGrupoRequest): Observable<any> {
    return this.http.post(EP.GRUPOS_CREAR, data);
  }

  /** POST /app/grupos/telefono */
  agregarTelefono(data: AgregarTelefonoRequest): Observable<any> {
    return this.http.post(EP.GRUPOS_TELEFONO, data);
  }

  /** DELETE /app/grupos/telefono */
  eliminarTelefono(data: AgregarTelefonoRequest): Observable<any> {
    return this.http.delete(EP.GRUPOS_TELEFONO, { body: data });
  }

  /** POST /app/grupos/:id/parametros — guarda parámetros del grupo */
  guardarParametros(id: number, data: GuardarParametrosRequest): Observable<any> {
    return this.http.post(EP.GRUPOS_PARAMETROS(id), data);
  }

  // ── Partidos ─────────────────────────────────────────────────
  /** GET /app/partidos/grupo-usuario/:grupoId/grupos-equiposs — grupos de partidos */
  getGruposEquipos(grupoId: number): Observable<any> {
    return this.http.get(EP.PARTIDOS_GRUPOS_EQUIPOS(grupoId));
  }

  // ── Eventos ──────────────────────────────────────────────────
  /** GET /app/eventos/disponibles */
  getEventosDisponibles(): Observable<any> {
    return this.http.get(EP.EVENTOS_DISPONIBLES);
  }

  /**
   * GET /app/eventos/:idEvento/fases
   * Lista de fases de un evento.
   */
  getFasesPorEvento(idEvento: number): Observable<any> {
    return this.http.get(`/backend/app/eventos/${idEvento}/fases`);
  }

  /**
   * GET /app/puntajes/grupo/:grupoId/evento/:eventoId/fase/:fase
   * Ranking de posiciones por grupo, evento y fase.
   */
  getPosiciones(grupoId: number, eventoId: number, fase: number): Observable<any> {
    return this.http.get(`/backend/app/puntajes/grupo/${grupoId}/evento/${eventoId}/fase/${fase}`);
  }

  getPosicionesFinal4(grupoId: number): Observable<any> {
    return this.http.get(`/backend/app/puntajes/grupo/${grupoId}/ranking-final4`);
  }

  /**
   * GET /app/partidos/evento/:id/rango?idEvento=&fechaInicio=&fechaFin=
   * Lista partidos de un evento en un rango de fechas.
   */
  getPartidosPorRango(idEvento: number, fechaInicio: string, fechaFin: string): Observable<any> {
    const url = `/backend/app/partidos/evento/${idEvento}/rango` +
      `?idEvento=${idEvento}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    return this.http.get(url);
  }

  // ── Pronósticos ──────────────────────────────────────────────
  crearPronostico(data: CrearPronosticoRequest): Observable<any> {
    return this.http.post(EP.PRONOSTICOS_CREAR, data);
  }

  modificarPronostico(data: ModificarPronosticoRequest): Observable<any> {
    return this.http.put(EP.PRONOSTICOS_MODIFICAR, data);
  }

  /**
   * GET /app/pronosticos/usuario/grupo/:grupoId/agrupacionEquipo/:agrupacion
   */
  getPronosticosPorAgrupacion(grupoId: number, agrupacion: string): Observable<any> {
    return this.http.get(EP.PRONOSTICOS_GRUPO_AGRUP(grupoId, agrupacion));
  }

  /**
   * GET /app/pronosticos/usuario/grupo/:grupoId/fechaInicio/:fi/fechaFin/:ff
   * Pronósticos del usuario para un grupo en un rango de fechas.
   */
  getPronosticosPorFechas(grupoId: number, fechaInicio: string, fechaFin: string): Observable<any> {
    const url = `/backend/app/pronosticos/usuario/grupo/${grupoId}/fechaInicio/${fechaInicio}/fechaFin/${fechaFin}`;
    return this.http.get(url);
  }

  getHistorial(grupoId: number): Observable<any> {
    return this.http.get(EP.HISTORIAL(grupoId));
  }

  /**
   * DELETE /app/grupos/:id
   * Elimina un grupo por su id.
   */
  eliminarGrupo(id: number): Observable<any> {
    return this.http.delete(`/backend/app/grupos/eliminar/${id}`);
  }

  // ── FINAL 4 ──────────────────────────────────────────────
  crearFinalFour(data: CrearFinalFourRequest): Observable<any> {
    return this.http.post(EP.FINALFOUR_CREAR, data);
  }

  getFinalFour(grupoId: number): Observable<Final4Response | null> {
    return this.http.get<Final4Response>(`/backend/app/final4/grupo/${grupoId}`);
  }

  modificarFinalFour(data: ModificarFinalFourRequest): Observable<any> {
    return this.http.put(EP.FINALFOUR_MODIFICAR, data);
  }

  // ── CARGANDO JUGADORES ──────────────────────────────────────────────  
  getJugadoresPorGrupo(eventoId: number): Observable<any> {
    return this.http.get(`/backend/api/admin/eventos-jugadores/evento/${eventoId}`);
  }

  // ── ENVIO DE OTP EN PASSWORD ──────────────────────────────────────────────
  solicitarOTP(login: string, telefono: string): Observable<any> {
    const params = {
      Login:    login,
      Telefono: `593${telefono}`,
    }
    return this.http.post('/backend/app/reset-password/crear', params);
  }

  consultarEstadoOTP(idSolicitud: string, telefono: string, otp: string): Observable<any> {
    return this.http.get(
      `/backend/app/reset-password/solicitud/${idSolicitud}?telefono=593${telefono}&otp=${otp}`
    );
  }

  resetearPassword(idSolicitud: string, telefono: string, otp: string, nuevoPassword: string): Observable<any> {
    const params = {
      IdSolicitudReset:   idSolicitud,
      Telefono:           telefono,
      Otp:                otp,
      PasswordNuevo:      nuevoPassword,
    }
    return this.http.put('/backend/app/usuarios/reset-password', params);
  }

  exportarExcelPronosticos(idGrupo: string, fase: string): Observable<any> {
    return this.http.get(
      `/backend/app/reportes/pronosticos/excel?idGrupo=${idGrupo}&fase=${fase}`,
      { responseType: 'blob' },
    );
  }

  // ── CARGANDO ADMINISTRADOR ──────────────────────────────────────────────  
  getAdmingrupo(grupoId: number): Observable<any> {
    return this.http.get(EP.ADMIN_GRUPO(grupoId));
  }
  //{{base_url}}/app/grupos/grupo/8
}
