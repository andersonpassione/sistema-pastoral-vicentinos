import { NextRequest, NextResponse } from 'next/server';
import { getAllDeliveries, recordNewDelivery } from '@/src/db/queries';

export async function GET() {
  try {
    const deliveries = await getAllDeliveries();
    return NextResponse.json({ success: true, data: deliveries });
  } catch (error: any) {
    console.error('API /api/deliveries GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar entregas' },
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
      timestamp,
      basketType = 'Padrão 22kg',
      volunteerName,
      parishUnit = 'Matriz Santíssimo Redentor',
      status = 'concluida',
      pastoralVisitRequested = false,
      observation = '',
      protocolNumber,
    } = body;

    if (!familyId || !volunteerName) {
      return NextResponse.json(
        { success: false, error: 'familyId e volunteerName são obrigatórios.' },
        { status: 400 }
      );
    }

    const created = await recordNewDelivery({
      familyId,
      familyName,
      timestamp: timestamp || new Date().toISOString(),
      basketType,
      volunteerName,
      parishUnit,
      status,
      pastoralVisitRequested: Boolean(pastoralVisitRequested),
      observation: observation || null,
      protocolNumber: protocolNumber || `#ENT-${Date.now().toString().slice(-6)}`,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    console.error('API /api/deliveries POST error:', error);
    const msg = error.message || '';
    if (msg.includes('Regra de Negócio') || msg.includes('promovida') || msg.includes('inativa')) {
      return NextResponse.json({ success: false, error: msg }, { status: 422 });
    }
    return NextResponse.json(
      { success: false, error: msg || 'Erro ao registrar entrega' },
      { status: 500 }
    );
  }
}
