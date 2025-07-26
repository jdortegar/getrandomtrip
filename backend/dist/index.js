"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const checkout_1 = __importDefault(require("./routes/checkout"));
const post_purchase_1 = __importDefault(require("./routes/post-purchase"));
const reveal_1 = __importDefault(require("./routes/reveal"));
const mercadopago_webhook_1 = __importDefault(require("./routes/mercadopago-webhook"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Randomtrip Backend API');
});
app.use('/api/checkout', checkout_1.default);
app.use('/api/post-purchase', post_purchase_1.default);
app.use('/api/reveal', reveal_1.default);
app.use('/webhooks/mercadopago', mercadopago_webhook_1.default);
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
