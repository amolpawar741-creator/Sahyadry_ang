import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../core/auth.service';

@Component({
  selector: 'app-shell', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <div class="shell">
    <nav>
      <div class="brand">SHAYDRE CRM</div>
      @for (l of links; track l.to) { <a [routerLink]="l.to" routerLinkActive="on">{{ l.text }}</a> }
      <div class="spacer"></div>
      <div class="who">{{ auth.name() }}</div>
      <button (click)="auth.logout()">Sign out</button>
    </nav>
    <main><router-outlet /></main>
  </div>`,
  styles: [`
  .shell{display:grid;grid-template-columns:220px 1fr;min-height:100vh}
  nav{background:var(--navy);color:#fff;display:flex;flex-direction:column;padding:16px 10px;gap:2px;position:sticky;top:0;height:100vh}
  .brand{font-weight:700;font-size:18px;padding:6px 10px 18px}
  nav a{color:#c9d6f2;text-decoration:none;padding:9px 12px;border-radius:6px}
  nav a.on,nav a:hover{background:rgba(255,255,255,.12);color:#fff}
  .spacer{flex:1}.who{padding:6px 12px;color:#9fb3e0;font-size:12px}
  nav button{background:transparent;border:1px solid #4a6299;color:#fff;border-radius:6px;padding:7px;cursor:pointer}
  main{padding:24px;min-width:0}
  @media(max-width:800px){.shell{grid-template-columns:1fr}nav{flex-direction:row;flex-wrap:wrap;height:auto;position:static;padding:8px}.brand{padding:6px}.spacer{display:none}}
  `]
})
export class ShellComponent {
  auth = inject(Auth);
  links = [
    { to: '/dashboard', text: 'Dashboard' }, { to: '/customers', text: 'Customers' }, { to: '/followups', text: 'Follow-ups' },
    { to: '/agents', text: 'Agents' }, { to: '/plots', text: 'MIDC & Plots' }, { to: '/quotations', text: 'Quotations' }];
}
