import { NextRequest, NextResponse } from 'next/server';
import { getAllFamilies, insertFamily, updateFamilyStatus, updateFamily, deleteFamily } from '@/src/db/queries';

export async function GET() {
  try {
    const families = await getAllFamilies();
    return NextResponse.json({ success: true, data: families });
  } catch (error: any) {
    console.error('API /api/families GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar famílias' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      cpf,
      nis,
      rg,
      birthDate,
      phone,
      genderIdentity,
      address,
      bairro,
      housingType,
      rentValue,
      referencePoint,
      vulnerabilityLevel,
      monthlyIncome,
      perCapitaIncome,
      benefitType,
      status = 'em_acompanhamento',
      pastoralNotes,
      dependents = [],
    } = body;

    if (!name || !cpf) {
      return NextResponse.json(
        { success: false, error: 'Nome e CPF são campos obrigatórios.' },
        { status: 400 }
      );
    }

    const newId = `FAM-${Date.now().toString().slice(-4)}`;

    const newFamily = await insertFamily(
      {
        id: newId,
        name,
        cpf,
        nis: nis || null,
        rg: rg || null,
        birthDate: birthDate || null,
        phone: phone || null,
        genderIdentity: genderIdentity || null,
        address: address || null,
        bairro: bairro || null,
        housingType: housingType || null,
        rentValue: rentValue ? String(rentValue) : null,
        referencePoint: referencePoint || null,
        vulnerabilityLevel: vulnerabilityLevel || 'moderada',
        monthlyIncome: monthlyIncome ? String(monthlyIncome) : null,
        perCapitaIncome: perCapitaIncome ? String(perCapitaIncome) : null,
        benefitType: benefitType || null,
        status: status || 'em_acompanhamento',
        pastoralNotes: pastoralNotes || null,
        lastDeliveryDate: 'Nunca retirou',
        lastDeliveryDaysAgo: 999,
      },
      dependents
    );

    return NextResponse.json({ success: true, data: newFamily }, { status: 201 });
  } catch (error: any) {
    console.error('API /api/families POST error:', error);
    const msg = error.message || '';
    if (msg.includes('unique') || msg.includes('cpf')) {
      return NextResponse.json(
        { success: false, error: 'Já existe uma família cadastrada com este CPF.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: msg || 'Erro ao salvar família' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, pastoralNotes, ...otherUpdates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da família é obrigatório.' },
        { status: 400 }
      );
    }

    let result;
    if (status && Object.keys(otherUpdates).length === 0 && !pastoralNotes) {
      result = await updateFamilyStatus(id, status);
    } else {
      const payload: any = {};
      if (status) payload.status = status;
      if (pastoralNotes !== undefined) payload.pastoral_notes = pastoralNotes;
      Object.assign(payload, otherUpdates);
      result = await updateFamily(id, payload);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('API /api/families PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar família' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da família é obrigatório.' },
        { status: 400 }
      );
    }

    const deleted = await deleteFamily(id);
    return NextResponse.json({ success: true, data: deleted });
  } catch (error: any) {
    console.error('API /api/families DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao excluir família' },
      { status: 500 }
    );
  }
}
