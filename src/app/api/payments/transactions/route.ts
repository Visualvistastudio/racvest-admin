import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { Transaction, TransactionType, TransactionStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const type = searchParams.get('type') as TransactionType | null;
    const status = searchParams.get('status') as TransactionStatus | null;

    let transactions = db.transactions.findMany();

    if (search) {
      transactions = transactions.filter(
        (t) =>
          t.id.toLowerCase().includes(search) ||
          t.userName.toLowerCase().includes(search) ||
          (t.deliveryId && t.deliveryId.toLowerCase().includes(search)) ||
          (t.providerRef && t.providerRef.toLowerCase().includes(search)) ||
          t.description.toLowerCase().includes(search)
      );
    }

    if (type) {
      transactions = transactions.filter((t) => t.type === type);
    }

    if (status) {
      transactions = transactions.filter((t) => t.status === status);
    }

    return apiSuccess(transactions, { total: transactions.length });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return apiError('Failed to fetch transactions', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, deliveryId, type, amount, method, provider, description, adminName, adminId } = body;

    if (!userId || !userName || !type || typeof amount !== 'number') {
      return apiError('Missing required transaction parameters', 400);
    }

    const now = new Date().toISOString();
    const newTxn: Transaction = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      userId,
      userName,
      deliveryId,
      type,
      amount,
      currency: 'NGN',
      method: method || 'wallet',
      provider: provider || 'system',
      providerRef: `REF-${Date.now()}`,
      status: 'succeeded',
      createdAt: now,
      confirmedAt: now,
      description: description || `Transaction recorded by ${adminName || 'Admin'}`,
    };

    const created = db.transactions.create(newTxn);

    db.auditLogs.create({
      id: `AUD-${Date.now()}`,
      adminId: adminId || 'ADM-001',
      adminName: adminName || 'Admin',
      action: 'finance.transaction_created',
      targetType: 'Transaction',
      targetId: created.id,
      timestamp: now,
      newValue: created,
    });

    return apiSuccess(created, undefined, 201);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return apiError('Failed to record transaction', 500);
  }
}
