import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const format = searchParams.get('format');

  if (format === 'json') {
    return NextResponse.json({ id, data: 'Dummy JSON bundle for report ' + id });
  }

  // Dummy PDF/Word buffer
  const buffer = Buffer.from(`Dummy ${format?.toUpperCase()} file for report ${id}`);
  let contentType = 'application/octet-stream';
  let fileName = `report-${id}.${format}`;
  if (format === 'pdf') contentType = 'application/pdf';
  if (format === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
} 