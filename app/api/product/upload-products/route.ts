import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert the uploaded file to text
    const csvText = await file.text();

    // Send CSV directly to FastAPI — no local storage
    const res = await fetch('http://localhost:8000/upload-products', {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csvText,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`FastAPI error: ${errText}`);
    }

    const result = await res.json();
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'File upload failed';
    console.error('❌ Upload failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
