import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Usuários do sistema (Anderson - Administrador, Claudilene - Voluntário)
// Integrado com Supabase Auth (auth.users via uid)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique(), // Supabase Auth UID (auth.users.id)
  username: text('username').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('voluntario'), // 'administrador' | 'voluntario'
  password: text('password'), // Opcional: senhas reais protegidas por Bcrypt em auth.users
  shift: text('shift'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Famílias Beneficiárias
export const families = pgTable('families', {
  id: text('id').primaryKey(), // ex: 'FAM-001'
  name: text('name').notNull(),
  cpf: text('cpf').notNull().unique(), // CPF único obrigatório
  nis: text('nis'),
  rg: text('rg'),
  birthDate: text('birth_date'),
  phone: text('phone'),
  genderIdentity: text('gender_identity'),
  address: text('address'),
  bairro: text('bairro'),
  housingType: text('housing_type'),
  rentValue: text('rent_value'),
  referencePoint: text('reference_point'),
  vulnerabilityLevel: text('vulnerability_level').default('moderada'), // 'critica' | 'alta' | 'moderada' | 'estavel'
  monthlyIncome: text('monthly_income'),
  perCapitaIncome: text('per_capita_income'),
  benefitType: text('benefit_type'),
  status: text('status').notNull().default('em_acompanhamento'), // 'em_acompanhamento' | 'promovida' | 'inativa'
  lastDeliveryDate: text('last_delivery_date'),
  lastDeliveryDaysAgo: integer('last_delivery_days_ago'),
  pastoralNotes: text('pastoral_notes'),
  dependentsNotes: text('dependents_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Dependentes da família
export const dependents = pgTable('dependents', {
  id: serial('id').primaryKey(),
  familyId: text('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  relationship: text('relationship').notNull(),
  age: integer('age').notNull(),
  tag: text('tag'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Registros de Entrega de Cesta Básica
export const deliveryRecords = pgTable('delivery_records', {
  id: serial('id').primaryKey(),
  familyId: text('family_id')
    .notNull()
    .references(() => families.id),
  familyName: text('family_name').notNull(),
  timestamp: text('timestamp').notNull(),
  basketType: text('basket_type').notNull().default('Padrão 22kg'),
  volunteerName: text('volunteer_name').notNull(),
  parishUnit: text('parish_unit').notNull().default('Matriz Santíssimo Redentor'),
  status: text('status').notNull().default('concluida'),
  pastoralVisitRequested: boolean('pastoral_visit_requested').default(false).notNull(),
  observation: text('observation'),
  protocolNumber: text('protocol_number'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Visitas Periódicas Realizadas
export const periodicVisits = pgTable('periodic_visits', {
  id: serial('id').primaryKey(),
  familyId: text('family_id')
    .notNull()
    .references(() => families.id),
  familyName: text('family_name').notNull(),
  date: text('date').notNull(),
  volunteerName: text('volunteer_name').notNull(),
  summary: text('summary').notNull(),
  demandType: text('demand_type'),
  priorityLevel: text('priority_level').default('media'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Configurações Pastorais
export const pastoralSettings = pgTable('pastoral_settings', {
  id: serial('id').primaryKey(),
  parishName: text('parish_name').notNull().default('Paróquia Santíssimo Redentor'),
  parishConference: text('parish_conference').notNull().default('Conferência São Vicente de Paulo'),
  responsiblePriest: text('responsible_priest').default('Padre João Carlos'),
  minIntervalDays: integer('min_interval_days').default(28),
  monthlyBasketQuota: integer('monthly_basket_quota').default(150),
  requireSignature: boolean('require_signature').default(true).notNull(),
  requireVisitForCritical: boolean('require_visit_for_critical').default(true).notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relações Drizzle
export const familiesRelations = relations(families, ({ many }) => ({
  dependents: many(dependents),
  deliveries: many(deliveryRecords),
  visits: many(periodicVisits),
}));

export const dependentsRelations = relations(dependents, ({ one }) => ({
  family: one(families, {
    fields: [dependents.familyId],
    references: [families.id],
  }),
}));

export const deliveryRecordsRelations = relations(deliveryRecords, ({ one }) => ({
  family: one(families, {
    fields: [deliveryRecords.familyId],
    references: [families.id],
  }),
}));

export const periodicVisitsRelations = relations(periodicVisits, ({ one }) => ({
  family: one(families, {
    fields: [periodicVisits.familyId],
    references: [families.id],
  }),
}));
