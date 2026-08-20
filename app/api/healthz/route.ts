import { NextResponse } from 'next/server';
import { getStorageBackend } from '@/src/config/env';

/**
 * Liveness probe. Deliberately uses getStorageBackend() rather than loadEnv(): the probe
 * must answer even when the deployment is only partially configured, which is exactly
 * when someone is looking at it.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'reylix',
    storageBackend: getStorageBackend(),
    time: new Date().toISOString(),
  });
}
