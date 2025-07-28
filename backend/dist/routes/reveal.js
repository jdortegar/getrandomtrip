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
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bookingId } = req.body;
    if (!bookingId) {
        return res.status(400).json({ success: false, message: 'Missing bookingId.' });
    }
    try {
        const booking = yield prisma.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        // In a real application, the destination would be determined based on the booking details.
        // For now, we'll return a mock destination based on the booking ID.
        const mockDestination = {
            name: 'Kyoto, Japan',
            image: '/images/kyoto.jpg',
            description: 'Discover ancient temples, beautiful gardens, and traditional geisha districts.',
            itinerary: [
                'Day 1: Arrive in Kyoto, check into ryokan, explore Gion district.',
                'Day 2: Visit Fushimi Inari Shrine and Arashiyama Bamboo Grove.',
                'Day 3: Explore Kinkaku-ji (Golden Pavilion) and Ryoan-ji (Zen garden).',
                'Day 4: Day trip to Nara to see Todai-ji Temple and deer park.',
            ],
        };
        res.status(200).json({ success: true, destination: mockDestination });
    }
    catch (error) {
        console.error('Error revealing destination:', error.message);
        res.status(500).json({ success: false, message: 'Failed to reveal destination.', error: error.message });
    }
}));
exports.default = router;
