import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {

  form: FormGroup;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.maxLength(40)]],
      password: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  onSubmit() {
    this.error = null;

    if (this.form.invalid) return;

    const { username, password } = this.form.value;

    try {
      this.authService.login(username.trim(), password)
        .subscribe({
          next: (res: any) => {
            this.authService.saveToken(res.token); // fake o real
            this.router.navigate(['/']);
          },
          error: (err) => {
            this.error = err?.error?.message || 'Error';
          }
        });

    } catch (err: any) {
      this.error = err.message || 'Error';
    }
  }
}
