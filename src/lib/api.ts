/**
 * API Client — CliniFlow PEP
 * Centraliza todas as chamadas fetch para o backend Express.
 * Em desenvolvimento usa proxy do Vite (/api → localhost:3001).
 */

const BASE = '/api';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Clínica
  getClinic:       ()         => request<any>('GET',   '/clinic'),
  updatePlan:      (plan: string) => request<any>('PUT', '/clinic', { plan }),

  // Usuários
  getUsers:        ()         => request<any[]>('GET',  '/users'),

  // Pacientes
  getPatients:     ()         => request<any[]>('GET',  '/patients'),
  savePatient:     (p: any)   => request<any>('POST',  '/patients', p),
  deletePatient:   (id: string) => request<any>('DELETE', `/patients/${id}`),

  // Agendamentos
  getAppointments: ()         => request<any[]>('GET',  '/appointments'),
  saveAppointment: (a: any)   => request<any>('POST',  '/appointments', a),
  updateStatus:    (id: string, status: string) =>
    request<any>('PATCH', `/appointments/${id}/status`, { status }),
  markWhatsAppSent: (id: string) =>
    request<any>('PATCH', `/appointments/${id}/whatsapp`, { sent: true }),
  confirmWhatsApp:  (id: string) =>
    request<any>('PATCH', `/appointments/${id}/whatsapp`, { confirmed: true }),

  // Prontuários
  getRecords:      ()         => request<any[]>('GET',  '/records'),
  saveRecord:      (r: any)   => request<any>('POST',  '/records', r),

  // Auditoria
  getAudit:        ()         => request<any[]>('GET',  '/audit'),
  addAuditLog:     (log: any) => request<any>('POST',  '/audit', log),

  // Lembretes
  getReminders:    ()         => request<any>('GET',   '/reminders'),
  saveReminders:   (s: any)   => request<any>('PUT',   '/reminders', s),

  // Templates
  getTemplates:    ()         => request<any[]>('GET',  '/templates'),
  saveTemplate:    (t: any)   => request<any>('POST',  '/templates', t),
  deleteTemplate:  (id: string) => request<any>('DELETE', `/templates/${id}`),

  // Financeiro
  getFinancial:    ()         => request<any[]>('GET',  '/financial'),
  saveTransaction: (t: any)   => request<any>('POST',  '/financial', t),
  updateTransaction: (t: any) => request<any>('PUT',   `/financial/${t.id}`, t),
  deleteTransaction: (id: string) => request<any>('DELETE', `/financial/${id}`),

  // Health check
  health:          ()         => request<any>('GET',   '/health'),
};
