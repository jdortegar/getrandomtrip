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
exports.listPremiumFilters = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const listPremiumFilters = () => __awaiter(void 0, void 0, void 0, function* () {
    // In a real application, you would fetch this from the database.
    // For now, we will use a mock list.
    const premiumFilters = [
        {
            id: 'transport_type',
            name: 'Preferred Transport Type',
            description: 'Choose your preferred mode of transport.',
            price: 0, // First filter is free
        },
        {
            id: 'experience_type',
            name: 'Specific Experience Type',
            description: 'Tailor your trip to a specific experience (e.g., adventure, relaxation).',
            price: 50,
        },
        {
            id: 'climate_preference',
            name: 'Climate Preference',
            description: 'Select your ideal climate (e.g., tropical, snowy, temperate).',
            price: 30,
        },
        {
            id: 'avoid_destinations',
            name: 'Avoid Specific Destinations',
            description: "Exclude places you've already visited or don't wish to go.",
            price: 20,
        },
    ];
    return premiumFilters;
});
exports.listPremiumFilters = listPremiumFilters;
