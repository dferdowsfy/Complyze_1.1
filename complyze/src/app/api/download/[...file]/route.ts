import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { file: string[] } }
) {
  try {
    const filePath = params.file.join('/');
    const fullPath = path.join(process.cwd(), 'public', 'downloads', filePath);
    
    // Security check - ensure file is within downloads directory
    const realPath = path.resolve(fullPath);
    const downloadsPath = path.resolve(path.join(process.cwd(), 'public', 'downloads'));
    
    if (!realPath.startsWith(downloadsPath)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // Check if file exists
    if (!fs.existsSync(realPath)) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Read file
    const fileBuffer = fs.readFileSync(realPath);
    const fileName = path.basename(filePath);
    
    // Determine content type
    let contentType = 'application/octet-stream';
    let downloadName = fileName;
    
    if (fileName.endsWith('.dmg')) {
      contentType = 'application/octet-stream';
      downloadName = fileName.replace('Complyze Desktop Agent-1.0.0-arm64.dmg', 'ComplyzeDesktop-macOS-v1.0.0.dmg');
    } else if (fileName.endsWith('.zip')) {
      contentType = 'application/zip';
      downloadName = fileName.replace('complyze-extension-latest.zip', 'complyze-extension-v2.0.1.zip');
    } else if (fileName.endsWith('.json')) {
      contentType = 'application/json';
    }
    
    // Create response with proper headers
    const response = new NextResponse(fileBuffer);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${downloadName}"`);
    response.headers.set('Content-Length', fileBuffer.length.toString());
    response.headers.set('Cache-Control', 'public, max-age=86400'); // 24 hours
    
    return response;
    
  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 