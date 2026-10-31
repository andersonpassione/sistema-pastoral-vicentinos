import { NextRequest, NextResponse } from 'next/server';
import { getAllVisits, recordNewVisit } from '@/src/db/queries';

export async function GET() {
  try {
    const visits = await getAllVisits();
    return NextResponse.json({ success: true, data: visits });
  } catch (error: any) {
    console.error('API /api/visits GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar visitas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      familyId,
      familyName,
      date,
      volunteerName,
      summary,
      demandType,
      priorityLevel = 'media',
    } = body;

    if (!familyId || !volunteerName || !summary) {
      return NextResponse.json(
        { success: false, error: 'familyId, volunteerName e summary são obrigatórios.' },
        { status: 400 }
      );
    }

    const created = await recordNewVisit({
      familyId,
      familyName: familyName || 'Família Beneficiária',
      date: date || new Date().toISOString().split('T')[0],
      volunteerName,
      summary,
      demandType: demandType || null,
      priorityLevel,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    console.error('API /api/visits POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao salvar visita' },
      { status: 500 }
    );
  }
}
