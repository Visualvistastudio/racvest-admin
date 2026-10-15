import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { Delivery, DeliveryMode, DeliveryStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const mode = searchParams.get('mode') as DeliveryMode | null;
    const status = searchParams.get('status') as DeliveryStatus | null;
    const delayed = searchParams.get('delayed');

    let deliveries = db.deliveries.findMany();

    if (search) {
      deliveries = deliveries.filter(
        (d) =>
          d.id.toLowerCase().includes(search) ||
          d.senderName.toLowerCase().includes(search) ||
          (d.travellerName && d.travellerName.toLowerCase().includes(search)) ||
          (d.courierName && d.courierName.toLowerCase().includes(search)) ||
          d.route.toLowerCase().includes(search) ||
          d.packageDescription.toLowerCase().includes(search)
      );
    }

    if (mode) {
      deliveries = deliveries.filter((d) => d.mode === mode);
    }

    if (status) {
      deliveries = deliveries.filter((d) => d.status === status);
    }

    if (delayed === 'true') {
      deliveries = deliveries.filter((d) => d.isDelayed);
    }

    return apiSuccess(deliveries, { total: deliveries.length });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return apiError('Failed to fetch deliveries', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      senderId,
      senderName,
      mode,
      packageDescription,
      packageWeight,
      packageCategory,
      declaredValue,
      pickupLocation,
      destination,
      scheduledPickup,
      scheduledDelivery,
      agreedPrice,
    } = body;

    if (!senderId || !senderName || !mode || !packageDescription || !pickupLocation || !destination) {
      return apiError('Missing required delivery fields', 400);
    }

    const now = new Date().toISOString();
    const newDelivery: Delivery = {
      id: `DLV-${Math.floor(10000 + Math.random() * 90000)}`,
      senderId,
      senderName,
      mode,
      packageDescription,
      packageCategory: packageCategory || 'General Merchandise',
      packageWeight: packageWeight || 2.0,
      packageImages: [],
      declaredValue: declaredValue || 5000000,
      agreedPrice: agreedPrice || 1500000,
      pickupLocation,
      destination,
      route: `${pickupLocation} → ${destination}`,
      scheduledPickup: scheduledPickup || now,
      scheduledDelivery: scheduledDelivery || now,
      status: 'request_created',
      paymentStatus: 'pending',
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          status: 'request_created',
          timestamp: now,
          actor: senderName,
          note: 'Delivery request initiated',
        },
      ],
    };

    const created = db.deliveries.create(newDelivery);

    db.auditLogs.create({
      id: `AUD-${Date.now()}`,
      adminId: 'SYSTEM',
      adminName: 'Dispatch System',
      action: 'delivery.created',
      targetType: 'Delivery',
      targetId: created.id,
      timestamp: now,
      newValue: created,
    });

    return apiSuccess(created, undefined, 201);
  } catch (error) {
    console.error('Error creating delivery:', error);
    return apiError('Failed to create delivery', 500);
  }
}
