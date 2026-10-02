-- CliniFlow PEP - Seed Inicial de Demonstração

-- 1. Clínica
INSERT INTO clinics (id, name, document_cnpj_cpf, slug, plan, phone, email, address, created_at, updated_at)
VALUES (
    'c101-morumbi',
    'Clínica Integrada Morumbi',
    '45.182.903/0001-44',
    'clinica-integrada',
    'free',
    '(11) 98765-4321',
    'contato@clinicaintegrada.com.br',
    'Av. Giovanni Gronchi, 5819 - Morumbi, São Paulo - SP',
    '2026-01-15 08:00:00+00',
    '2026-09-30 08:00:00+00'
) ON CONFLICT (id) DO NOTHING;

-- 2. Usuários / Profissionais
INSERT INTO users (id, clinic_id, name, email, role, professional_council, council_number, council_uf, specialty, avatar_color, created_at)
VALUES
    ('u-mariana', 'c101-morumbi', 'Dra. Mariana Costa', 'mariana.costa@clinicaintegrada.com.br', 'owner', 'CRM', '148920', 'SP', 'Cardiologia & Clínica Médica', 'bg-teal-600', '2026-01-15 08:00:00+00'),
    ('u-carlos', 'c101-morumbi', 'Dr. Carlos Silva', 'carlos.silva@clinicaintegrada.com.br', 'doctor', 'CRM', '172341', 'SP', 'Clínica Geral', 'bg-blue-600', '2026-02-01 09:00:00+00'),
    ('u-beatriz', 'c101-morumbi', 'Dra. Beatriz Pires', 'beatriz.pires@clinicaintegrada.com.br', 'doctor', 'CRP', '06/154320', 'SP', 'Psicologia Clínica', 'bg-indigo-600', '2026-02-10 10:00:00+00'),
    ('u-thiago', 'c101-morumbi', 'Dr. Thiago Alencar', 'thiago.dentista@clinicaintegrada.com.br', 'doctor', 'CRO', '98214', 'SP', 'Odontologia Clínica', 'bg-emerald-600', '2026-03-01 10:00:00+00'),
    ('u-camila', 'c101-morumbi', 'Camila Rocha', 'camila.recepcao@clinicaintegrada.com.br', 'receptionist', NULL, NULL, NULL, 'Recepção e Atendimento', 'bg-slate-600', '2026-01-20 08:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- 3. Pacientes
INSERT INTO patients (id, clinic_id, name, cpf, birth_date, phone, email, health_insurance, insurance_card_number, address, blood_type, allergies, created_at)
VALUES
    ('p-01', 'c101-morumbi', 'Helena Ribeiro Fontes', '342.198.543-02', '1984-06-14', '5511998811223', 'helena.fontes@email.com', 'Bradesco Saúde', '840192847192', 'Rua Dr. Alberto Seabra, 320 - Alto de Pinheiros, SP', 'A+', 'Penicilina, Dipirona', '2026-02-01 10:00:00+00'),
    ('p-02', 'c101-morumbi', 'Rodrigo Albuquerque Martins', '451.298.483-11', '1979-11-23', '5511987722334', 'rodrigo.martins@empresa.com.br', 'Unimed Nacional', '003291847102', 'Av. Morumbi, 4120 - Morumbi, SP', 'O+', 'Nenhuma', '2026-02-05 11:30:00+00'),
    ('p-03', 'c101-morumbi', 'Mariana Zanin Toledo', '512.384.912-34', '1992-03-08', '5511976633445', 'mari.zanin@design.com', 'Particular', NULL, 'Rua Oscar Freire, 1420 - Cerqueira César, SP', 'B+', 'Frutos do mar', '2026-02-12 14:00:00+00'),
    ('p-04', 'c101-morumbi', 'Carlos Eduardo Vilela', '284.195.408-22', '1968-09-17', '5511965544556', 'carlos.vilela@gmail.com', 'SulAmérica Saúde', '912048591024', 'Rua Dep. Laércio Corte, 800 - Panamby, SP', 'O-', 'Anti-inflamatórios não-esteroidais (AINEs)', '2026-02-20 09:15:00+00'),
    ('p-05', 'c101-morumbi', 'Larissa Duarte Penteado', '629.401.823-55', '1995-12-04', '5511954455667', 'larissa.penteado@adv.br', 'Amil Assistência', '491029384710', 'Av. Faria Lima, 3477 - Itaim Bibi, SP', 'AB+', 'Nenhuma', '2026-03-01 16:00:00+00'),
    ('p-06', 'c101-morumbi', 'Thiago de Matos Alvarenga', '193.847.201-66', '1988-04-29', '5511943366778', 'thiago.alvarenga@tech.io', 'Particular', NULL, 'Rua Harmonia, 510 - Vila Madalena, SP', 'A-', 'Lactose grave', '2026-03-05 10:45:00+00'),
    ('p-07', 'c101-morumbi', 'Beatriz Nogueira Prado', '738.291.045-77', '1975-08-19', '5511932277889', 'beatriz.prado@escola.edu.br', 'Bradesco Saúde', '739102938401', 'Av. Brigadeiro Luís Antônio, 2500 - Jardim Paulista', 'O+', 'Iodo', '2026-03-10 11:20:00+00'),
    ('p-08', 'c101-morumbi', 'Antônio Silveira Camargo', '849.302.156-88', '1955-01-30', '5511921188990', 'antonio.silveira@uol.com.br', 'Porto Seguro Saúde', '582910394819', 'Rua Clodomiro Amazonas, 120 - Itaim Bibi', 'A+', 'Sulfas', '2026-03-15 15:00:00+00'),
    ('p-09', 'c101-morumbi', 'Fernanda Albuquerque Dias', '987.654.321-09', '2001-07-09', '5511910099001', 'fernanda.albuquerque@usp.br', 'Bradesco Saúde', '984321094005', 'Av. Rebouças, 2200 - Pinheiros, SP', 'A+', 'Nenhuma', '2026-03-18 13:40:00+00'),
    ('p-10', 'c101-morumbi', 'Gabriel Menezes Castro', '098.765.432-10', '1987-10-12', '5511909988776', 'gabriel.castro@startup.io', 'Omint', '109283746192', 'Rua Bela Cintra, 1900 - Consolação, SP', 'B-', 'Contrastes iodados', '2026-03-20 09:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- 4. Agendamentos
INSERT INTO appointments (id, clinic_id, patient_id, professional_id, scheduled_at, duration_minutes, status, appointment_type, telemedicine_room_id, notes, whatsapp_sent_at, whatsapp_confirmed_at, created_at)
VALUES
    ('app-00', 'c101-morumbi', 'p-10', 'u-carlos', CURRENT_DATE + TIME '08:00:00', 30, 'completed', 'presential', NULL, 'Consulta médica concluída com sucesso. Receita e orientações emitidas.', '2026-09-29 08:30:00+00', '2026-09-29 08:45:00+00', '2026-09-24 09:00:00+00'),
    ('app-01', 'c101-morumbi', 'p-01', 'u-mariana', CURRENT_DATE + TIME '09:00:00', 30, 'in_progress', 'presential', NULL, 'Retorno para ajuste de medicação anti-hipertensiva. Paciente em atendimento.', '2026-09-29 10:00:00+00', '2026-09-29 10:14:00+00', '2026-09-25 14:00:00+00'),
    ('app-02', 'c101-morumbi', 'p-02', 'u-mariana', CURRENT_DATE + TIME '09:30:00', 30, 'waiting', 'presential', NULL, 'Paciente fez check-in na recepção. Aguardando na sala de espera.', '2026-09-29 10:00:00+00', '2026-09-29 10:25:00+00', '2026-09-26 11:30:00+00'),
    ('app-03', 'c101-morumbi', 'p-03', 'u-carlos', CURRENT_DATE + TIME '10:00:00', 30, 'confirmed', 'telemedicine', 'cliniflow-room-zanin-774', 'Teleconsulta - cefaleia e náuseas há 3 dias.', '2026-09-29 10:00:00+00', '2026-09-29 11:02:00+00', '2026-09-27 09:15:00+00'),
    ('app-04', 'c101-morumbi', 'p-04', 'u-carlos', CURRENT_DATE + TIME '10:30:00', 40, 'scheduled', 'presential', NULL, 'Primeira consulta. Avaliação de dor lombar crônica.', '2026-09-29 10:00:00+00', NULL, '2026-09-28 16:00:00+00'),
    ('app-05', 'c101-morumbi', 'p-05', 'u-beatriz', CURRENT_DATE + TIME '11:00:00', 50, 'confirmed', 'telemedicine', 'cliniflow-room-larissa-391', 'Sessão de psicoterapia semanal. Foco em ansiedade e sobrecarga.', '2026-09-29 10:00:00+00', '2026-09-29 11:40:00+00', '2026-09-20 10:00:00+00'),
    ('app-06', 'c101-morumbi', 'p-06', 'u-thiago', CURRENT_DATE + TIME '11:30:00', 45, 'scheduled', 'presential', NULL, 'Revisão semestral e profilaxia com jato de bicarbonato.', '2026-09-29 10:00:00+00', NULL, '2026-09-28 14:00:00+00'),
    ('app-07', 'c101-morumbi', 'p-07', 'u-mariana', CURRENT_DATE + TIME '14:00:00', 30, 'scheduled', 'presential', NULL, 'Apresentação de exames de sangue e ecocardiograma.', NULL, NULL, '2026-09-28 18:00:00+00'),
    ('app-08', 'c101-morumbi', 'p-08', 'u-carlos', CURRENT_DATE + TIME '14:30:00', 30, 'scheduled', 'presential', NULL, 'Acompanhamento de diabetes tipo 2 e neuropatia.', NULL, NULL, '2026-09-29 11:00:00+00'),
    ('app-09', 'c101-morumbi', 'p-09', 'u-beatriz', CURRENT_DATE + TIME '15:30:00', 50, 'scheduled', 'telemedicine', 'cliniflow-room-fernanda-882', 'Sessão quinzenal - regulação emocional acadêmica.', NULL, NULL, '2026-09-29 14:30:00+00')
ON CONFLICT (id) DO NOTHING;

-- 5. Prontuários Eletrônicos (Medical Records)
INSERT INTO medical_records (id, clinic_id, patient_id, professional_id, appointment_id, anamnese_data, diagnosis_cid10, diagnosis_description, prescription, prescription_items, certificate_days, is_signed, signature_hash, signature_provider, signed_at, signed_by_name, signed_by_council, biometric_verified, created_at)
VALUES
    (
        'rec-01',
        'c101-morumbi',
        'p-01',
        'u-mariana',
        'app-01',
        '{"type": "medical", "data": {"queixa_principal": "Cefaleia occipital matinal e picos pressóricos ocasionais.", "hda": "Paciente relata que nas últimas duas semanas notou pressão em torno de 155x95 mmHg.", "antecedentes_pessoais": "Hipertensa há 3 anos.", "medicamentos_em_uso": "Losartana 50mg 1x/dia.", "pressao_arterial_sistolica": 145, "pressao_arterial_diastolica": 92, "frequencia_cardiaca": 76, "conduta_clinica": "Otimização anti-hipertensiva com Hidroclorotiazida."}}'::jsonb,
        'I10',
        'Hipertensão essencial (primária)',
        '1. Losartana Potássica 50mg + Hidroclorotiazida 12,5mg - 1 cp pela manhã em jejum.',
        '[{"medicine": "Losartana + HCTZ", "dosage": "50mg + 12.5mg", "frequency": "1x ao dia", "duration": "Uso contínuo"}]'::jsonb,
        0,
        TRUE,
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855a820',
        'cfm_cloud',
        '2026-09-30 09:22:00+00',
        'Dra. Mariana Costa',
        'CRM/SP 148920',
        TRUE,
        '2026-09-30 09:05:00+00'
    ),
    (
        'rec-02',
        'c101-morumbi',
        'p-02',
        'u-carlos',
        NULL,
        '{"type": "medical", "data": {"queixa_principal": "Dor epigástrica em queimação e pirose pós-prandial.", "hda": "Sintomas iniciados há 3 semanas, com piora após café e alimentos condimentados.", "conduta_clinica": "Iniciado Omeprazol 40mg em jejum por 30 dias."}}'::jsonb,
        'K29.7',
        'Gastrite não especificada',
        '1. Omeprazol 40mg - 1 cápsula pela manhã em jejum por 30 dias.',
        '[{"medicine": "Omeprazol", "dosage": "40mg", "frequency": "1x ao dia em jejum", "duration": "30 dias"}]'::jsonb,
        0,
        FALSE,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        FALSE,
        '2026-09-28 14:10:00+00'
    )
ON CONFLICT (id) DO NOTHING;

-- 6. Trilha de Auditoria CFM / LGPD
INSERT INTO medical_audit_trail (id, record_id, patient_name, user_id, user_name, user_role, action, details, ip_address, user_agent, timestamp)
VALUES
    ('adt-01', 'rec-01', 'Helena Ribeiro Fontes', 'u-mariana', 'Dra. Mariana Costa', 'CRM/SP 148920 (Owner)', 'CREATED', 'Abertura de atendimento ambulatorial e anamnese cardiológica.', '189.102.44.12', 'Mozilla/5.0 Chrome/128.0', '2026-09-30 09:05:00+00'),
    ('adt-02', 'rec-01', 'Helena Ribeiro Fontes', 'u-mariana', 'Dra. Mariana Costa', 'CRM/SP 148920 (Owner)', 'SIGNED', 'Assinatura digital ICP-Brasil PAdES com certificado e carimbo do tempo.', '189.102.44.12', 'Mozilla/5.0 Chrome/128.0', '2026-09-30 09:22:00+00'),
    ('adt-03', 'rec-01', 'Helena Ribeiro Fontes', 'u-mariana', 'Dra. Mariana Costa', 'CRM/SP 148920 (Owner)', 'EXPORTED', 'Emissão de Receituário Médico com QR Code de autenticação CFM.', '189.102.44.12', 'Mozilla/5.0 Chrome/128.0', '2026-09-30 09:23:15+00')
ON CONFLICT (id) DO NOTHING;

-- 7. Configurações de Lembrete WhatsApp
INSERT INTO reminder_settings (id, clinic_id, enabled, send_working_hours_only, working_hours_start, working_hours_end, auto_confirm_keyword, auto_reschedule_keyword, api_gateway, notify_reception_on_cancel, rules)
VALUES (
    'rem-c101',
    'c101-morumbi',
    TRUE,
    TRUE,
    '08:00',
    '20:00',
    '1',
    '2',
    'meta_cloud',
    TRUE,
    '[
        {"id": "rule-1", "name": "1º Lembrete Prévio (24h)", "enabled": true, "time_value": 24, "time_unit": "hours", "target_type": "all", "message_template": "Olá, *{paciente}*! Lembramos da sua consulta na *{clinica}* com *{medico}* em {data} às {horario}. Responda *1* para confirmar ou *2* para reagendar.", "include_telemedicine_link": true, "include_location_map": true, "request_confirmation": true},
        {"id": "rule-2", "name": "2º Lembrete Reforço (2h)", "enabled": true, "time_value": 2, "time_unit": "hours", "target_type": "all", "message_template": "Olá, *{paciente}*! Sua consulta com *{medico}* na *{clinica}* acontecerá hoje às *{horario}*.", "include_telemedicine_link": true, "include_location_map": false, "request_confirmation": false}
    ]'::jsonb
) ON CONFLICT (clinic_id) DO NOTHING;

-- 8. Modelos de Documentos (Templates)
INSERT INTO document_templates (id, clinic_id, title, category, council_target, description, content, requires_cid, requires_days, created_at, updated_at)
VALUES
    ('tmpl-01', 'c101-morumbi', 'Atestado Médico de Afastamento / Repouso', 'atestado', 'CRM', 'Atestado padrão CFM para afastamento laboral com dias e CID-10.', 'Atesto para os devidos fins que o(a) paciente {{paciente_nome}}, CPF {{paciente_cpf}}, necessita de repouso por {{dias_afastamento}} dia(s).\n\nCID-10: {{cid10}} - {{cid10_descricao}}.', TRUE, TRUE, '2026-02-01 10:00:00+00', '2026-09-30 10:00:00+00'),
    ('tmpl-02', 'c101-morumbi', 'Declaração de Comparecimento', 'declaracao', 'TODOS', 'Comprova comparecimento em consulta com horários.', 'Declaro que o(a) Sr(a). {{paciente_nome}}, CPF {{paciente_cpf}}, compareceu a esta clínica em {{data_consulta}} das {{horario_inicio}} às {{horario_fim}}.', FALSE, FALSE, '2026-02-05 11:00:00+00', '2026-09-30 10:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- 9. Transações Financeiras
INSERT INTO financial_transactions (id, clinic_id, patient_id, patient_name, professional_id, professional_name, description, category, amount, type, payment_method, status, payment_date, invoice_number, created_at)
VALUES
    ('tx-01', 'c101-morumbi', 'p-01', 'Helena Ribeiro Fontes', 'u-mariana', 'Dra. Mariana Costa', 'Consulta Cardiológica Particular + Eletrocardiograma', 'consulta_particular', 450.00, 'receita', 'particular_cartao', 'pago', '2026-09-30', 'NFS-2026-0891', '2026-09-30 09:30:00+00'),
    ('tx-02', 'c101-morumbi', 'p-03', 'Mariana Zanin Toledo', 'u-carlos', 'Dr. Carlos Silva', 'Consulta Clínica Geral Particular', 'consulta_particular', 250.00, 'receita', 'pix', 'pago', '2026-09-29', 'NFS-2026-0888', '2026-09-29 11:15:00+00'),
    ('tx-03', 'c101-morumbi', NULL, NULL, NULL, NULL, 'Locação e Condomínio - Conjunto Morumbi Medical', 'custo_operacional', 2850.00, 'despesa', 'boleto', 'pago', '2026-09-10', 'REC-COND-0926', '2026-09-10 10:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- 10. Catálogo CID-10
INSERT INTO cid10_catalog (code, description, chapter)
VALUES
    ('I10', 'Hipertensão essencial (primária)', 'Aparelho Circulatório'),
    ('I11.9', 'Doença cardíaca hipertensiva sem insuficiência cardíaca', 'Aparelho Circulatório'),
    ('I20.9', 'Angina pectoris, não especificada', 'Aparelho Circulatório'),
    ('I50.9', 'Insuficiência cardíaca não especificada', 'Aparelho Circulatório'),
    ('E11.9', 'Diabetes mellitus tipo 2 sem complicações', 'Endócrino e Metabólico'),
    ('E10.9', 'Diabetes mellitus tipo 1 sem complicações', 'Endócrino e Metabólico'),
    ('E03.9', 'Hipotireoidismo não especificado', 'Endócrino e Metabólico'),
    ('E78.0', 'Hipercolesterolemia pura / Dislipidemia', 'Endócrino e Metabólico'),
    ('J00', 'Nasofaringite aguda (resfriado comum)', 'Aparelho Respiratório'),
    ('J06.9', 'Infecção aguda das vias aéreas superiores (IVAS)', 'Aparelho Respiratório'),
    ('J45.9', 'Asma não especificada', 'Aparelho Respiratório'),
    ('F32.1', 'Episódio depressivo moderado', 'Transtornos Mentais'),
    ('F41.1', 'Transtorno de ansiedade generalizada (TAG)', 'Transtornos Mentais'),
    ('F41.0', 'Transtorno de pânico (ansiedade paroxística episódica)', 'Transtornos Mentais'),
    ('M54.5', 'Dor lombar baixa (Lombalgia aguda/crônica)', 'Osteomuscular'),
    ('M54.2', 'Cervicalgia (dor cervical)', 'Osteomuscular'),
    ('K29.7', 'Gastrite não especificada', 'Aparelho Digestivo'),
    ('K21.9', 'Doença de refluxo gastroesofágico sem esofagite (DRGE)', 'Aparelho Digestivo'),
    ('Z00.0', 'Exame médico geral (Check-up clínico de rotina)', 'Fatores de Saúde')
ON CONFLICT (code) DO NOTHING;
