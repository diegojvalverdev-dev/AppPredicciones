import { Injectable } from '@angular/core';

export type AlertType = 'success' | 'error';
export interface AlertData { type: AlertType; message: string; }

@Injectable({ providedIn: 'root' })
export class AlertService {
  // Callback que el root component registra
  private _onAlert?: (data: AlertData | null) => void;

  register(cb: (data: AlertData | null) => void) {
    this._onAlert = cb;
  }

  private timer: any;

  show(type: AlertType, message: string, ms = 5000) {
    clearTimeout(this.timer);
    this._onAlert?.({ type, message });
    this.timer = setTimeout(() => this._onAlert?.(null), ms);
  }

  success(msg: string) { this.show('success', msg); }
  error(msg: string)   { this.show('error',   msg); }
  dismiss()            { clearTimeout(this.timer); this._onAlert?.(null); }
}
