import { Routes } from '@angular/router';

import { LoginComponent }          from './features/auth/login/login';
import { RegistroComponent }       from './features/registro/registro';
import { ForgotPasswordComponent } from './features/forgot-password/forgot-password';
import { ResetPasswordComponent }  from './features/reset-password/reset-password';
import { InicioComponent }         from './features/inicio/inicio';
import { PronosticarComponent }    from './features/pronosticar/pronosticar';
import { Final4Component }         from './features/final4/final4';
import { PartidosComponent }       from './features/partidos/partidos';
import { PosicionesComponent }     from './features/posiciones/posiciones';
import { HistorialComponent }      from './features/historial/historial';
import { GruposComponent }         from './features/grupos/grupos';
import { GrupoDetalleComponent }   from './features/grupo-detalle/grupo-detalle';
import { AdminComponent }          from './features/admin/admin';
import { authGuard }               from './core/guards/auth.guard';

const PUBLIC: Routes = [
  { path: 'login',           component: LoginComponent          },
  { path: 'registro',        component: RegistroComponent       },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password',  component: ResetPasswordComponent  },
];

const PRIVATE: Routes = [
  { path: 'inicio',      component: InicioComponent,       canActivate: [authGuard] },
  { path: 'pronosticar', component: PronosticarComponent,  canActivate: [authGuard] },
  { path: 'final4',      component: Final4Component,       canActivate: [authGuard] },
  { path: 'partidos',    component: PartidosComponent,     canActivate: [authGuard] },
  { path: 'posiciones',  component: PosicionesComponent,   canActivate: [authGuard] },
  { path: 'historial',   component: HistorialComponent,    canActivate: [authGuard] },
  { path: 'grupos',      component: GruposComponent,       canActivate: [authGuard] },
  { path: 'grupo/:id',   component: GrupoDetalleComponent, canActivate: [authGuard] },
  { path: 'admin',       component: AdminComponent,        canActivate: [authGuard] },
];

export const routes: Routes = [
  ...PUBLIC,
  ...PRIVATE,
  { path: '',   redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login'                    },
];
