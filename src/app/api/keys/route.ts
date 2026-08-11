import { NextResponse } from 'next/server';
import { authenticate } from '@/../backend/lib/auth';
import { generateApiKey, getUserApiKeys, revokeApiKey } from '@/../backend/lib/apiKeys';

export async function GET(req: Request) {
  try {
    const userPayload = authenticate(req, null, false);
    if (!userPayload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const keys = await getUserApiKeys(userPayload.id);
    return NextResponse.json({ keys });
  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ message: error.message || 'Failed to fetch API keys' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userPayload = authenticate(req, null, false);
    if (!userPayload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action || 'create';

    if (action === 'create') {
      const name = body.name || 'Personal Key';
      const keyData = await generateApiKey(userPayload.id, name);
      return NextResponse.json({
        message: 'API key created successfully. Store this key safely as it will not be shown again.',
        key: keyData,
      }, { status: 201 });
    } else if (action === 'revoke') {
      const keyId = Number(body.keyId);
      if (!keyId) {
        return NextResponse.json({ message: 'keyId is required' }, { status: 400 });
      }

      const success = await revokeApiKey(userPayload.id, keyId);
      if (!success) {
        return NextResponse.json({ message: 'Key not found or already revoked' }, { status: 404 });
      }

      return NextResponse.json({ message: 'API key revoked successfully' });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error managing API keys:', error);
    return NextResponse.json({ message: error.message || 'Failed to process API key request' }, { status: 500 });
  }
}
