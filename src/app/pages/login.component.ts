import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../core/auth.service';

@Component({
  selector: 'app-login', standalone: true, imports: [ReactiveFormsModule],
  template: `
  <div class="wrap"><form class="card box" [formGroup]="f" (ngSubmit)="go()">
    <h1>SHAYDRE CRM</h1><p class="muted">Admin sign in</p>
    <label for="u">Username</label><input id="u" formControlName="username" autocomplete="username">
    <label for="p" style="margin-top:10px">Password</label><input id="p" type="password" formControlName="password" autocomplete="current-password">
    @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
    <button class="btn" style="margin-top:14px;width:100%" [disabled]="f.invalid || busy()">Sign in</button>
  </form></div>`,
  styles: [`.wrap{min-height:100vh;display:grid;place-items:center}.box{width:340px}`]
})
export class LoginComponent {
  private fb = inject(FormBuilder); private auth = inject(Auth); private router = inject(Router);
  f = this.fb.nonNullable.group({ username: ['', Validators.required], password: ['', Validators.required] });
  error = signal(''); busy = signal(false);
  go() {
    this.busy.set(true); this.error.set('');
    const { username, password } = this.f.getRawValue();
    this.auth.login(username, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: e => { this.error.set(e.error?.message ?? 'Could not sign in. Check the API is running.'); this.busy.set(false); }
    });
  }
}
