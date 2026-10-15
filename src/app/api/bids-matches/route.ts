import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { Offer, Match, TripDeclaration } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const trips = db.trips.findMany();
    const offers = db.offers.findMany();
    const matches = db.matches.findMany();

    if (type === 'trips') return apiSuccess(trips);
    if (type === 'offers') return apiSuccess(offers);
    if (type === 'matches') return apiSuccess(matches);

    return apiSuccess({
      trips,
      offers,
      matches,
    });
  } catch (error) {
    console.error('Error fetching bids and matches:', error);
    return apiError('Failed to fetch marketplace bids and matches', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, offerId, deliveryId, adminName, adminId, trip, offer } = body;
    const actor = adminName || 'Admin System';
    const now = new Date().toISOString();

    if (action === 'accept_offer') {
      if (!offerId) return apiError('Offer ID is required', 400);

      const targetOffer = db.offers.findMany().find((o) => o.id === offerId);
      if (!targetOffer) return apiError(`Offer not found: ${offerId}`, 404);

      // Update offer status
      db.offers.update(offerId, { status: 'accepted' });

      // Create Match
      const newMatch: Match = {
        id: `MTC-${Math.floor(10000 + Math.random() * 90000)}`,
        deliveryId: targetOffer.deliveryId || deliveryId || 'DLV-GEN',
        senderId: targetOffer.senderId || 'RCV-SENDER',
        senderName: targetOffer.senderName || 'Sender',
        providerId: targetOffer.travellerId || 'RCV-TRV',
        providerName: targetOffer.travellerName || 'Traveller',
        providerType: 'traveller',
        agreedPrice: targetOffer.price,
        status: 'confirmed',
        matchedAt: now,
        route: 'Active Route',
      };
      const createdMatch = db.matches.create(newMatch);

      // If delivery exists, update delivery status to matched
      if (targetOffer.deliveryId) {
        db.deliveries.update(targetOffer.deliveryId, {
          status: 'matched',
          agreedPrice: targetOffer.price,
          travellerId: targetOffer.travellerId,
          travellerName: targetOffer.travellerName,
          statusHistory: [
            ...(db.deliveries.findById(targetOffer.deliveryId)?.statusHistory || []),
            {
              status: 'matched',
              timestamp: now,
              actor,
              note: `Offer ${offerId} accepted at ₦${(targetOffer.price / 100).toLocaleString()}. Matched with ${targetOffer.travellerName}.`,
            },
          ],
        });
      }

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: actor,
        action: 'marketplace.offer_accepted',
        targetType: 'Offer',
        targetId: offerId,
        timestamp: now,
        newValue: { offerId, matchId: createdMatch.id },
      });

      return apiSuccess({ offer: targetOffer, match: createdMatch });
    }

    if (action === 'reject_offer') {
      if (!offerId) return apiError('Offer ID is required', 400);
      const updated = db.offers.update(offerId, { status: 'rejected' });
      if (!updated) return apiError('Offer not found', 404);

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: actor,
        action: 'marketplace.offer_rejected',
        targetType: 'Offer',
        targetId: offerId,
        timestamp: now,
        newValue: { status: 'rejected' },
      });

      return apiSuccess(updated);
    }

    if (action === 'create_trip') {
      if (!trip || !trip.travellerId || !trip.origin || !trip.destination) {
        return apiError('Missing required trip fields', 400);
      }
      const newTrip: TripDeclaration = {
        id: `TRP-${Math.floor(10000 + Math.random() * 90000)}`,
        travellerId: trip.travellerId,
        travellerName: trip.travellerName || 'Traveller',
        origin: trip.origin,
        destination: trip.destination,
        travelDate: trip.travelDate || now,
        availableCapacity: trip.availableCapacity || '10 kg',
        meetupPoint: trip.meetupPoint || 'Airport Departure Lounge',
        status: 'active',
        createdAt: now,
      };
      const createdTrip = db.trips.create(newTrip);
      return apiSuccess(createdTrip, undefined, 201);
    }

    if (action === 'create_offer') {
      if (!offer || !offer.price) {
        return apiError('Missing required offer fields', 400);
      }
      const newOffer: Offer = {
        id: `OFF-${Math.floor(10000 + Math.random() * 90000)}`,
        type: offer.type || 'traveller_bid',
        deliveryId: offer.deliveryId,
        tripId: offer.tripId,
        senderId: offer.senderId,
        senderName: offer.senderName,
        travellerId: offer.travellerId,
        travellerName: offer.travellerName,
        price: offer.price,
        message: offer.message || '',
        status: 'pending',
        createdAt: now,
        expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
      };
      const createdOffer = db.offers.create(newOffer);
      return apiSuccess(createdOffer, undefined, 201);
    }

    if (action === 'boost_request') {
      if (!deliveryId) return apiError('Delivery ID is required', 400);
      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: actor,
        action: 'delivery.boosted',
        targetType: 'Delivery',
        targetId: deliveryId,
        timestamp: now,
      });
      return apiSuccess({ deliveryId, boosted: true });
    }

    return apiError('Unrecognized bids-matches action', 400);
  } catch (error) {
    console.error('Error processing marketplace action:', error);
    return apiError('Failed to process marketplace action', 500);
  }
}
