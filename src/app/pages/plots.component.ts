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
      <div><label>District</label><input formControlName="district"></div><div><label>Industrial Area</label><input formControlName="name"></div>
      <div><label>Plot</label><input formControlName="phase"></div>
      <!-- <div><label>Regional office</label><input formControlName="regionalOffice"></div> -->
    </div>
      <button class="btn" style="margin-top:10px" [disabled]="loc.invalid">Save location</button></form>

    <form class="card" [formGroup]="plot" (ngSubmit)="addPlot()"><h2>Add plot</h2><div class="form">
      <div><label>MIDC</label><select formControlName="locationId">@for (l of locs(); track l.id) { <option [ngValue]="l.id">{{ l.name }}</option> }</select></div>
      <div><label>Plot number</label><input formControlName="plotNumber"></div>
      <div><label>Area (sq m)</label><input type="number" formControlName="areaSqm"></div>
      <div><label>Rate / sq m (₹)</label><input type="number" formControlName="ratePerSqm"></div>
      <div><label>Latitude</label><input  step="any" placeholder="e.g. 18.5204" formControlName="latitude"></div>
      <div><label>Longitude</label><input  step="any" placeholder="e.g. 73.8567" formControlName="longitude"></div>
      <div><label>Category</label><select formControlName="category"><option>Industrial</option><option>Commercial</option></select></div>
      <div><label>Status</label><select formControlName="status">@for (s of statuses; track s) { <option [value]="s">{{ label(s) }}</option> }</select></div>
      <div class="full"><label><input type="checkbox" formControlName="isOfficiallyVerified" style="width:auto"> Verified against official MIDC availability</label></div></div>
      <!-- @if (plot.controls.latitude.invalid || plot.controls.longitude.invalid) {
        <div class="err" role="alert">Latitude must be between 6 and 38, and longitude between 68 and 98 (India).</div>
      } -->
      @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
      <button class="btn" style="margin-top:10px" [disabled]="plot.invalid">Save plot</button></form>
  </div>

  <div class="card"><h2>Plot search</h2><div class="row">
    <div><label>MIDC</label><select [(ngModel)]="q.locationId"><option value="">All</option>@for (l of locs(); track l.id) { <option [value]="l.id">{{ l.name }}</option> }</select></div>
    <div><label>Status</label><select [(ngModel)]="q.status"><option value="">All</option>@for (s of statuses; track s) { <option [value]="s">{{ label(s) }}</option> }</select></div>
    <div><label>Category</label><select [(ngModel)]="q.category"><option value="">All</option><option>Industrial</option><option>Commercial</option></select></div>
    <div><label>Min area</label><input type="number" [(ngModel)]="q.minArea"></div><div><label>Max area</label><input type="number" [(ngModel)]="q.maxArea"></div>
    <button class="btn" (click)="search()">Search</button></div>
    <div class="scroll"><table><thead><tr><th>MIDC</th><th>Plot</th><th>Category</th><th>Area</th><th>Rate</th><th>Value</th><th>Status</th><th>Source</th><th>GIS</th></tr></thead><tbody>
    @for (p of plots(); track p.id) {
      <tr><td>{{ p.location }}</td><td>{{ p.plotNumber }}</td><td>{{ p.category }}</td><td>{{ p.areaSqm | number }}</td><td>₹{{ p.ratePerSqm | number }}</td>
        <td>₹{{ p.totalValue | number:'1.0-0' }}</td><td><span class="tag">{{ label(p.status) }}</span></td>
        <td><span class="tag" [class.green]="p.isOfficiallyVerified" [class.amber]="!p.isOfficiallyVerified">{{ p.isOfficiallyVerified ? 'MIDC verified' : 'Internal record' }}</span></td>
        <td>
          @if (gisUrl(p); as url) {
            <a class="btn ghost" [href]="url" target="_blank" rel="noopener noreferrer">Show Plot on GIS</a>
          } @else {
            <span class="muted" title="Add latitude and longitude to this plot">—</span>
          }
        </td></tr>
    } @empty { <tr><td colspan="9" class="muted">No plots found.</td></tr> }</tbody></table></div></div>`
})
export class PlotsComponent implements OnInit {
  private readonly GIS_BASE = 'https://gis.midcindia.org/MIDCGISPortal/';
  private readonly GIS_ZOOM = 18;   // higher = closer; 15 shows the area, 18 shows the plot
  private api = inject(Api); private fb = inject(FormBuilder);
  statuses = PLOT_STATUSES; label = label;
  locs = signal<any[]>([]); plots = signal<any[]>([]); error = signal('');
  q: any = { locationId: '', status: '', category: '', minArea: '', maxArea: '' };
  loc = this.fb.nonNullable.group({ district: ['', Validators.required], name: ['', Validators.required], phase: [''] });
  // , regionalOffice: ['']
  plot = this.fb.nonNullable.group({
    locationId: [0, Validators.min(1)], plotNumber: ['', Validators.required], areaSqm: [0, Validators.min(1)],
    ratePerSqm: [0, Validators.min(1)], category: ['Industrial'], status: ['VerificationPending'], isOfficiallyVerified: [false],
     latitude: [''],
     longitude: ['']
  });

  ngOnInit() { this.loadLocs(); this.search(); }
  loadLocs() { this.api.get<any[]>('locations').subscribe(l => this.locs.set(l)); }
  search() { this.api.get<any[]>('plots', this.q).subscribe(p => this.plots.set(p)); }
  addLoc() { this.api.post('locations', this.loc.getRawValue()).subscribe(() => { this.loc.reset(); this.loadLocs(); }); }
  addPlot() {
    debugger
    this.api.post('plots', this.plot.getRawValue()).subscribe({
      
       next: () => { this.error.set(''); this.search(); },
      error: e => this.error.set(e.error?.message ?? 'Could not save plot.') });
  }

  // Opens the GIS map centred on the plot's coordinates. ArcGIS expects longitude first.
  // Falls back to the IA code + property ID link if the plot has no coordinates.
  gisUrl(p: any): string | null {
    const lat = p?.latitude;
     const lng = p?.longitude;

    if (lat != null && lng != null && isFinite(+lat) && isFinite(+lng)) {
      return `${this.GIS_BASE}?center=${+lng},${+lat}&level=${this.GIS_ZOOM}`;
    }
    if (p?.iaCode && p?.propertyId) {
      return `${this.GIS_BASE}?IACode=${encodeURIComponent(p.iaCode)}&PropertyId=${encodeURIComponent(p.propertyId)}`;
    }
    return null;
  }
}