import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Gemini Vision endpoint belum dikonfigurasi.' }, { status: 501 });
}

