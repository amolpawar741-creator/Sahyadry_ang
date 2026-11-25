import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api } from '../core/api.service';
import { PLOT_STATUSES, label } from '../core/models';

@Component({
  selector: 'app-plots', standalone: true, imports: [FormsModule, ReactiveFormsModule, DecimalPipe],
  template: `
  <h1>MIDC locations & plots</h1>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">
    <form class="card" [formGroup]="loc" (ngSubmit)="addLoc()"><h2>Add MIDC location</h2><div class="form">
      <div><label>District</label><input formControlName="district"></div><div><label>MIDC name</label><input formControlName="name"></div>
      <div><label>Phase</label><input formControlName="phase"></div><div><label>Regional office</label><input formControlName="regionalOffice"></div></div>
      <button class="btn" style="margin-top:10px" [disabled]="loc.invalid">Save location</button></form>
    <form class="card" [formGroup]="plot" (ngSubmit)="addPlot()"><h2>Add plot</h2><div class="form">
      <div><label>MIDC</label><select formControlName="locationId">@for (l of locs(); track l.id) { <option [ngValue]="l.id">{{ l.name }}</option> }</select></div>
      <div><label>Plot number</label><input formControlName="plotNumber"></div>
      <div><label>Area (sq m)</label><input type="number" formControlName="areaSqm"></div>
      <div><label>Rate / sq m (₹)</label><input type="number" formControlName="ratePerSqm"></div>
      <div><label>Category</label><select formControlName="category"><option>Industrial</option><option>Commercial</option></select></div>
      <div><label>Status</label><select formControlName="status">@for (s of statuses; track s) { <option [value]="s">{{ label(s) }}</option> }</select></div>
      <div class="full"><label><input type="checkbox" formControlName="isOfficiallyVerified" style="width:auto"> Verified against official MIDC availability</label></div></div>
      @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
      <button class="btn" style="margin-top:10px" [disabled]="plot.invalid">Save plot</button></form>
  </div>
  <div class="card"><h2>Plot search</h2><div class="row">
    <div><label>MIDC</label><select [(ngModel)]="q.locationId"><option value="">All</option>@for (l of locs(); track l.id) { <option [value]="l.id">{{ l.name }}</option> }</select></div>
    <div><label>Status</label><select [(ngModel)]="q.status"><option value="">All</option>@for (s of statuses; track s) { <option [value]="s">{{ label(s) }}</option> }</select></div>
    <div><label>Category</label><select [(ngModel)]="q.category"><option value="">All</option><option>Industrial</option><option>Commercial</option></select></div>
    <div><label>Min area</label><input type="number" [(ngModel)]="q.minArea"></div><div><label>Max area</label><input type="number" [(ngModel)]="q.maxArea"></div>
    <button class="btn" (click)="search()">Search</button></div>
    <div class="scroll"><table><thead><tr><th>MIDC</th><th>Plot</th><th>Category</th><th>Area</th><th>Rate</th><th>Value</th><th>Status</th><th>Source</th></tr></thead><tbody>
    @for (p of plots(); track p.id) {
      <tr><td>{{ p.location }}</td><td>{{ p.plotNumber }}</td><td>{{ p.category }}</td><td>{{ p.areaSqm | number }}</td><td>₹{{ p.ratePerSqm | number }}</td>
        <td>₹{{ p.totalValue | number:'1.0-0' }}</td><td><span class="tag">{{ label(p.status) }}</span></td>
        <td><span class="tag" [class.green]="p.isOfficiallyVerified" [class.amber]="!p.isOfficiallyVerified">{{ p.isOfficiallyVerified ? 'MIDC verified' : 'Internal record' }}</span></td></tr>
    } @empty { <tr><td colspan="8" class="muted">No plots found.</td></tr> }</tbody></table></div></div>`
})
export class PlotsComponent implements OnInit {
  private api = inject(Api); private fb = inject(FormBuilder);
  statuses = PLOT_STATUSES; label = label;
  locs = signal<any[]>([]); plots = signal<any[]>([]); error = signal('');
  q: any = { locationId: '', status: '', category: '', minArea: '', maxArea: '' };
  loc = this.fb.nonNullable.group({ district: ['', Validators.required], name: ['', Validators.required], phase: [''], regionalOffice: [''] });
  plot = this.fb.nonNullable.group({ locationId: [0, Validators.min(1)], plotNumber: ['', Validators.required], areaSqm: [0, Validators.min(1)],
    ratePerSqm: [0, Validators.min(1)], category: ['Industrial'], status: ['VerificationPending'], isOfficiallyVerified: [false] });
  ngOnInit() { this.loadLocs(); this.search(); }
  loadLocs() { this.api.get<any[]>('locations').subscribe(l => this.locs.set(l)); }
  search() { this.api.get<any[]>('plots', this.q).subscribe(p => this.plots.set(p)); }
  addLoc() { this.api.post('locations', this.loc.getRawValue()).subscribe(() => { this.loc.reset(); this.loadLocs(); }); }
  addPlot() {
    this.api.post('plots', this.plot.getRawValue()).subscribe({ next: () => { this.error.set(''); this.search(); },
      error: e => this.error.set(e.error?.message ?? 'Could not save plot.') });
  }
}
