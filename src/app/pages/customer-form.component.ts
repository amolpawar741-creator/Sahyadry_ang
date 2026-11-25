import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { Agent } from '../core/models';

@Component({
  selector: 'app-customer-form', standalone: true, imports: [ReactiveFormsModule, RouterLink],
  template: `
  <h1>{{ id ? 'Edit customer' : 'New customer' }}</h1>
  <form class="card" [formGroup]="f" (ngSubmit)="save()">
    <div class="form">
      @for (c of fields; track c.k) {
        <div><label [for]="c.k">{{ c.l }}</label><input [id]="c.k" [formControlName]="c.k" [type]="c.t ?? 'text'">
          @if (f.get(c.k)?.touched && f.get(c.k)?.invalid) { <small class="err">Check this field</small> }</div>
      }
      <div><label for="agent">Assigned agent</label>
        <select id="agent" formControlName="agentId"><option [ngValue]="null">Unassigned</option>
          @for (a of agents(); track a.id) { <option [ngValue]="a.id">{{ a.name }} ({{ a.agentCode }})</option> }</select></div>
    </div>
    @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
    <div class="row" style="margin-top:14px"><button class="btn" [disabled]="f.invalid">Save customer</button>
      <a class="btn ghost" routerLink="/customers">Cancel</a></div>
  </form>`
})
export class CustomerFormComponent implements OnInit {
  private fb = inject(FormBuilder); private api = inject(Api); private router = inject(Router);
  private route = inject(ActivatedRoute);
  id = 0;
  agents = signal<Agent[]>([]); error = signal('');
  fields = [
    { k: 'companyName', l: 'Company name' }, { k: 'contactPerson', l: 'Contact person' }, { k: 'designation', l: 'Designation' },
    { k: 'mobile', l: 'Mobile' }, { k: 'altMobile', l: 'Alternate mobile' }, { k: 'email', l: 'Email', t: 'email' },
    { k: 'address', l: 'Company address' }, { k: 'city', l: 'City' }, { k: 'district', l: 'District' }, { k: 'state', l: 'State' },
    { k: 'industryType', l: 'Industry type' }, { k: 'gstNumber', l: 'GST number' }, { k: 'panNumber', l: 'PAN number' },
    { k: 'website', l: 'Website' }, { k: 'leadSource', l: 'Lead source' }, { k: 'enquiryDate', l: 'Date of enquiry', t: 'date' }];
  f = this.fb.group({
    companyName: ['', Validators.required], contactPerson: ['', Validators.required],
    designation: [''], mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]], altMobile: [''],
    email: ['', Validators.email], address: [''], city: [''], district: [''], state: ['Maharashtra'], industryType: [''],
    gstNumber: ['', Validators.pattern(/^$|^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/)],
    panNumber: ['', Validators.pattern(/^$|^[A-Z]{5}\d{4}[A-Z]$/)], website: [''], leadSource: [''],
    enquiryDate: [new Date().toISOString().slice(0, 10)], agentId: [null as number | null]
  });
  ngOnInit() {
    this.api.get<Agent[]>('agents', { activeOnly: true }).subscribe(a => this.agents.set(a));
    this.id = +(this.route.snapshot.paramMap.get('id') ?? 0);
    if (this.id) this.api.get<any>(`customers/${this.id}`).subscribe(c => this.f.patchValue({ ...c, enquiryDate: c.enquiryDate?.slice(0, 10) }));
  }
  save() {
    const body = this.f.getRawValue();
    const req = this.id ? this.api.put(`customers/${this.id}`, body) : this.api.post<any>('customers', body);
    req.subscribe({ next: (r: any) => this.router.navigate(['/customers', this.id || r.id]), error: e => this.error.set(e.error?.message ?? 'Could not save.') });
  }
}
