import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { FOLLOWUP_TYPES, STAGES, label } from '../core/models';

@Component({
  selector: 'app-customer-detail', standalone: true, imports: [ReactiveFormsModule, FormsModule, RouterLink, DatePipe, DecimalPipe],
  template: `
  @if (c(); as c) {
  <div style="display:flex;justify-content:space-between;align-items:center"><h1>{{ c.companyName }} <small class="muted">{{ c.customerCode }}</small></h1>
    <a class="btn ghost" [routerLink]="['/customers', c.id, 'edit']">Edit</a></div>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">
    <div class="card"><h2>Profile</h2>
      <p>{{ c.contactPerson }} · {{ c.designation }}<br>{{ c.mobile }} · {{ c.email }}<br>{{ c.city }}, {{ c.district }}<br>
        Agent: <b>{{ c.agent?.name ?? 'Unassigned' }}</b></p>
      <label>Pipeline stage</label>
      <select [ngModel]="c.stage" (ngModelChange)="setStage($event)">@for (s of stages; track s) { <option [value]="s">{{ label(s) }}</option> }</select>
    </div>
    <div class="card"><h2>Plot requirements</h2>
      @for (r of c.requirements; track r.id) {
        <div style="border-bottom:1px solid var(--line);padding:6px 0">{{ r.plotCategory }} · {{ r.requiredAreaSqm | number }} sq m · {{ r.requiredDistrict }}
          <button class="btn ghost" style="padding:2px 8px" (click)="match(r.id)">Find plots</button></div>
      } @empty { <p class="muted">No requirement recorded.</p> }
      <form [formGroup]="req" (ngSubmit)="addReq()" class="row" style="margin-top:10px">
        <div><label>District</label><input formControlName="requiredDistrict"></div>
        <div><label>Area (sq m)</label><input type="number" formControlName="requiredAreaSqm"></div>
        <div><label>Budget (₹)</label><input type="number" formControlName="budget"></div>
        <button class="btn" [disabled]="req.invalid">Add</button></form>
      @if (matches().length) {
        <div class="scroll"><table><thead><tr><th>MIDC</th><th>Plot</th><th>Area</th><th>Diff</th><th>Est. cost</th><th>Match</th></tr></thead><tbody>
          @for (m of matches(); track m.id) { <tr><td>{{ m.location }}</td><td>{{ m.plotNumber }}</td><td>{{ m.availableArea | number }}</td>
            <td>{{ m.areaDifference | number }}</td><td>₹{{ m.estimatedCost | number:'1.0-0' }}</td>
            <td><span class="tag" [class.green]="m.matchStatus==='Good match'" [class.red]="m.matchStatus==='Over budget'">{{ m.matchStatus }}</span>
              @if (!m.isOfficiallyVerified) { <span class="tag amber">Unverified</span> }</td></tr> }
        </tbody></table></div> }
    </div>
  </div>
  <div class="card"><h2>Record a follow-up</h2>
    <form [formGroup]="fu" (ngSubmit)="addFollowUp()"><div class="form">
      <div><label>Date & time</label><input type="datetime-local" formControlName="followUpDate"></div>
      <div><label>Type</label><select formControlName="type">@for (t of types; track t) { <option>{{ t }}</option> }</select></div>
      <div><label>Stage after</label><select formControlName="stageAfter">@for (s of stages; track s) { <option [value]="s">{{ label(s) }}</option> }</select></div>
      <div><label>Next follow-up date</label><input type="date" formControlName="nextFollowUpDate"></div>
      <div class="full"><label>Discussion summary</label><textarea rows="2" formControlName="summary"></textarea></div>
      <div><label>Customer response</label><input formControlName="customerResponse"></div>
      <div><label>Next action</label><input formControlName="nextAction"></div></div>
      @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
      <button class="btn" style="margin-top:10px" [disabled]="fu.invalid">Save follow-up</button></form></div>
  <div class="card"><h2>History</h2>
    @for (h of history(); track h.id) {
      <div style="border-bottom:1px solid var(--line);padding:8px 0"><b>{{ h.type }}</b> · {{ h.followUpDate | date:'dd MMM yyyy, h:mm a' }}
        <span class="muted"> · {{ h.agent?.name }}</span><br>{{ h.summary }}
        @if (h.nextAction) { <br><span class="muted">Next: {{ h.nextAction }} ({{ h.nextFollowUpDate | date:'dd MMM' }})</span> }</div>
    } @empty { <p class="muted">No interactions yet. Record the first call above.</p> }
  </div>
  }`
})
export class CustomerDetailComponent implements OnInit {
  private api = inject(Api); private route = inject(ActivatedRoute); private fb = inject(FormBuilder);
  stages = STAGES; types = FOLLOWUP_TYPES; label = label;
  c = signal<any>(null); history = signal<any[]>([]); matches = signal<any[]>([]); error = signal('');
  id = +this.route.snapshot.paramMap.get('id')!;
  fu = this.fb.nonNullable.group({
    followUpDate: [new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16), Validators.required],
    type: ['Call'], summary: ['', Validators.required], customerResponse: [''], stageAfter: ['Contacted'], nextAction: [''], nextFollowUpDate: ['']
  });
  req = this.fb.nonNullable.group({ requiredDistrict: [''], requiredAreaSqm: [0, [Validators.required, Validators.min(1)]], budget: [0] });
  ngOnInit() { this.reload(); }
  reload() {
    this.api.get<any>(`customers/${this.id}`).subscribe(c => { this.c.set(c); this.fu.patchValue({ stageAfter: c.stage }); });
    this.api.get<any[]>(`followups/customer/${this.id}`).subscribe(h => this.history.set(h));
  }
  setStage(stage: string) { this.api.patch(`customers/${this.id}/stage`, { stage, isLost: false }).subscribe(() => this.reload()); }
  addFollowUp() {
    const v = this.fu.getRawValue();
    this.api.post('followups', { ...v, customerId: this.id, nextFollowUpDate: v.nextFollowUpDate || null }).subscribe({
      next: () => { this.error.set(''); this.fu.patchValue({ summary: '', customerResponse: '', nextAction: '', nextFollowUpDate: '' }); this.reload(); },
      error: e => this.error.set(e.error?.message ?? 'Could not save follow-up.') });
  }
  addReq() { this.api.post(`customers/${this.id}/requirements`, this.req.getRawValue()).subscribe(() => this.reload()); }
  match(reqId: number) { this.api.get<any[]>(`customers/${this.id}/requirements/${reqId}/matches`).subscribe(m => this.matches.set(m)); }
}
