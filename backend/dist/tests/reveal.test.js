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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const reveal_1 = __importDefault(require("../routes/reveal"));
// Mock PrismaClient
jest.mock('@prisma/client', () => {
    const mockBooking = {
        findUnique: jest.fn(),
    };
    return {
        PrismaClient: jest.fn(() => ({
            booking: mockBooking,
        })),
    };
});
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/reveal', reveal_1.default);
describe('POST /api/reveal', () => {
    let mockFindUnique;
    beforeEach(() => {
        const { PrismaClient } = require('@prisma/client');
        const prismaInstance = new PrismaClient();
        mockFindUnique = prismaInstance.booking.findUnique;
        mockFindUnique.mockClear(); // Clear mocks before each test
    });
    it('should return destination data for a valid bookingId', () => __awaiter(void 0, void 0, void 0, function* () {
        mockFindUnique.mockResolvedValueOnce({
            id: 'test_booking_id',
            // Add other booking properties as needed for the mock
        });
        const res = yield (0, supertest_1.default)(app)
            .post('/api/reveal')
            .send({
            bookingId: 'test_booking_id',
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty('destination');
        expect(res.body.destination.name).toBe('Kyoto, Japan');
    }));
    it('should return 400 if bookingId is missing', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post('/api/reveal')
            .send({});
        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Missing bookingId.');
    }));
    it('should return 404 if booking is not found', () => __awaiter(void 0, void 0, void 0, function* () {
        mockFindUnique.mockResolvedValueOnce(null);
        const res = yield (0, supertest_1.default)(app)
            .post('/api/reveal')
            .send({
            bookingId: 'non_existent_booking_id',
        });
        expect(res.statusCode).toEqual(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Booking not found.');
    }));
});
