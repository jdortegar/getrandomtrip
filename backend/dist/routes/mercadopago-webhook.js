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
const client_1 = require("@prisma/client"); // Import BookingStatus enum
const scheduler_1 = require("../scheduler"); // Import the scheduler
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const client = new mercadopago_1.MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, data } = req.body;
    if (type === 'payment') {
        const paymentId = data.id;
        try {
            const payment = yield new mercadopago_1.Payment(client).get({ id: Number(paymentId) });
            const status = payment.status;
            const externalReference = payment.external_reference; // This could be your booking ID
            console.log(`Mercado Pago Payment Notification: Payment ID ${paymentId}, Status: ${status}, External Reference: ${externalReference}`);
            let bookingStatus = client_1.BookingStatus.PENDING; // Initialize with a default enum value
            switch (status) {
                case 'approved':
                    bookingStatus = client_1.BookingStatus.CONFIRMED;
                    console.log('Payment approved!');
                    // In a real application, you would fetch the actual tripDate associated with the externalReference (bookingId)
                    // For now, using a placeholder date (e.g., 7 days from now)
                    const mockTripDate = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));
                    if (externalReference) {
                        (0, scheduler_1.scheduleRevealEmail)(externalReference, mockTripDate);
                    }
                    break;
                case 'pending':
                    bookingStatus = client_1.BookingStatus.PENDING;
                    console.log('Payment pending.');
                    break;
                case 'rejected':
                    bookingStatus = client_1.BookingStatus.CANCELLED;
                    console.log('Payment rejected.');
                    break;
                default:
                    bookingStatus = client_1.BookingStatus.PENDING; // Default to PENDING for unhandled statuses
                    console.log(`Unhandled payment status: ${status}`);
            }
            if (externalReference) {
                yield prisma.booking.updateMany({
                    where: { mercadoPagoPreferenceId: externalReference },
                    data: { status: bookingStatus },
                });
                console.log(`Booking with preference ID ${externalReference} status updated to ${bookingStatus}`);
            }
            else {
                console.warn('No externalReference found for payment. Cannot update booking status.');
            }
            res.status(200).send('Webhook received');
        }
        catch (error) {
            console.error('Error processing Mercado Pago webhook:', error.message);
            res.status(500).send('Error processing webhook');
        }
    }
    else {
        console.log(`Unhandled webhook type: ${type}`);
        res.status(200).send('Webhook received (unhandled type)');
    }
}));
exports.default = router;
