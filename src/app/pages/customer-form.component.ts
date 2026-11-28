import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { Agent } from '../core/models';

interface Field { k: string; l: string; t?: string; req?: boolean; select?: boolean; span?: number; }
interface Section { title: string; fields: Field[]; }

@Component({
  selector: 'app-customer-form', standalone: true, imports: [ReactiveFormsModule, RouterLink],
  template: `
  <div class="page">
    <h1>{{ id ? 'Edit customer' : 'Applicant/Company Profile' }}</h1>

    <form [formGroup]="f" (ngSubmit)="save()">
      @for (s of sections; track s.title) {
        <section class="card">
          <h2>{{ s.title }}</h2>
          <div class="grid">
            @for (c of s.fields; track c.k) {
              <div class="f" [style.--span]="c.span ?? 1">
                <label [for]="c.k">{{ c.l }}@if (c.req) {<span class="req"> *</span>}</label>
                @if (c.select) {
                  <select [id]="c.k" [formControlName]="c.k">
                    <option [ngValue]="null">Unassigned</option>
                    @for (a of agents(); track a.id) { <option [ngValue]="a.id">{{ a.name }} ({{ a.agentCode }})</option> }
                  </select>
                } @else {
                  <input [id]="c.k" [formControlName]="c.k" [type]="c.t ?? 'text'"
                         [class.invalid]="f.get(c.k)?.touched && f.get(c.k)?.invalid">
                  @if (f.get(c.k)?.touched && f.get(c.k)?.invalid) { <small class="err">Check this field</small> }
                }
              </div>
            }
          </div>
        </section>
      }

      @if (error()) { <div class="err alert" role="alert">{{ error() }}</div> }

      <div class="actions">
        <button class="btn" [disabled]="f.invalid || saving()">
          {{ saving() ? 'Saving...' : 'Save customer' }}
        </button>
        <a class="btn ghost" routerLink="/customers">Cancel</a>
      </div>
    </form>
  </div>`,
  styles: [`
    :host { display: block; width: 100%; }
    .page { width: 100%; }
    h1 { margin: 0 0 18px; font-size: 22px; font-weight: 700; color: #111827; }

    /* white rounded card per section, like the Agents page */
    .card { background: #fff; border: 1px solid #e3e8f1; border-radius: 10px; padding: 16px 14px 18px; margin-bottom: 16px; }
    h2 { margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #111827; }

    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px 11px; }
    .f { grid-column: span var(--span, 1); min-width: 0; }

    /* small muted label above the input */
    label { display: block; margin-bottom: 4px; font-size: 11.5px; color: #6b7a93; }
    .req { color: #d64545; }

    input, select { width: 100%; height: 35px; padding: 0 10px; box-sizing: border-box;
      border: 1px solid #d5dce9; border-radius: 4px; background-color: #fff;
      font: inherit; font-size: 13px; color: #111827; }
    input:hover, select:hover { border-color: #aebbd6; }
    input:focus, select:focus { outline: none; border-color: #2f5fd0; box-shadow: 0 0 0 3px #e8eefc; }
    input.invalid { border-color: #d64545; }
    select { appearance: auto; }
    small.err { display: block; margin-top: 3px; font-size: 11.5px; }
    .alert { margin-bottom: 14px; }

    .actions { display: flex; gap: 10px; }
    .actions .btn { height: 34px; padding: 0 28px; border-radius: 4px; font-weight: 500;
      display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; }

    @media (max-width: 900px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } .f { grid-column: 1 / -1; } }
  `]
})
export class CustomerFormComponent implements OnInit {
  private fb = inject(FormBuilder); private api = inject(Api); private router = inject(Router);
  private route = inject(ActivatedRoute);
  id = 0;
  agents = signal<Agent[]>([]); error = signal(''); saving = signal(false);

  sections: Section[] = [
    { title: 'Applicant Basic Details', fields: [
      { k: 'applicantName', l: 'Company Owner/Head/Current Lessee', req: true },
      { k: 'designation', l: 'Designation' },
      { k: 'contactPerson', l: 'Contact person', req: true },
      { k: 'mobile', l: 'Mobile number', req: true },
      { k: 'altMobile', l: 'Alternate mobile' },
      { k: 'email', l: 'Primary contact email ID', t: 'email' } ] },
    { title: 'Agent Details', fields: [
      { k: 'agentId', l: 'Assigned agent', select: true },
      { k: 'leadSource', l: 'Lead source' },
      { k: 'enquiryDate', l: 'Date of enquiry', t: 'date' } ] },
    { title: 'Company Details', fields: [
      { k: 'companyName', l: 'Company Name' },
      { k: 'industryType', l: 'Industry type' },
      // { k: 'gstNumber', l: 'GST number' },
      { k: 'website', l: 'Website' },
      { k: 'city', l: 'City' },
      { k: 'district', l: 'District' },
      { k: 'state', l: 'State' },
      { k: 'address', l: 'Company address', t: 'textarea'}, ] }
  ];

 f = this.fb.group({
    applicantName: ['', Validators.required], contactPerson: ['', Validators.required],
    designation: [''], mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]], altMobile: [''],
    email: ['', Validators.email], address: [''], city: [''], district: [''], state: ['Maharashtra'], industryType: [''],
    // gstNumber: ['', Validators.pattern(/^$|^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/)],
    companyName: [''], website: [''], leadSource: [''],
    enquiryDate: [new Date().toISOString().slice(0, 10)], agentId: [null as number | null]
  });


  ngOnInit() {
    this.api.get<Agent[]>('agents', { activeOnly: true }).subscribe(a => this.agents.set(a));
    this.id = +(this.route.snapshot.paramMap.get('id') ?? 0);
    if (this.id) this.api.get<any>(`customers/${this.id}`).subscribe(c => this.f.patchValue({ ...c, enquiryDate: c.enquiryDate?.slice(0, 10) }));
  }

  save() {
    this.saving.set(true);
    this.error.set('');

    const isNew = !this.id;
    const body = this.f.getRawValue();
    const req = this.id ? this.api.put(`customers/${this.id}`, body) : this.api.post<any>('customers', body);

    req.subscribe({
      next: (r: any) => {
        const cid = this.id || r.id;

        // Send PDF on WhatsApp only for NEW customers.
        // To send on edit also, remove the `if (isNew)` condition.
        if (isNew) {
          this.api.post(`whatsapp/customer/${cid}`, {}).subscribe({
            error: e => console.error('WhatsApp send failed', e)
          });
        }

        this.saving.set(false);
        this.router.navigate(['/customers', cid]);
      },
      error: e => {
        this.saving.set(false);
        this.error.set(e.error?.message ?? 'Could not save.');
      }
    });
  }
}