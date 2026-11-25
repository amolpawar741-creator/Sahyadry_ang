import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';

@Component({
  selector: 'app-followups', standalone: true, imports: [RouterLink, DatePipe],
  template: `
  <h1>Follow-ups</h1>
  @if (daily(); as d) { <div class="grid kpis" style="margin-bottom:16px">
    <div class="kpi"><b>{{ d.calls }}</b><span>Calls today</span></div><div class="kpi"><b>{{ d.meetings }}</b><span>Meetings</span></div>
    <div class="kpi"><b>{{ d.siteVisits }}</b><span>Site visits</span></div><div class="kpi"><b>{{ d.newEnquiries }}</b><span>New enquiries</span></div>
    <div class="kpi"><b>{{ d.pending }}</b><span>Pending today</span></div><div class="kpi bad"><b>{{ d.overdue }}</b><span>Overdue</span></div></div> }
  <div class="tabs">@for (t of tabs; track t.k) { <button [class.on]="kind()===t.k" (click)="open(t.k)">{{ t.l }}</button> }</div>
  <div class="card scroll"><table><thead><tr><th>ID</th><th>Company</th><th>Contact</th><th>Mobile</th><th>Agent</th><th>Stage</th><th>Next</th><th>Days unattended</th><th></th></tr></thead><tbody>
    @for (r of rows(); track r.id) {
      <tr><td>{{ r.customerCode }}</td><td>{{ r.companyName }}</td><td>{{ r.contactPerson }}</td><td>{{ r.mobile }}</td><td>{{ r.agent }}</td><td>{{ r.stage }}</td>
        <td>{{ r.nextFollowUpDate ? (r.nextFollowUpDate | date:'dd MMM') : '—' }}</td><td>{{ r.daysUnattended }}</td>
        <td><a [routerLink]="['/customers', r.id]">Record</a></td></tr>
    } @empty { <tr><td colspan="9" class="muted">Nothing here. You're up to date.</td></tr> }</tbody></table></div>`
})
export class FollowUpsComponent implements OnInit {
  private api = inject(Api);
  tabs = [{ k: 'today', l: 'Today' }, { k: 'overdue', l: 'Overdue' }, { k: 'upcoming', l: 'Upcoming' }, { k: 'no-next', l: 'No next date' }, { k: 'stale', l: 'Not contacted (7 days)' }];
  kind = signal('today'); rows = signal<any[]>([]); daily = signal<any>(null);
  ngOnInit() { this.api.get('followups/daily-report').subscribe(d => this.daily.set(d)); this.open('today'); }
  open(k: string) { this.kind.set(k); this.api.get<any[]>(`followups/worklist/${k}`, { days: 7 }).subscribe(r => this.rows.set(r)); }
}
