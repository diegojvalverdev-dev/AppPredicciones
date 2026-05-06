import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type AlertType = 'success' | 'error';
export interface AlertData { type: AlertType; message: string; }

@Injectable({ providedIn: 'root' })
export class AlertService {
  // Subject simple — cualquier suscriptor lo recibe
  private _subject = new Subject<AlertData | null>();
  readonly alert$ = this._subject.asObservable();

  success(msg: string) { this._subject.next({ type: 'success', message: msg }); }
  error(msg: string)   { this._subject.next({ type: 'error',   message: msg }); }
  dismiss()            { this._subject.next(null); }
}
