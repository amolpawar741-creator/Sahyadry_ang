import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api } from '../core/api.service';
import { Agent } from '../core/models';

@Component({
  selector: 'app-agents', standalone: true, imports: [ReactiveFormsModule, CurrencyPipe],
  template: `
  <h1>Agents</h1>
  <form class="card" [formGroup]="f" (ngSubmit)="save()"><h2>{{ editId ? 'Edit agent' : 'Register agent' }}</h2>
    <div class="form">
      <div><label>Name</label><input formControlName="name"></div>
      <div><label>Mobile</label><input formControlName="mobile"></div>
      <div><label>Email</label><input formControlName="email"></div>
      <div><label>Assigned region</label><input formControlName="region"></div>
      <div><label>Commission / incentive</label><input formControlName="commissionTerms"></div>
      <div><label>Status</label><select formControlName="isActive"><option [ngValue]="true">Active</option><option [ngValue]="false">Inactive</option></select></div>
    </div><div class="row" style="margin-top:12px"><button class="btn" [disabled]="f.invalid">Save agent</button>
      @if (editId) { <button type="button" class="btn ghost" (click)="reset()">Cancel</button> }</div></form>
  <div class="card scroll"><h2>Agent comparison</h2>
    <table><thead><tr><th>ID</th><th>Name</th><th>Enquiries</th><th>Active</th><th>Deals</th><th>Calls</th><th>Meetings</th><th>Site visits</th><th>Revenue</th><th></th></tr></thead><tbody>
    @for (p of perf(); track p.agentId) {
      <tr><td>{{ p.agentCode }}</td><td>{{ p.name }}</td><td>{{ p.totalEnquiries }}</td><td>{{ p.activeCustomers }}</td><td>{{ p.completedDeals }}</td>
        <td>{{ p.calls }}</td><td>{{ p.meetings }}</td><td>{{ p.siteVisits }}</td><td>{{ p.revenue | currency:'INR':'symbol':'1.0-0' }}</td>
        <td><button class="btn ghost" style="padding:2px 8px" (click)="edit(p.agentId)">Edit</button></td></tr>
    } @empty { <tr><td colspan="10" class="muted">No agents registered yet.</td></tr> }</tbody></table></div>`
})
export class AgentsComponent implements OnInit {
  private api = inject(Api); private fb = inject(FormBuilder);
  perf = signal<any[]>([]); all = signal<Agent[]>([]); editId = 0;
  f = this.fb.nonNullable.group({ name: ['', Validators.required], mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    email: [''], region: [''], commissionTerms: [''], isActive: [true] });
  ngOnInit() { this.load(); }
  load() { this.api.get<any[]>('agents/performance').subscribe(p => this.perf.set(p)); this.api.get<Agent[]>('agents').subscribe(a => this.all.set(a)); }
  edit(id: number) { const a = this.all().find(x => x.id === id)!; this.editId = id; this.f.patchValue(a as any); scrollTo(0, 0); }
  reset() { this.editId = 0; this.f.reset({ isActive: true }); }
  save() {
    const body = this.f.getRawValue();
    (this.editId ? this.api.put(`agents/${this.editId}`, body) : this.api.post('agents', body)).subscribe(() => { this.reset(); this.load(); });
  }
}
