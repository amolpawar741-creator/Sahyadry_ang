import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api } from '../core/api.service';

@Component({
  selector: 'app-quotations', standalone: true, imports: [ReactiveFormsModule, DecimalPipe],
  template: `
  <h1>Quotations & payments</h1>
  <form class="card" [formGroup]="f" (ngSubmit)="create()"><h2>New quotation</h2><div class="form">
    <div><label>Customer</label><select formControlName="customerId">@for (c of customers(); track c.id) { <option [ngValue]="c.id">{{ c.companyName }}</option> }</select></div>
    <div><label>Plot</label><select formControlName="plotId" (change)="fillFromPlot()"><option [ngValue]="null">— none —</option>
      @for (p of plots(); track p.id) { <option [ngValue]="p.id">{{ p.location }} · {{ p.plotNumber }}</option> }</select></div>
    <div><label>Area (sq m)</label><input type="number" formControlName="areaSqm"></div>
    <div><label>MIDC rate / sq m</label><input type="number" formControlName="midcRate"></div>
    <div><label>Consultancy rate / sq m</label><input type="number" formControlName="consultancyRate"></div>
    <!-- <div><label>GST %</label><input type="number" formControlName="gstPercent"></div> -->
    <div><label>Advance received (₹)</label><input type="number" formControlName="advanceAmount"></div>
    <div><label>Valid until</label><input type="date" formControlName="validUntil"></div>
    <div class="full"><label>Payment terms</label><input formControlName="paymentTerms"></div></div>
    <div class="card" style="background:var(--blue-soft);margin:12px 0 0">
      MIDC plot value: <b>₹{{ calc().plot | number:'1.0-0' }}</b> · Consultancy fee: <b>₹{{ calc().fee | number:'1.0-0' }}</b> ·
      Total payable: <b>₹{{ calc().total | number:'1.0-0' }}</b> ·
      Balance: <b>₹{{ calc().balance | number:'1.0-0' }}</b></div>
    @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
    <button class="btn" style="margin-top:12px" [disabled]="f.invalid">Create quotation</button></form>
  <div class="card scroll"><h2>Quotations</h2><table><thead><tr><th>No.</th><th>Date</th><th>Customer</th><th>Total</th><th>Received</th><th>Outstanding</th><th>Status</th><th></th></tr></thead><tbody>
    @for (q of rows(); track q.id) {
      <tr><td>{{ q.quotationNo }}</td><td>{{ q.quotationDate.slice(0,10) }}</td><td>{{ q.customer }}</td><td>₹{{ q.grandTotal | number:'1.0-0' }}</td>
        <td>₹{{ q.paid + q.advanceAmount | number:'1.0-0' }}</td><td>₹{{ q.outstanding | number:'1.0-0' }}</td>
        <td><span class="tag" [class.green]="q.paymentStatus==='Paid'" [class.amber]="q.paymentStatus==='Partial'" [class.red]="q.paymentStatus==='Unpaid'">{{ q.paymentStatus }}</span></td>
        <td><button class="btn ghost" style="padding:2px 8px" (click)="pdf(q)">PDF</button>
          @if (q.outstanding > 0) { <button class="btn ghost" style="padding:2px 8px" (click)="pay(q)">Add payment</button> }</td></tr>
    } @empty { <tr><td colspan="8" class="muted">No quotations yet.</td></tr> }</tbody></table></div>`
})
export class QuotationsComponent implements OnInit {
  private api = inject(Api); private fb = inject(FormBuilder);
  customers = signal<any[]>([]); plots = signal<any[]>([]); rows = signal<any[]>([]); error = signal('');
  f = this.fb.group({
    customerId: [null as number | null, Validators.required], plotId: [null as number | null], areaSqm: [0, Validators.min(1)],
    midcRate: [0], consultancyRate: [0], advanceAmount: [0], validUntil: [''], paymentTerms: ['']
  });
  ngOnInit() {
    this.api.get<any>('customers', { pageSize: 100 }).subscribe(r => this.customers.set(r.items));
    this.api.get<any[]>('plots').subscribe(p => this.plots.set(p)); this.load();
  }
  load() { this.api.get<any[]>('quotations').subscribe(r => this.rows.set(r)); }
  fillFromPlot() { const p = this.plots().find(x => x.id === this.f.value.plotId); if (p) this.f.patchValue({ areaSqm: p.areaSqm, midcRate: p.ratePerSqm }); }
  calc() {   // mirrors the server-side formulas (server is the source of truth)
    const v = this.f.getRawValue(); const area = +(v.areaSqm ?? 0);
    const fee = area * +(v.consultancyRate ?? 0), total = fee ;
    return { plot: area * +(v.midcRate ?? 0), fee, total, balance: total - +(v.advanceAmount ?? 0) };
  }
  create() {
    const v = this.f.getRawValue();
    this.api.post('quotations', { ...v, validUntil: v.validUntil || null }).subscribe({
      next: () => { this.error.set(''); this.load(); }, error: e => this.error.set(e.error?.message ?? 'Could not create quotation.')
    });
  }
  pdf(q: any) { this.api.download(`quotations/${q.id}/pdf`, `${q.quotationNo}.pdf`); }
  pay(q: any) {
    const amount = +(prompt(`Amount received (outstanding ₹${Math.round(q.outstanding)})`) ?? 0); if (!amount) return;
    const mode = prompt('Payment mode (Cash / UPI / NEFT / Cheque)', 'UPI') ?? 'UPI';
    this.api.post(`quotations/${q.id}/payments`, { paymentDate: new Date().toISOString().slice(0, 10), amount, mode, reference: '' })
      .subscribe({ next: () => this.load(), error: e => alert(e.error?.message ?? 'Could not record payment.') });
  }
}
