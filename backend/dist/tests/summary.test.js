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
const summary_1 = __importDefault(require("../routes/summary"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/summary', summary_1.default);
describe('POST /api/summary', () => {
    it('should return a trip summary with calculated prices', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockConfig = {
            experienceLevel: 'Explora+',
            basicConfig: {
                originCity: 'Buenos Aires',
                travelDate: '2025-08-15',
                nights: 7,
                travelers: 2,
                accommodationType: 'hotel',
                transportationType: 'flights',
            },
            premiumFilters: ['filter1', 'filter2'],
            addOns: ['addon1', 'addon2'],
        };
        const res = yield (0, supertest_1.default)(app)
            .post('/api/summary')
            .send(mockConfig);
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty('summary');
        expect(res.body.summary.experienceLevel).toBe(mockConfig.experienceLevel);
        expect(res.body.summary.basicConfig).toEqual(mockConfig.basicConfig);
        expect(res.body.summary.premiumFilters).toEqual(mockConfig.premiumFilters);
        expect(res.body.summary.addOns).toEqual(mockConfig.addOns);
        expect(res.body.summary).toHaveProperty('basePrice');
        expect(res.body.summary).toHaveProperty('premiumFilterCost');
        expect(res.body.summary).toHaveProperty('addOnsCost');
        expect(res.body.summary).toHaveProperty('totalPrice');
    }));
    it('should return a trip summary with zero costs if no filters or add-ons', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockConfig = {
            experienceLevel: 'Explora+',
            basicConfig: {
                originCity: 'Buenos Aires',
                travelDate: '2025-08-15',
                nights: 7,
                travelers: 1,
                accommodationType: 'hotel',
                transportationType: 'flights',
            },
            premiumFilters: [],
            addOns: [],
        };
        const res = yield (0, supertest_1.default)(app)
            .post('/api/summary')
            .send(mockConfig);
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.summary.premiumFilterCost).toBe(0);
        expect(res.body.summary.addOnsCost).toBe(0);
    }));
});
