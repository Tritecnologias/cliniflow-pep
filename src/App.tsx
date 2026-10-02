import React, { useState, useEffect } from 'react';
import {
  Clinic,
  User,
  Patient,
  Appointment,
  MedicalRecord,
  MedicalAuditTrail,
  ClinicPlan,
  AppointmentStatus,
  ReminderSettings,
  DocumentTemplate,
} from './types/clinic';
import { Storage } from './lib/storage';
import { Navbar } from './components/layout/Navbar';
import { AgendaView } from './components/agenda/AgendaView';
import { QueueView } from './components/agenda/QueueView';
import { PatientList } from './components/patients/PatientList';
import { PEPListView } from './components/pep/PEPListView';
import { MedicalRecordEditor } from './components/pep/MedicalRecordEditor';
import { AuditTrailViewer } from './components/audit/AuditTrailViewer';
import { PublicBookingPortal } from './components/public-booking/PublicBookingPortal';
import { FreemiumPlanModal } from './components/billing/FreemiumPlanModal';
import { WhatsAppPreviewModal } from './components/whatsapp/WhatsAppPreviewModal';
import { TelemedicineWorkspace } from './components/telemedicine/TelemedicineWorkspace';
import { DashboardView } from './components/dashboard/DashboardView';
import { ReminderSettingsView } from './components/reminders/ReminderSettingsView';
import { DocumentTemplatesView } from './components/templates/DocumentTemplatesView';
import { FinancialManagementView } from './components/finance/FinancialManagementView';
import { Check, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function App() {
  // State
  const [clinic, setClinic] = useState<Clinic>(() => Storage.getClinic());
  const [users, setUsers] = useState<User[]>(() => Storage.getUsers());
  const [activeUser, setActiveUser] = useState<User>(() =>
    Storage.getActiveUser()
  );
  const [patients, setPatients] = useState<Patient[]>(() =>
    Storage.getPatients()
  );
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    Storage.getAppointments()
  );
  const [records, setRecords] = useState<MedicalRecord[]>(() =>
    Storage.getMedicalRecords()
  );
  const [auditTrail, setAuditTrail] = useState<MedicalAuditTrail[]>(() =>
    Storage.getAuditTrail()
  );
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() =>
    Storage.getReminderSettings()
  );
  const [templates, setTemplates] = useState<DocumentTemplate[]>(() =>
    Storage.getDocumentTemplates()
  );

  // Active view tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals and Active states
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [activePEPRecord, setActivePEPRecord] = useState<MedicalRecord | null>(
    null
  );
  const [activePEPatient, setActivePEPatient] = useState<Patient | null>(null);
  const [isPEPOpen, setIsPEPOpen] = useState(false);

  const [activeWhatsAppApp, setActiveWhatsAppApp] =
    useState<Appointment | null>(null);
  const [activeTelemedicineApp, setActiveTelemedicineApp] =
    useState<Appointment | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Switch role handler
  const handleSwitchUser = (user: User) => {
    const updated = Storage.setActiveUser(user.id);
    setActiveUser(updated);
    showToast(`Perfil alterado para: ${user.name} (${user.role.toUpperCase()})`);
  };

  // Status update handler
  const handleUpdateStatus = (id: string, status: AppointmentStatus) => {
    const updated = Storage.updateAppointmentStatus(id, status);
    setAppointments(updated);
    const statusLabels: Record<string, string> = {
      confirmed: 'Consulta confirmada!',
      waiting: 'Check-in realizado! Paciente na sala de espera.',
      in_progress: 'Atendimento iniciado.',
      completed: 'Atendimento finalizado com sucesso!',
      cancelled: 'Agendamento cancelado.',
    };
    showToast(statusLabels[status] || 'Status atualizado com sucesso!');
  };

  // WhatsApp handlers
  const handleSimulateWhatsAppConfirmation = (appointmentId: string) => {
    const updated = Storage.confirmWhatsAppResponse(appointmentId);
    setAppointments(updated);
    showToast('Resposta de confirmação do paciente recebida via WhatsApp!');
  };

  const handleMarkWhatsAppSent = (appointmentId: string) => {
    const updated = Storage.markWhatsAppSent(appointmentId);
    setAppointments(updated);
    showToast('Notificação enviada ao WhatsApp!');
  };

  // Open PEP for an appointment
  const handleOpenPEPFromAppointment = (appointment: Appointment) => {
    const patient = patients.find((p) => p.id === appointment.patient_id);
    if (!patient) return;

    // Look for existing record for this appointment or patient
    const existing = records.find(
      (r) =>
        r.appointment_id === appointment.id || r.patient_id === patient.id
    );

    setActivePEPatient(patient);
    setActivePEPRecord(existing || null);
    setIsPEPOpen(true);

    // Record audit VIEWED
    if (existing) {
      Storage.saveMedicalRecord(existing, activeUser, 'VIEWED');
      setAuditTrail(Storage.getAuditTrail());
    }
  };

  // Open PEP for a specific record
  const handleOpenRecord = (record: MedicalRecord) => {
    const patient = patients.find((p) => p.id === record.patient_id);
    if (!patient) return;
    setActivePEPatient(patient);
    setActivePEPRecord(record);
    setIsPEPOpen(true);

    // Log audit view
    Storage.saveMedicalRecord(record, activeUser, 'VIEWED');
    setAuditTrail(Storage.getAuditTrail());
  };

  // Save PEP Record
  const handleSavePEPRecord = (
    record: MedicalRecord,
    action: 'CREATED' | 'SIGNED' | 'EXPORTED'
  ) => {
    const updated = Storage.saveMedicalRecord(record, activeUser, action);
    setRecords(updated);
    setAuditTrail(Storage.getAuditTrail());
    setIsPEPOpen(false);

    if (action === 'SIGNED') {
      showToast('Prontuário assinado digitalmente com certificado ICP-Brasil!');
    } else {
      showToast('Prontuário salvo com sucesso!');
    }
  };

  // Add new patient
  const handleAddPatient = (newPatient: Patient) => {
    const updated = Storage.savePatient(newPatient);
    setPatients(updated);
    showToast(`Paciente ${newPatient.name} cadastrado com sucesso!`);
  };

  // Add new appointment
  const handleAddAppointment = (newApp: Appointment) => {
    const updated = Storage.saveAppointment(newApp);
    setAppointments(updated);
    showToast('Novo agendamento criado com sucesso!');
  };

  // Public booking success handler
  const handlePublicBookingSuccess = (
    newPatient: Patient,
    newApp: Appointment
  ) => {
    const updatedPatients = Storage.savePatient(newPatient);
    const updatedAppointments = Storage.saveAppointment(newApp);
    setPatients(updatedPatients);
    setAppointments(updatedAppointments);
    showToast(
      `Novo agendamento recebido pelo portal para ${newPatient.name}!`
    );
  };

  // Update Plan
  const handleUpdatePlan = (newPlan: ClinicPlan) => {
    const updatedClinic = Storage.updatePlan(newPlan);
    setClinic(updatedClinic);
    showToast(`Plano alterado para ${newPlan.toUpperCase()} com sucesso!`);
  };

  // Save Reminder Settings
  const handleSaveReminderSettings = (newSettings: ReminderSettings) => {
    const saved = Storage.saveReminderSettings(newSettings);
    setReminderSettings(saved);
    showToast('Regras de antecedência do WhatsApp salvas com sucesso!');
  };

  // Document Template Handlers
  const handleSaveTemplate = (template: DocumentTemplate) => {
    const updated = Storage.saveDocumentTemplate(template);
    setTemplates(updated);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = Storage.deleteDocumentTemplate(id);
    setTemplates(updated);
  };

  const handleResetTemplates = () => {
    const def = Storage.resetDocumentTemplates();
    setTemplates(def);
    showToast('Modelos de documentos restaurados para a configuração original.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar with 3-Zone Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setIsPEPOpen(false);
          setActiveTab(tab);
        }}
        clinic={clinic}
        users={users}
        activeUser={activeUser}
        onSwitchUser={handleSwitchUser}
        patientCount={patients.length}
        onOpenPlanModal={() => setIsPlanModalOpen(true)}
        onResetDemo={() => Storage.resetDemo()}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Render Telemedicine Workspace with Simultaneous WebRTC and PEP */}
        {activeTelemedicineApp && (
          <TelemedicineWorkspace
            appointment={activeTelemedicineApp}
            patient={
              patients.find(
                (p) => p.id === activeTelemedicineApp.patient_id
              ) || patients[0]
            }
            professional={
              users.find(
                (u) => u.id === activeTelemedicineApp.professional_id
              ) || users[0]
            }
            clinic={clinic}
            currentUser={activeUser}
            existingRecord={
              records.find(
                (r) =>
                  r.appointment_id === activeTelemedicineApp.id ||
                  r.patient_id === activeTelemedicineApp.patient_id
              ) || null
            }
            onEndCall={(updatedRec) => {
              handleUpdateStatus(activeTelemedicineApp.id, 'completed');
              setActiveTelemedicineApp(null);
              if (updatedRec) {
                setRecords(Storage.getMedicalRecords());
              }
            }}
            onSaveRecord={(record, action) => {
              handleSavePEPRecord(record, action);
            }}
          />
        )}

        {/* Dynamic Medical Record Editor (PEP) */}
        {isPEPOpen && activePEPatient ? (
          <MedicalRecordEditor
            record={activePEPRecord}
            patient={activePEPatient}
            professional={activeUser}
            clinic={clinic}
            currentUser={activeUser}
            onSave={handleSavePEPRecord}
            onCancel={() => setIsPEPOpen(false)}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                clinic={clinic}
                patients={patients}
                appointments={appointments}
                records={records}
                users={users}
                onOpenPlanModal={() => setIsPlanModalOpen(true)}
                onUpdatePlan={handleUpdatePlan}
              />
            )}

            {activeTab === 'agenda' && (
              <AgendaView
                appointments={appointments}
                patients={patients}
                users={users}
                clinic={clinic}
                currentUser={activeUser}
                onUpdateStatus={handleUpdateStatus}
                onOpenPEP={handleOpenPEPFromAppointment}
                onOpenWhatsApp={(app) => setActiveWhatsAppApp(app)}
                onStartTelemedicine={(app) => setActiveTelemedicineApp(app)}
                onAddAppointment={handleAddAppointment}
                onOpenReminderSettings={() => setActiveTab('reminders')}
              />
            )}

            {activeTab === 'reminders' && (
              <ReminderSettingsView
                clinic={clinic}
                currentUser={activeUser}
                settings={reminderSettings}
                onSave={handleSaveReminderSettings}
                onClose={() => setActiveTab('agenda')}
              />
            )}

            {activeTab === 'queue' && (
              <QueueView
                appointments={appointments}
                patients={patients}
                users={users}
                currentUser={activeUser}
                onUpdateStatus={handleUpdateStatus}
                onOpenPEP={handleOpenPEPFromAppointment}
                onStartTelemedicine={(app) => setActiveTelemedicineApp(app)}
              />
            )}

            {activeTab === 'patients' && (
              <PatientList
                patients={patients}
                clinic={clinic}
                currentUser={activeUser}
                onAddPatient={handleAddPatient}
                onSelectPatientPEP={(patient) => {
                  const existing = records.find(
                    (r) => r.patient_id === patient.id
                  );
                  setActivePEPatient(patient);
                  setActivePEPRecord(existing || null);
                  setIsPEPOpen(true);
                }}
                onOpenPlanModal={() => setIsPlanModalOpen(true)}
                onExportLGPDSuccess={(msg) => {
                  showToast(msg);
                  setAuditTrail(Storage.getAuditTrail());
                }}
              />
            )}

            {activeTab === 'pep' && (
              <PEPListView
                records={records}
                patients={patients}
                users={users}
                currentUser={activeUser}
                clinic={clinic}
                onOpenRecord={handleOpenRecord}
                onNewRecord={() => {
                  if (patients.length > 0) {
                    setActivePEPatient(patients[0]);
                    setActivePEPRecord(null);
                    setIsPEPOpen(true);
                  }
                }}
                onExportSuccess={(msg) => {
                  showToast(msg);
                  setAuditTrail(Storage.getAuditTrail());
                }}
              />
            )}

            {activeTab === 'templates' && (
              <DocumentTemplatesView
                clinic={clinic}
                currentUser={activeUser}
                users={users}
                patients={patients}
                templates={templates}
                onSaveTemplate={handleSaveTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onResetTemplates={handleResetTemplates}
                showToast={showToast}
              />
            )}

            {activeTab === 'finance' && (
              <FinancialManagementView
                clinic={clinic}
                currentUser={activeUser}
                users={users}
                patients={patients}
                onSwitchToOwner={() => {
                  const owner = users.find((u) => u.role === 'owner');
                  if (owner) {
                    setActiveUser(owner);
                    Storage.setActiveUser(owner.id);
                    showToast('Alternado com sucesso para Dra. Mariana Costa (Owner)');
                  }
                }}
                onToast={showToast}
              />
            )}

            {activeTab === 'audit' && (
              <AuditTrailViewer logs={auditTrail} />
            )}

            {activeTab === 'public-portal' && (
              <PublicBookingPortal
                clinic={clinic}
                doctors={users}
                onBookSuccess={handlePublicBookingSuccess}
              />
            )}
          </>
        )}
      </main>

      {/* WhatsApp Message Preview & Trigger Modal */}
      {activeWhatsAppApp && (
        <WhatsAppPreviewModal
          appointment={activeWhatsAppApp}
          patient={
            patients.find((p) => p.id === activeWhatsAppApp.patient_id) || null
          }
          professional={
            users.find((u) => u.id === activeWhatsAppApp.professional_id) ||
            null
          }
          clinic={clinic}
          onClose={() => setActiveWhatsAppApp(null)}
          onSimulateConfirmation={handleSimulateWhatsAppConfirmation}
          onMarkSent={handleMarkWhatsAppSent}
          onOpenSettings={() => setActiveTab('reminders')}
        />
      )}

      {/* Freemium Pricing & Upgrade Modal */}
      <FreemiumPlanModal
        clinic={clinic}
        patientCount={patients.length}
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onUpdatePlan={handleUpdatePlan}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
