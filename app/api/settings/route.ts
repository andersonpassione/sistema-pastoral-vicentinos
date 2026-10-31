import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updatePastoralSettings } from '@/src/db/queries';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('API /api/settings GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar configurações' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { parishName, minIntervalDays, requireSignature } = body;

    const updated = await updatePastoralSettings({
      parishName,
      minIntervalDays,
      requireSignature,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('API /api/settings POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
