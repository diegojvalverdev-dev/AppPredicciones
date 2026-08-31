import { AlertData, AlertType } from '../services/alert.service';

export class WithAlert {
  alertData: AlertData | null = null;
  private _alertTimer: any;

  showAlert(type: AlertType, message: string, ms = 5000) {
    clearTimeout(this._alertTimer);
    this.alertData = { type, message };
    this._alertTimer = setTimeout(() => { this.alertData = null; }, ms);
  }

  successAlert(msg: string) { this.showAlert('success', msg); }
  errorAlert(msg: string)   { this.showAlert('error',   msg); }
  closeAlert()              { clearTimeout(this._alertTimer); this.alertData = null; }
}
