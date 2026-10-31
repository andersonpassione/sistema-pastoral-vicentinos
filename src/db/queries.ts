import { eq, desc } from 'drizzle-orm';
import { db } from './index.ts';
import {
  families,
  dependents,
  deliveryRecords,
  periodicVisits,
  users,
  pastoralSettings,
} from './schema.ts';
import { supabaseAdmin, SUPABASE_URL } from '@/lib/supabase';

// Check if we should prefer direct Supabase API connection
const hasSupabase = Boolean(SUPABASE_URL && !SUPABASE_URL.includes('pastoral-vicentinos.supabase.co'));

export async function getAllFamilies() {
  if (hasSupabase) {
    try {
      const { data: fams, error: errFam } = await supabaseAdmin
        .from('families')
        .select('*')
        .order('created_at', { ascending: false });

      if (errFam) throw errFam;

      const { data: deps, error: errDep } = await supabaseAdmin
        .from('dependents')
        .select('*');

      if (errDep) throw errDep;

      return (fams || []).map((f: any) => ({
        ...f,
        dependents: (deps || []).filter((d: any) => d.family_id === f.id || d.familyId === f.id),
      }));
    } catch (error) {
      console.warn('Supabase fetch failed, falling back to local pool:', error);
    }
  }

  try {
    const fams = await db.select().from(families).orderBy(desc(families.createdAt));
    const deps = await db.select().from(dependents);
    return fams.map((f) => ({
      ...f,
      dependents: deps.filter((d) => d.familyId === f.id),
    }));
  } catch (error) {
    console.error('Error fetching families:', error);
    throw new Error('Falha ao consultar famílias no banco de dados.', { cause: error });
  }
}

export async function insertFamily(
  familyData: typeof families.$inferInsert,
  dependentsList: Array<{ name: string; relationship: string; age: number; tag?: string; notes?: string }>
) {
  if (hasSupabase) {
    try {
      const payload = {
        id: familyData.id,
        name: familyData.name,
        cpf: familyData.cpf,
        nis: familyData.nis || null,
        rg: familyData.rg || null,
        birth_date: familyData.birthDate || null,
        phone: familyData.phone || null,
        gender_identity: familyData.genderIdentity || null,
        address: familyData.address || null,
        bairro: familyData.bairro || null,
        housing_type: familyData.housingType || null,
        rent_value: familyData.rentValue || null,
        reference_point: familyData.referencePoint || null,
        vulnerability_level: familyData.vulnerabilityLevel || 'moderada',
        monthly_income: familyData.monthlyIncome || null,
        per_capita_income: familyData.perCapitaIncome || null,
        benefit_type: familyData.benefitType || null,
        status: familyData.status || 'em_acompanhamento',
        last_delivery_date: familyData.lastDeliveryDate || 'Nunca retirou',
        last_delivery_days_ago: familyData.lastDeliveryDaysAgo ?? 999,
        pastoral_notes: familyData.pastoralNotes || null,
      };

      const { data: newFam, error: errInsert } = await supabaseAdmin
        .from('families')
        .insert(payload)
        .select()
        .single();

      if (errInsert) throw errInsert;

      if (dependentsList && dependentsList.length > 0) {
        const depPayload = dependentsList.map((dep) => ({
          family_id: familyData.id,
          name: dep.name,
          relationship: dep.relationship,
          age: dep.age,
          tag: dep.tag || '',
          notes: dep.notes || '',
        }));
        await supabaseAdmin.from('dependents').insert(depPayload);
      }

      return newFam;
    } catch (error: any) {
      console.error('Error inserting family into Supabase:', error);
      throw new Error(error.message || 'Falha ao cadastrar família no Supabase.', { cause: error });
    }
  }

  try {
    const insertedFamily = await db.insert(families).values(familyData).returning();
    const fam = insertedFamily[0];

    if (dependentsList && dependentsList.length > 0) {
      await db.insert(dependents).values(
        dependentsList.map((dep) => ({
          familyId: fam.id,
          name: dep.name,
          relationship: dep.relationship,
          age: dep.age,
          tag: dep.tag || '',
          notes: dep.notes || '',
        }))
      );
    }

    return fam;
  } catch (error) {
    console.error('Error inserting family into PostgreSQL:', error);
    throw new Error('Falha ao cadastrar família no banco de dados.', { cause: error });
  }
}

export async function updateFamilyStatus(familyId: string, status: 'em_acompanhamento' | 'promovida' | 'inativa') {
  if (hasSupabase) {
    try {
      const { data, error } = await supabaseAdmin
        .from('families')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', familyId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error updating status in Supabase:', error);
      throw new Error('Falha ao atualizar status no Supabase.', { cause: error });
    }
  }

  try {
    const updated = await db
      .update(families)
      .set({ status, updatedAt: new Date() })
      .where(eq(families.id, familyId))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Error updating family status in PostgreSQL:', error);
    throw new Error('Falha ao atualizar status da família.', { cause: error });
  }
}

export async function getAllDeliveries() {
  if (hasSupabase) {
    try {
      const { data, error } = await supabaseAdmin
        .from('delivery_records')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase deliveries fetch failed, falling back to local pool:', error);
    }
  }

  try {
    return await db.select().from(deliveryRecords).orderBy(desc(deliveryRecords.createdAt));
  } catch (error) {
    console.error('Error fetching delivery records:', error);
    throw new Error('Falha ao consultar histórico de entregas.', { cause: error });
  }
}

export async function recordNewDelivery(deliveryData: typeof deliveryRecords.$inferInsert) {
  if (hasSupabase) {
    try {
      // Check family status
      const { data: fam, error: famErr } = await supabaseAdmin
        .from('families')
        .select('name, status')
        .eq('id', deliveryData.familyId)
        .single();

      if (!famErr && fam) {
        if (fam.status === 'promovida' || fam.status === 'inativa') {
          throw new Error(`Regra de Negócio: Família "${fam.name}" possui status "${fam.status}" e não pode receber cestas básicas.`);
        }
      }

      const payload = {
        family_id: deliveryData.familyId,
        family_name: deliveryData.familyName,
        timestamp: deliveryData.timestamp,
        basket_type: deliveryData.basketType || 'Padrão 22kg',
        volunteer_name: deliveryData.volunteerName,
        parish_unit: deliveryData.parishUnit || 'Matriz Santíssimo Redentor',
        status: deliveryData.status || 'concluida',
        pastoral_visit_requested: Boolean(deliveryData.pastoralVisitRequested),
        observation: deliveryData.observation || null,
        protocol_number: deliveryData.protocolNumber || `#ENT-${Date.now().toString().slice(-6)}`,
      };

      const { data: created, error: insErr } = await supabaseAdmin
        .from('delivery_records')
        .insert(payload)
        .select()
        .single();

      if (insErr) throw insErr;

      // Update family delivery info
      await supabaseAdmin
        .from('families')
        .update({
          last_delivery_date: 'Hoje',
          last_delivery_days_ago: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliveryData.familyId);

      return created;
    } catch (error: any) {
      console.error('Error inserting delivery into Supabase:', error);
      throw new Error(error.message || 'Falha ao registrar entrega no Supabase.', { cause: error });
    }
  }

  try {
    const fam = await db.select().from(families).where(eq(families.id, deliveryData.familyId)).limit(1);
    if (fam.length > 0) {
      const status = fam[0].status;
      if (status === 'promovida' || status === 'inativa') {
        throw new Error(`Regra de Negócio: Família com status "${status}" não pode receber cestas básicas.`);
      }
    }

    const inserted = await db.insert(deliveryRecords).values(deliveryData).returning();
    await db
      .update(families)
      .set({
        lastDeliveryDate: 'Hoje',
        lastDeliveryDaysAgo: 0,
        updatedAt: new Date(),
      })
      .where(eq(families.id, deliveryData.familyId));

    return inserted[0];
  } catch (error) {
    console.error('Error inserting delivery record:', error);
    throw new Error('Falha ao registrar entrega de cesta.', { cause: error });
  }
}

export async function getAllVisits() {
  if (hasSupabase) {
    try {
      const { data, error } = await supabaseAdmin
        .from('periodic_visits')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase visits fetch failed, falling back to local pool:', error);
    }
  }

  try {
    return await db.select().from(periodicVisits).orderBy(desc(periodicVisits.createdAt));
  } catch (error) {
    console.error('Error fetching periodic visits:', error);
    throw new Error('Falha ao consultar visitas periódicas.', { cause: error });
  }
}

export async function recordNewVisit(visitData: typeof periodicVisits.$inferInsert) {
  if (hasSupabase) {
    try {
      const payload = {
        family_id: visitData.familyId,
        family_name: visitData.familyName,
        date: visitData.date,
        volunteer_name: visitData.volunteerName,
        summary: visitData.summary,
        demand_type: visitData.demandType || null,
        priority_level: visitData.priorityLevel || 'media',
      };

      const { data, error } = await supabaseAdmin
        .from('periodic_visits')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error recording visit in Supabase:', error);
      throw new Error(error.message || 'Falha ao registrar visita periódica no Supabase.', { cause: error });
    }
  }

  try {
    const inserted = await db.insert(periodicVisits).values(visitData).returning();
    return inserted[0];
  } catch (error) {
    console.error('Error recording periodic visit:', error);
    throw new Error('Falha ao registrar visita periódica.', { cause: error });
  }
}

export async function getAllUsers() {
  if (hasSupabase) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase users fetch failed, falling back to local pool:', error);
    }
  }

  try {
    return await db.select().from(users).orderBy(users.id);
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Falha ao consultar usuários.', { cause: error });
  }
}

export async function updateUserPassword(identifier: number | string, newPassword: string) {
  if (hasSupabase) {
    try {
      const query = supabaseAdmin.from('users').update({ password: newPassword });
      const { data, error } = typeof identifier === 'number' || !isNaN(Number(identifier))
        ? await query.eq('id', Number(identifier)).select().single()
        : await query.eq('username', String(identifier).toLowerCase()).select().single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error updating user password in Supabase:', error);
      throw new Error(error.message || 'Falha ao atualizar senha no Supabase.', { cause: error });
    }
  }

  try {
    const isNum = typeof identifier === 'number' || !isNaN(Number(identifier));
    const condition = isNum ? eq(users.id, Number(identifier)) : eq(users.username, String(identifier).toLowerCase());
    const updated = await db.update(users).set({ password: newPassword }).where(condition).returning();
    return updated[0];
  } catch (error) {
    console.error('Error updating user password in PostgreSQL:', error);
    throw new Error('Falha ao atualizar senha no banco de dados.', { cause: error });
  }
}

export async function insertUser(userData: {
  username: string;
  name: string;
  password?: string;
  role?: string;
  shift?: string;
  active?: boolean;
}) {
  const cleanUsername = userData.username.trim().toLowerCase();
  if (hasSupabase) {
    try {
      const payload = {
        username: cleanUsername,
        name: userData.name.trim(),
        password: userData.password || '123',
        role: userData.role || 'voluntario',
        shift: userData.shift || 'Plantão',
        active: userData.active ?? true,
      };
      const { data, error } = await supabaseAdmin.from('users').insert(payload).select().single();
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error inserting user into Supabase:', error);
      throw new Error(error.message || 'Falha ao criar usuário no Supabase.', { cause: error });
    }
  }

  try {
    const inserted = await db.insert(users).values({
      username: cleanUsername,
      name: userData.name.trim(),
      password: userData.password || '123',
      role: userData.role || 'voluntario',
      shift: userData.shift || 'Plantão',
      active: userData.active ?? true,
    }).returning();
    return inserted[0];
  } catch (error) {
    console.error('Error inserting user into PostgreSQL:', error);
    throw new Error('Falha ao criar usuário no banco de dados.', { cause: error });
  }
}

export async function deleteUser(identifier: number | string) {
  if (hasSupabase) {
    try {
      const isNum = typeof identifier === 'number' || !isNaN(Number(identifier));
      const query = supabaseAdmin.from('users').delete();
      const { data, error } = isNum
        ? await query.eq('id', Number(identifier)).select()
        : await query.eq('username', String(identifier).toLowerCase()).select();
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error deleting user from Supabase:', error);
      throw new Error(error.message || 'Falha ao deletar usuário do Supabase.', { cause: error });
    }
  }

  try {
    const isNum = typeof identifier === 'number' || !isNaN(Number(identifier));
    const condition = isNum ? eq(users.id, Number(identifier)) : eq(users.username, String(identifier).toLowerCase());
    return await db.delete(users).where(condition).returning();
  } catch (error) {
    console.error('Error deleting user from PostgreSQL:', error);
    throw new Error('Falha ao deletar usuário no banco de dados.', { cause: error });
  }
}

export async function getSettings() {
  if (hasSupabase) {
    try {
      const { data, error } = await supabaseAdmin
        .from('pastoral_settings')
        .select('*')
        .limit(1)
        .single();
      if (!error && data) return data;
    } catch (error) {
      console.warn('Supabase settings fetch failed:', error);
    }
  }

  try {
    const res = await db.select().from(pastoralSettings).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error('Error fetching pastoral settings:', error);
    throw new Error('Falha ao consultar configurações pastorais.', { cause: error });
  }
}

export async function updatePastoralSettings(data: {
  parishName?: string;
  minIntervalDays?: number;
  requireSignature?: boolean;
}) {
  if (hasSupabase) {
    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (data.parishName !== undefined) payload.parish_name = data.parishName;
      if (data.minIntervalDays !== undefined) payload.min_interval_days = Number(data.minIntervalDays);
      if (data.requireSignature !== undefined) payload.require_signature = Boolean(data.requireSignature);

      const { data: updated, error } = await supabaseAdmin
        .from('pastoral_settings')
        .update(payload)
        .eq('id', 1)
        .select()
        .single();
      if (error) throw error;
      return updated;
    } catch (error: any) {
      console.error('Error updating pastoral settings in Supabase:', error);
      throw new Error(error.message || 'Falha ao atualizar parâmetros no Supabase.', { cause: error });
    }
  }

  try {
    const payload: any = { updatedAt: new Date() };
    if (data.parishName !== undefined) payload.parishName = data.parishName;
    if (data.minIntervalDays !== undefined) payload.minIntervalDays = Number(data.minIntervalDays);
    if (data.requireSignature !== undefined) payload.requireSignature = Boolean(data.requireSignature);

    const res = await db.update(pastoralSettings).set(payload).where(eq(pastoralSettings.id, 1)).returning();
    return res[0];
  } catch (error) {
    console.error('Error updating pastoral settings in PostgreSQL:', error);
    throw new Error('Falha ao atualizar configurações no banco de dados.', { cause: error });
  }
}

export async function deleteFamily(familyId: string) {
  if (hasSupabase) {
    try {
      const { data, error } = await supabaseAdmin.from('families').delete().eq('id', familyId).select();
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error deleting family from Supabase:', error);
      throw new Error(error.message || 'Falha ao excluir família no Supabase.', { cause: error });
    }
  }

  try {
    return await db.delete(families).where(eq(families.id, familyId)).returning();
  } catch (error) {
    console.error('Error deleting family from PostgreSQL:', error);
    throw new Error('Falha ao excluir família no banco de dados.', { cause: error });
  }
}

export async function updateFamily(familyId: string, updates: any) {
  if (hasSupabase) {
    try {
      const payload: any = { ...updates, updated_at: new Date().toISOString() };
      const { data, error } = await supabaseAdmin.from('families').update(payload).eq('id', familyId).select().single();
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error updating family in Supabase:', error);
      throw new Error(error.message || 'Falha ao atualizar família no Supabase.', { cause: error });
    }
  }

  try {
    const payload = { ...updates, updatedAt: new Date() };
    const res = await db.update(families).set(payload).where(eq(families.id, familyId)).returning();
    return res[0];
  } catch (error) {
    console.error('Error updating family in PostgreSQL:', error);
    throw new Error('Falha ao atualizar família no banco de dados.', { cause: error });
  }
}
