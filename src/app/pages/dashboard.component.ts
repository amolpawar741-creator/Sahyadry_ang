import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Api } from '../core/api.service';

@Component({
  selector: 'app-dashboard', standalone: true, imports: [CurrencyPipe],
  template: `
  <h1>Business overview</h1>
  @if (d(); as d) {
    <div class="grid kpis">
      @for (k of kpis(d); track k.l) { <div class="kpi" [class.bad]="k.bad"><b>{{ k.v }}</b><span>{{ k.l }}</span></div> }
    </div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr));margin-top:16px">
      <div class="card"><h2>Agent performance (enquiries)</h2>
        @for (a of d.agents; track a.agentId) {
          <div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between"><span>{{ a.name }}</span>
            <span class="muted">{{ a.totalEnquiries }} enq · {{ a.completedDeals }} deals · {{ a.revenue | currency:'INR':'symbol':'1.0-0' }}</span></div>
            <div class="barwrap"><div class="bar" [style.width.%]="pct(a.totalEnquiries, maxAgent(d))"></div></div></div>
        } @empty { <p class="muted">No agents yet. Add agents to see performance.</p> }
      </div>
      <div class="card"><h2>Enquiries – last 6 months</h2>
        <div style="display:flex;align-items:end;gap:10px;height:150px">
          @for (t of d.enquiryTrend; track t.label) {
            <div style="flex:1;text-align:center"><div class="bar" style="width:100%" [style.height.px]="pct(t.value, maxTrend(d)) * 1.2"></div>
              <small>{{ t.label }}<br><b>{{ t.value }}</b></small></div>
          } @empty { <p class="muted">No data yet.</p> }
        </div></div>
      <div class="card"><h2>MIDC-wise demand</h2>
        @for (m of d.midcDemand; track m.label) {
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:5px 0"><span>{{ m.label }}</span><b>{{ m.value }}</b></div>
        } @empty { <p class="muted">Add customer requirements with a preferred MIDC.</p> }
      </div>
    </div>
  } @else { <p class="muted">Loading…</p> }`
})
export class DashboardComponent implements OnInit {
  private api = inject(Api); d = signal<any>(null);
  ngOnInit() { this.api.get('dashboard').subscribe(r => this.d.set(r)); }
  pct = (v: number, max: number) => max ? Math.round(v * 100 / max) : 0;
  maxAgent = (d: any) => Math.max(1, ...d.agents.map((a: any) => a.totalEnquiries));
  maxTrend = (d: any) => Math.max(1, ...d.enquiryTrend.map((a: any) => a.value));
  inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
  kpis = (d: any) => [
    { l: 'Registered agents', v: d.totalAgents }, { l: 'Total customers', v: d.totalCustomers }, { l: 'New this month', v: d.newThisMonth },
    { l: 'Active customers', v: d.activeCustomers }, { l: 'Active requirements', v: d.activeRequirements },
    { l: "Today's follow-ups", v: d.todayFollowUps }, { l: 'Overdue follow-ups', v: d.overdueFollowUps, bad: d.overdueFollowUps > 0 },
    { l: 'Meetings this month', v: d.meetingsThisMonth }, { l: 'Site visits this month', v: d.siteVisitsThisMonth },
    { l: 'Quotations', v: d.quotations }, { l: 'MOUs signed', v: d.mousSigned }, { l: 'Applications submitted', v: d.applicationsSubmitted },
    { l: 'Plots allotted', v: d.plotsAllotted }, { l: 'Consultancy revenue', v: this.inr(d.revenue) },
    { l: 'Outstanding', v: this.inr(d.outstanding), bad: d.outstanding > 0 }];
}
