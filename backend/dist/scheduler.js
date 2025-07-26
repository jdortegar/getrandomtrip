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
exports.scheduleRevealEmail = scheduleRevealEmail;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function scheduleRevealEmail(bookingId, tripDate) {
    return __awaiter(this, void 0, void 0, function* () {
        const emailSendTime = new Date(tripDate.getTime() - (48 * 60 * 60 * 1000)); // 48 hours before trip
        // In a real application, this would interact with a job queue (e.g., RabbitMQ, AWS SQS)
        // or a cron job scheduler to send the email at the specified time.
        // For now, we'll just log the scheduling.
        console.log(`Scheduling reveal email for booking ${bookingId} to be sent at ${emailSendTime.toISOString()}`);
        // Mocking the scheduling with a setTimeout for demonstration purposes.
        // In a production environment, this would be replaced by a robust scheduling mechanism.
        const now = new Date();
        const delay = emailSendTime.getTime() - now.getTime();
        if (delay > 0) {
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                console.log(`Sending reveal email for booking ${bookingId} now!`);
                // Here you would typically call an email service to send the email
                // For example: await sendEmail(bookingId, 'Your destination is revealed!');
                // Optionally, update the booking status in the database
                yield prisma.booking.update({
                    where: { id: bookingId },
                    data: { revealEmailSent: true },
                });
            }), delay);
        }
        else {
            console.warn(`Reveal email for booking ${bookingId} is scheduled in the past. Sending immediately.`);
            // Send immediately if the scheduled time is in the past
            // await sendEmail(bookingId, 'Your destination is revealed!');
            yield prisma.booking.update({
                where: { id: bookingId },
                data: { revealEmailSent: true },
            });
        }
    });
}
