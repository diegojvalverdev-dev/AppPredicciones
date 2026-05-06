import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading   = false;
  exitoso   = false;
  token     = '';
  tokenValido = true;
  error: string | null = null;
  mostrarPass    = false;
  mostrarConfirm = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group(
      {
        password:  ['', [Validators.required, Validators.minLength(6)]],
        confirmar: ['', Validators.required],
      },
      { validators: this.matchPasswords }
    );
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) this.tokenValido = false;
  }

  matchPasswords(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmar')?.value
      ? null
      : { noCoinciden: true };
  }

  onSubmit() {
    if (this.form.invalid || !this.token) return;
    this.loading = true;
    this.error   = null;
    // authService.resetPassword(this.token, this.form.value.password).subscribe(...)
    setTimeout(() => {
      this.loading = false;
      this.exitoso = true;
      setTimeout(() => this.router.navigate(['/login']), 2500);
    }, 800);
  }
}
