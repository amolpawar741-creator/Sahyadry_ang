import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { Agent, Paged, STAGES, label } from '../core/models';

@Component({
  selector: 'app-customers', standalone: true, imports: [FormsModule, RouterLink, DatePipe],
  template: `
  <div style="display:flex;justify-content:space-between;align-items:center"><h1>Customers</h1>
    <a class="btn" routerLink="/customers/new">Add customer</a></div>
  <div class="card">
    <div class="row">
      <div><label>Search</label><input [(ngModel)]="search" (keyup.enter)="load(1)" placeholder="Name, company, mobile, ID, agent"></div>
      <div><label>Stage</label><select [(ngModel)]="stage" (change)="load(1)"><option value="">All</option>
        @for (s of stages; track s) { <option [value]="s">{{ label(s) }}</option> }</select></div>
      <div><label>Agent</label><select [(ngModel)]="agentId" (change)="load(1)"><option value="">All</option>
        @for (a of agents(); track a.id) { <option [value]="a.id">{{ a.name }}</option> }</select></div>
      <button class="btn" (click)="load(1)">Search</button>
      <button class="btn ghost" (click)="export()">Export Excel</button>
    </div>
    <div class="scroll"><table>
      <thead><tr><th>ID</th><th>Company</th><th>Contact</th><th>Mobile</th><th>Agent</th><th>Stage</th><th>Next follow-up</th><th></th></tr></thead>
      <tbody>
      @for (c of data()?.items; track c.id) {
        <tr><td>{{ c.customerCode }}</td><td>{{ c.companyName }}</td><td>{{ c.contactPerson }}</td><td>{{ c.mobile }}</td>
          <td>{{ c.agentName ?? '—' }}</td>
          <td><span class="tag" [class.red]="c.isLost">{{ c.isLost ? 'Lost' : label(c.stage) }}</span></td>
          <td>{{ c.nextFollowUpDate ? (c.nextFollowUpDate | date:'dd MMM yyyy') : '—' }}</td>
          <td><a [routerLink]="['/customers', c.id]">Open</a></td></tr>
      } @empty { <tr><td colspan="8" class="muted">No customers match. Add a customer or clear the filters.</td></tr> }
      </tbody></table></div>
    @if (data(); as d) {
      <div class="row" style="margin-top:12px"><span class="muted">{{ d.total }} customers</span>
        <button class="btn ghost" [disabled]="d.page<=1" (click)="load(d.page-1)">Previous</button>
        <button class="btn ghost" [disabled]="d.page*d.pageSize>=d.total" (click)="load(d.page+1)">Next</button></div>
    }
  </div>`
})
export class CustomersComponent implements OnInit {
  private api = inject(Api);
  stages = STAGES; label = label;
  search = ''; stage = ''; agentId = '';
  data = signal<Paged<any> | null>(null); agents = signal<Agent[]>([]);
  ngOnInit() { this.api.get<Agent[]>('agents', { activeOnly: true }).subscribe(a => this.agents.set(a)); this.load(1); }
  q = () => ({ search: this.search, stage: this.stage, agentId: this.agentId });
  load(page: number) { this.api.get<Paged<any>>('customers', { ...this.q(), page }).subscribe(r => this.data.set(r)); }
  export() { this.api.download('customers/export', 'customers.xlsx', this.q()); }
}
