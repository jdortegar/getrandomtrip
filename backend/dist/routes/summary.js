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
    // In a real application, you would receive the configuration data from the frontend
    // and calculate the actual pricing based on your business logic and database.
    const { experienceLevel, basicConfig, premiumFilters, addOns } = req.body;
    // Mock pricing calculation for now
    const basePrice = 1000; // Example base price
    const premiumFilterCost = premiumFilters.length * 50; // Example cost per filter
    const addOnsCost = addOns.length * 30 * basicConfig.travelers; // Example cost per add-on per traveler
    const totalPrice = basePrice + premiumFilterCost + addOnsCost;
    const summary = {
        experienceLevel,
        basicConfig,
        premiumFilters,
        addOns,
        basePrice,
        premiumFilterCost,
        addOnsCost,
        totalPrice,
    };
    res.status(200).json({ success: true, summary });
}));
exports.default = router;
