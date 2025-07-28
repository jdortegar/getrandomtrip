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
const post_purchase_1 = __importDefault(require("../routes/post-purchase"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/post-purchase', post_purchase_1.default);
describe('POST /api/post-purchase', () => {
    it('should return success for a valid booking confirmation', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post('/api/post-purchase')
            .send({
            bookingId: 'test_booking_id',
            status: 'confirmed',
            paymentId: 'test_payment_id',
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Confirmation recorded successfully.');
    }));
    it('should return 400 if bookingId is missing', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post('/api/post-purchase')
            .send({
            status: 'confirmed',
            paymentId: 'test_payment_id',
        });
        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Missing required confirmation details.');
    }));
    it('should return 400 if status is missing', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post('/api/post-purchase')
            .send({
            bookingId: 'test_booking_id',
            paymentId: 'test_payment_id',
        });
        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Missing required confirmation details.');
    }));
    it('should return 400 if paymentId is missing', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post('/api/post-purchase')
            .send({
            bookingId: 'test_booking_id',
            status: 'confirmed',
        });
        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Missing required confirmation details.');
    }));
});
