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
const checkout_1 = __importDefault(require("../routes/checkout"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/checkout', checkout_1.default);
// Mock PrismaClient
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => ({
        booking: {
            create: jest.fn(() => Promise.resolve({ id: 'mock_booking_id' })),
            update: jest.fn(),
        },
    })),
}));
// Mock scheduleRevealEmail
jest.mock('../scheduler', () => ({
    scheduleRevealEmail: jest.fn(),
}));
describe('POST /api/checkout', () => {
    it('should create a Mercado Pago preference and a booking', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post('/api/checkout')
            .send({
            amount: 100,
            description: 'Test Trip',
            payerEmail: 'test@example.com',
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.preferenceId).toBe('mock_preference_id');
        expect(res.body.initPoint).toBe('mock_init_point');
        expect(res.body).toHaveProperty('bookingId');
    }));
    it('should return 400 if required fields are missing', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post('/api/checkout')
            .send({
            amount: 100,
            description: 'Test Trip',
        });
        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Missing required payment details: amount, description, or payerEmail.');
    }));
});
