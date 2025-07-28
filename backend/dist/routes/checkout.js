"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mercadopago_1 = require("mercadopago");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const client = new mercadopago_1.MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});
// Placeholder for scheduleRevealEmail - this should be imported from scheduler.ts
const scheduleRevealEmail = (bookingId, tripDate) => {
    console.log(`Scheduling reveal email for booking ${bookingId} on ${tripDate.toISOString()}`);
    // Actual implementation will be in scheduler.ts
};
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { amount, description, payerEmail } = req.body;
    if (!amount || !description || !payerEmail) {
        return res.status(400).json({ success: false, message: 'Missing required payment details: amount, description, or payerEmail.' });
    }
    try {
        const preference = {
            items: [
                {
                    title: description,
                    unit_price: Number(amount),
                    quantity: 1,
                    id: '1234', // Placeholder ID, replace with actual product ID if available
                },
            ],
            payer: {
                email: payerEmail,
            },
            back_urls: {
                success: `${process.env.FRONTEND_URL}/post-purchase?status=success`,
                pending: `${process.env.FRONTEND_URL}/post-purchase?status=pending`,
                failure: `${process.env.FRONTEND_URL}/post-purchase?status=failure`,
            },
            auto_return: 'approved_on_success',
            notification_url: `${process.env.BACKEND_URL}/webhooks/mercadopago`, // This will be a separate webhook endpoint
        };
        const response = yield new mercadopago_1.Preference(client).create({
            body: preference
        });
        const { id, init_point } = response;
        // Persist the booking in the database
        const booking = yield prisma.booking.create({
            data: {
                userId: 'clx000000000000000000000', // Placeholder: Replace with actual user ID from authentication context
                travelType: 'Family', // Placeholder
                experienceLevel: 'Essenza', // Placeholder: Replace with actual level from frontend
                originCity: 'Placeholder City', // Placeholder
                startDate: new Date(), // Placeholder
                travelerCount: 1, // Placeholder
                basePrice: Number(amount), // Use amount as basePrice for now
                filtersCost: 0, // Placeholder
                addonsCost: 0, // Placeholder
                premiumFilters: [], // Placeholder: Replace with actual filters from frontend
                selectedAddons: [], // Placeholder: Replace with actual add-ons from frontend
                totalPrice: Number(amount), // Use amount as totalPrice for now
                status: 'PENDING', // Initial status
                mercadoPagoPreferenceId: id,
            },
        });
        // Schedule reveal email using the actual booking ID
        const mockTripDate = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
        scheduleRevealEmail(booking.id, mockTripDate);
        res.status(200).json({ success: true, message: 'Payment preference created.', preferenceId: id, initPoint: init_point, bookingId: booking.id });
    }
    catch (error) {
        console.error('Error creating Mercado Pago preference:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create payment preference.', error: error.message });
    }
}));
exports.default = router;
