export const STAGES = ['NewEnquiry','Contacted','Interested','RequirementConfirmed','PlotIdentification','PlotShortlisted',
  'SiteVisit','QuotationSubmitted','Negotiation','MouSigned','MillapRegistration','ApplicationSubmitted','MidcProcessing',
  'Allotted','Completed'];
export const FOLLOWUP_TYPES = ['Call','WhatsApp','Meeting','Email','SiteVisit'];
export const PLOT_STATUSES = ['Vacant','AvailableForApplication','UnderProcess','Reserved','Allotted','NotAvailable','VerificationPending'];
export const label = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1 $2');
export interface Agent { id: number; agentCode: string; name: string; mobile: string; email?: string; region?: string;
  address?: string; commissionTerms?: string; isActive: boolean; joinDate?: string; }
export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number; }
