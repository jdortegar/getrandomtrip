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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const checkout_1 = __importDefault(require("./routes/checkout"));
const post_purchase_1 = __importDefault(require("./routes/post-purchase"));
const reveal_1 = __importDefault(require("./routes/reveal"));
const mercadopago_webhook_1 = __importDefault(require("./routes/mercadopago-webhook"));
const summary_1 = __importDefault(require("./routes/summary"));
const premium_filters_1 = __importDefault(require("./routes/premium-filters"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)()); // Permite que el frontend se comunique con el backend
app.use(express_1.default.json()); // Permite al servidor entender JSON
// --- NUEVA RUTA POST para crear una reserva ---
app.post('/api/bookings', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Recibida solicitud para crear una nueva reserva...');
    try {
        // Para este primer paso, creamos una reserva con valores por defecto.
        // Más adelante, estos valores vendrán de la selección del usuario.
        // Nota: Necesitamos un `userId` válido. Por ahora, asumimos que existe un usuario de prueba.
        // Reemplaza "tu-id-de-usuario-de-prueba" con un ID real de tu tabla User.
        const newBooking = yield prisma.booking.create({
            data: {
                userId: 'reemplaza-con-un-id-de-usuario-real', // IMPORTANTE: Reemplazar con un ID de usuario real de tu base de datos
                status: 'PENDING',
                travelType: 'Couple',
                experienceLevel: 'Essenza',
                originCity: 'Desconocido',
                startDate: new Date(),
                travelerCount: 2,
                basePrice: 0, // Se calculará después
                filtersCost: 0,
                addonsCost: 0,
                totalPrice: 0,
            },
        });
        console.log('Nueva reserva creada con ID:', newBooking.id);
        res.status(201).json({ bookingId: newBooking.id });
    }
    catch (error) {
        console.error('Error al crear la reserva:', error);
        res.status(500).json({ error: 'No se pudo crear la reserva.' });
    }
}));
app.get('/', (req, res) => {
    res.send('Randomtrip Backend API');
});
app.use('/api/checkout', checkout_1.default);
app.use('/api/post-purchase', post_purchase_1.default);
app.use('/api/reveal', reveal_1.default);
app.use('/webhooks/mercadopago', mercadopago_webhook_1.default);
app.use('/api/summary', summary_1.default);
app.use('/api/premium-filters', premium_filters_1.default);
app.patch('/api/bookings/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // El body puede contener diferentes datos dependiendo del paso del flujo
    const { travelType, experienceLevel, basePrice, originCity, startDate, travelerCount, duration_nights, premiumFilters, filtersCost, selectedAddons, addonsCost, status } = req.body;
    try {
        const bookingToUpdate = yield prisma.booking.findUnique({ where: { id } });
        if (!bookingToUpdate) {
            return res.status(404).json({ error: "Reserva no encontrada." });
        }
        // Construimos el objeto de datos a actualizar dinámicamente
        const dataToUpdate = {};
        if (travelType)
            dataToUpdate.travelType = travelType;
        if (experienceLevel)
            dataToUpdate.experienceLevel = experienceLevel;
        if (basePrice)
            dataToUpdate.basePrice = basePrice;
        if (originCity)
            dataToUpdate.originCity = originCity;
        if (startDate)
            dataToUpdate.startDate = startDate;
        if (travelerCount)
            dataToUpdate.travelerCount = travelerCount;
        if (duration_nights)
            dataToUpdate.duration_nights = duration_nights; // Guardamos la duración
        if (premiumFilters)
            dataToUpdate.premiumFilters = premiumFilters;
        if (filtersCost)
            dataToUpdate.filtersCost = filtersCost;
        if (selectedAddons)
            dataToUpdate.selectedAddons = selectedAddons;
        if (addonsCost)
            dataToUpdate.addonsCost = addonsCost;
        if (status)
            dataToUpdate.status = status; // Para confirmar el pago
        // NEW LOGIC: If status is being confirmed, assign a destination
        if (status === 'CONFIRMED') {
            const destinations = ['Kyoto, Japan', 'Reykjavik, Iceland', 'Marrakech, Morocco', 'Lisbon, Portugal', 'Cusco, Peru'];
            const randomIndex = Math.floor(Math.random() * destinations.length);
            dataToUpdate.destination = destinations[randomIndex];
            console.log(`Destination assigned to booking ${id}: ${dataToUpdate.destination}`);
        }
        // Actualizamos el precio total si hay cambios en los costos
        let newTotalPrice = bookingToUpdate.totalPrice;
        if (basePrice)
            newTotalPrice = basePrice;
        if (filtersCost)
            newTotalPrice += filtersCost;
        if (addonsCost)
            newTotalPrice += addonsCost;
        dataToUpdate.totalPrice = newTotalPrice;
        const updatedBooking = yield prisma.booking.update({
            where: { id: id },
            data: dataToUpdate,
        });
        console.log(`Reserva ${id} actualizada.`);
        res.status(200).json(updatedBooking);
    }
    catch (error) {
        console.error(`Error al actualizar la reserva ${id}:`, error);
        res.status(500).json({ error: 'No se pudo actualizar la reserva.' });
    }
}));
// --- NUEVA RUTA GET para obtener una reserva por ID ---
app.get('/api/bookings/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const booking = yield prisma.booking.findUnique({
            where: { id: id },
        });
        if (booking) {
            res.status(200).json(booking);
        }
        else {
            res.status(404).json({ error: 'Reserva no encontrada.' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'No se pudo obtener la reserva.' });
    }
}));
// --- NUEVA RUTA GET para la REVELACIÓN ---
app.get('/api/bookings/:id/reveal', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const booking = yield prisma.booking.findUnique({ where: { id } });
        if (!booking || !booking.startDate || !booking.destination) {
            return res.status(404).json({ error: 'Reserva o destino no encontrado.' });
        }
        const revealDate = new Date(booking.startDate).getTime() - 48 * 60 * 60 * 1000;
        const now = new Date().getTime();
        if (now < revealDate) {
            return res.status(403).json({
                message: 'Aún no es tiempo de la revelación.',
                revealDate: new Date(revealDate).toISOString()
            });
        }
        res.status(200).json({ destination: booking.destination });
    }
    catch (error) {
        res.status(500).json({ error: 'No se pudo procesar la revelación.' });
    }
}));
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
