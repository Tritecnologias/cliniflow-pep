import React, { useState } from 'react';
import {
  Clinic,
  User,
  Patient,
  Appointment,
  MedicalRecord,
  ClinicPlan,
} from '../../types/clinic';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Users,
  CalendarCheck,
  TrendingUp,
  DollarSign,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  CreditCard,
  Video,
  Clock,
  CheckCircle2,
  Filter,
  PieChart as PieChartIcon,
} from 'lucide-react';

interface DashboardViewProps {
  clinic: Clinic;
  patients: Patient[];
  appointments: Appointment[];
  records: MedicalRecord[];
  users: User[];
  onOpenPlanModal: () => void;
  onUpdatePlan: (plan: ClinicPlan) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  clinic,
  patients,
  appointments,
  records,
  users,
  onOpenPlanModal,
  onUpdatePlan,
}) => {
  const [timeframe, setTimeframe] = useState<'4w' | '12w' | 'year'>('4w');

  // Plan pricing constants
  const planPrices: Record<ClinicPlan, number> = {
    free: 0,
    basic: 79,
    pro: 149,
    enterprise: 349,
  };

  const consultationFeeAverage = 220; // R$ 220 média por consulta particular
  const particularPatientsCount = patients.filter(
    (p) => p.health_insurance === 'Particular'
  ).length;

  const completedAppointments = appointments.filter(
    (a) => a.status === 'completed'
  );
  const totalCompleted = completedAppointments.length;

  // Monthly Recurring Revenue estimate based on plan and private consultations
  const mrrSubscription = planPrices[clinic.plan];
  const mrrConsultations = particularPatientsCount * consultationFeeAverage;
  const totalEstimatedRevenue = mrrSubscription + mrrConsultations;

  // 1. Data for Appointments Completed per Week (last 6 weeks)
  const weeklyAppointmentsData = [
    {
      week: 'Sem 35',
      presencial: 18,
      telemedicina: 6,
      total: 24,
      taxaComparecimento: 91,
    },
    {
      week: 'Sem 36',
      presencial: 22,
      telemedicina: 9,
      total: 31,
      taxaComparecimento: 94,
    },
    {
      week: 'Sem 37',
      presencial: 25,
      telemedicina: 11,
      total: 36,
      taxaComparecimento: 93,
    },
    {
      week: 'Sem 38',
      presencial: 28,
      telemedicina: 14,
      total: 42,
      taxaComparecimento: 96,
    },
    {
      week: 'Sem 39',
      presencial: 31,
      telemedicina: 17,
      total: 48,
      taxaComparecimento: 95,
    },
    {
      week: 'Sem 40 (Atual)',
      presencial: Math.max(12, appointments.filter((a) => a.appointment_type === 'presential').length * 2),
      telemedicina: Math.max(5, appointments.filter((a) => a.appointment_type === 'telemedicine').length * 2),
      total: Math.max(17, appointments.length * 2),
      taxaComparecimento: 97,
    },
  ];

  // 2. Data for Total Patients Growth
  const patientGrowthData = [
    { month: 'Mai', pacientes: 4, metaFreemium: 20 },
    { month: 'Jun', pacientes: 7, metaFreemium: 20 },
    { month: 'Jul', pacientes: 10, metaFreemium: 20 },
    { month: 'Ago', pacientes: 12, metaFreemium: 20 },
    { month: 'Set', pacientes: Math.max(14, patients.length), metaFreemium: 20 },
    { month: 'Out (Proj.)', pacientes: Math.max(18, patients.length + 4), metaFreemium: 20 },
  ];

  // 3. Data for Health Insurance Distribution (Convênios)
  const insuranceCounts: Record<string, number> = {};
  patients.forEach((p) => {
    const ins = p.health_insurance || 'Particular';
    insuranceCounts[ins] = (insuranceCounts[ins] || 0) + 1;
  });

  const insuranceData = Object.entries(insuranceCounts).map(([name, count]) => ({
    name,
    value: count,
  }));

  const COLORS = ['#0D9488', '#0284C7', '#6366F1', '#F59E0B', '#10B981', '#EC4899'];

  // 4. Data for Revenue Growth based on Clinic Plans
  const revenuePlanData = [
    {
      mes: 'Mai',
      planoFree: 0,
      planoBasico: 79,
      planoPro: 149,
      planoEnterprise: 349,
      receitaReal: clinic.plan === 'free' ? 2400 : clinic.plan === 'basic' ? 3800 : clinic.plan === 'pro' ? 5600 : 9200,
    },
    {
      mes: 'Jun',
      planoFree: 0,
      planoBasico: 79,
      planoPro: 149,
      planoEnterprise: 349,
      receitaReal: clinic.plan === 'free' ? 2950 : clinic.plan === 'basic' ? 4400 : clinic.plan === 'pro' ? 6400 : 10800,
    },
    {
      mes: 'Jul',
      planoFree: 0,
      planoBasico: 79,
      planoPro: 149,
      planoEnterprise: 349,
      receitaReal: clinic.plan === 'free' ? 3400 : clinic.plan === 'basic' ? 5100 : clinic.plan === 'pro' ? 7300 : 12400,
    },
    {
      mes: 'Ago',
      planoFree: 0,
      planoBasico: 79,
      planoPro: 149,
      planoEnterprise: 349,
      receitaReal: clinic.plan === 'free' ? 4100 : clinic.plan === 'basic' ? 5900 : clinic.plan === 'pro' ? 8500 : 14200,
    },
    {
      mes: 'Set (Atual)',
      planoFree: 0,
      planoBasico: 79,
      planoPro: 149,
      planoEnterprise: 349,
      receitaReal: clinic.plan === 'free' ? 4750 : clinic.plan === 'basic' ? 6800 : clinic.plan === 'pro' ? 9800 : 16500,
    },
    {
      mes: 'Out (Proj.)',
      planoFree: 0,
      planoBasico: 79,
      planoPro: 149,
      planoEnterprise: 349,
      receitaReal: clinic.plan === 'free' ? 5400 : clinic.plan === 'basic' ? 7900 : clinic.plan === 'pro' ? 11400 : 19200,
    },
  ];

  // 5. Data for Appointment Status Distribution (Gráfico de Pizza recharts)
  const scheduledCount = appointments.filter((a) => a.status === 'scheduled').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const inProgressCount = appointments.filter(
    (a) => a.status === 'in_progress' || a.status === 'waiting'
  ).length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;

  const totalAppointmentsCount = appointments.length;

  const appointmentStatusData = [
    {
      key: 'scheduled',
      name: 'Agendado',
      value: scheduledCount,
      color: '#0284C7', // Sky 600
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      key: 'confirmed',
      name: 'Confirmado',
      value: confirmedCount,
      color: '#0D9488', // Teal 600
      badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      key: 'in_progress',
      name: 'Em Andamento',
      value: inProgressCount,
      color: '#8B5CF6', // Purple 500
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      key: 'completed',
      name: 'Concluído',
      value: completedCount,
      color: '#10B981', // Emerald 500
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  if (cancelledCount > 0) {
    appointmentStatusData.push({
      key: 'cancelled',
      name: 'Cancelado',
      value: cancelledCount,
      color: '#EF4444', // Red 500
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
    });
  }

  const activeStatusSlices = appointmentStatusData.filter((item) => item.value > 0);

  // Specialty statistics
  const specialtyBreakdown = [
    { specialty: 'Cardiologia & Clínica Médica', professional: 'Dra. Mariana Costa', appointments: 38, share: '38%' },
    { specialty: 'Clínica Geral & Preventiva', professional: 'Dr. Carlos Silva', appointments: 32, share: '32%' },
    { specialty: 'Psicologia Clínica (CRP)', professional: 'Dra. Beatriz Pires', appointments: 18, share: '18%' },
    { specialty: 'Odontologia Clínica (CRO)', professional: 'Dr. Thiago Alencar', appointments: 12, share: '12%' },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Quick Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Métricas Clínicas & Faturamento
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <span>Dashboard Clínico & Financeiro</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhamento em tempo real de pacientes cadastrados, atendimentos semanais e receita por plano
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Plan badge & upgrade button */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600">Plano Atual:</span>
            <strong className="font-bold text-teal-800 uppercase">
              {clinic.plan}
            </strong>
          </div>

          <button
            onClick={onOpenPlanModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gerenciar Planos</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Pacientes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total de Pacientes
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {patients.length}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-700 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +28.5%
              </span>
              <span>vs. mês anterior</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
            {clinic.plan === 'free' ? (
              <span className="text-amber-700 font-medium">
                {20 - patients.length} vagas restantes no limite gratuito (20)
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">
                Capacidade Ilimitada (Plano {clinic.plan.toUpperCase()})
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Consultas Concluídas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Consultas Concluídas
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {weeklyAppointmentsData[weeklyAppointmentsData.length - 1].total * 4}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-700 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +19.2%
              </span>
              <span>média de 42/semana</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
            <span>Presencial: 72%</span>
            <span>·</span>
            <span>Telemedicina: 28%</span>
          </div>
        </div>

        {/* Metric 3: Receita Mensal Estimada */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Receita Mensal Estimada
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              R$ {totalEstimatedRevenue.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-700 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +15.8%
              </span>
              <span>MRR Consultório</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
            Plano: R$ {planPrices[clinic.plan]} · Consultas Particulares: R$ {mrrConsultations.toLocaleString('pt-BR')}
          </div>
        </div>

        {/* Metric 4: Taxa de Comparecimento WhatsApp */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assiduidade WhatsApp-First
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              96.4%
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-700 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                -78% No-Show
              </span>
              <span>confirmação 1-clique</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
            Tempo médio de espera: <strong>7.8 min</strong>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 1: Appointments Completed Per Week & Patient Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Consultas Concluídas por Semana */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-teal-600" />
                <span>Consultas Concluídas por Semana</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribuição semanal de atendimentos presenciais e telemedicina
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
              Últimas 6 Semanas
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyAppointmentsData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  className="font-mono tabular-nums"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Bar
                  dataKey="presencial"
                  name="Presencial"
                  fill="#0D9488"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="telemedicina"
                  name="Telemedicina"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Evolução de Pacientes (Total Patients Growth) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Evolução da Base de Pacientes</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Crescimento cumulativo e acompanhamento da cota freemium (20 pacientes)
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              {patients.length}/20 Ativos
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={patientGrowthData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  domain={[0, 25]}
                  className="font-mono tabular-nums"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold', color: '#94a3b8' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="pacientes"
                  name="Pacientes Cadastrados"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPatients)"
                />
                <Line
                  type="monotone"
                  dataKey="metaFreemium"
                  name="Teto Freemium (20)"
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2: Proportions & Distributions (Appointment Status & Insurance Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 3: Distribuição por Status de Atendimento (Gráfico de Pizza recharts) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100 mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-teal-600" />
                <span>Atendimentos por Status</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribuição de agendados, confirmados, em andamento e concluídos
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
              {totalAppointmentsCount} {totalAppointmentsCount === 1 ? 'consulta' : 'consultas'}
            </span>
          </div>

          <div className="h-60 w-full relative">
            {activeStatusSlices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeStatusSlices}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={activeStatusSlices.length > 1 ? 4 : 0}
                    dataKey="value"
                  >
                    {activeStatusSlices.map((entry) => (
                      <Cell
                        key={`cell-status-${entry.key}`}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${val} ${Number(val) === 1 ? 'atendimento' : 'atendimentos'} (${
                        totalAppointmentsCount > 0
                          ? Math.round((Number(val) / totalAppointmentsCount) * 100)
                          : 0
                      }%)`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Nenhum agendamento registrado
              </div>
            )}
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-slate-900">
                {totalAppointmentsCount}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Total</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {appointmentStatusData.map((item) => {
              const percent =
                totalAppointmentsCount > 0
                  ? Math.round((item.value / totalAppointmentsCount) * 100)
                  : 0;
              return (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-700 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {item.value}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${item.badgeClass}`}
                    >
                      {percent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 4: Distribuição por Convênio / Saúde */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100 mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Base por Convênio</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Proporção de planos de saúde e particular
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              {patients.length} pacientes
            </span>
          </div>

          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={insuranceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {insuranceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `${val} pacientes (${Math.round((Number(val) / patients.length) * 100)}%)`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-slate-900">
                {patients.length}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Pacientes</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {insuranceData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-slate-700">{item.name}</span>
                </div>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {item.value} ({Math.round((item.value / patients.length) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHARTS ROW 3: Revenue Growth Based on Clinic Plans */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Crescimento de Receita por Plano da Clínica</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Projeção de faturamento mensal combinando plano contratado e consultas atendidas
            </p>
          </div>

          {/* Quick Simulation buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs self-start sm:self-auto">
            <span className="text-[11px] text-slate-500 font-semibold px-1">Simular:</span>
            {(['free', 'basic', 'pro', 'enterprise'] as ClinicPlan[]).map((planKey) => (
              <button
                key={planKey}
                onClick={() => onUpdatePlan(planKey)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase transition-colors ${
                  clinic.plan === planKey
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {planKey}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={revenuePlanData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `R$ ${val / 1000}k`}
                className="font-mono tabular-nums"
              />
              <Tooltip
                formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR')}`, 'Receita Total']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px',
                }}
                itemStyle={{ color: '#34d399' }}
                labelStyle={{ fontWeight: 'bold', color: '#94a3b8' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="receitaReal"
                name={`Faturamento Estimado (Plano ${clinic.plan.toUpperCase()})`}
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">Free (Até 20 pac.)</span>
            <strong className="font-mono text-slate-800">R$ 0 / mês</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">Básico (Ilimitado)</span>
            <strong className="font-mono text-teal-700">R$ 79 / mês</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">Pro (ICP-Brasil)</span>
            <strong className="font-mono text-indigo-700">R$ 149 / mês</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">Enterprise</span>
            <strong className="font-mono text-emerald-700">R$ 349 / mês</strong>
          </div>
        </div>
      </div>

      {/* Specialty and Productivity Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Produtividade por Especialidade & Corpo Clínico
            </h3>
            <p className="text-xs text-slate-500">
              Volume de atendimentos realizados e distribuição percentual
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total de {users.length} profissionais cadastrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Especialidade</th>
                <th className="py-2.5 px-4">Profissional</th>
                <th className="py-2.5 px-4">Consultas no Mês</th>
                <th className="py-2.5 px-4">Participação</th>
                <th className="py-2.5 px-4 text-right">Desempenho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {specialtyBreakdown.map((row) => (
                <tr key={row.specialty} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {row.specialty}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {row.professional}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-800">
                    {row.appointments} consultas
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                    {row.share}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Alta Demanda
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
