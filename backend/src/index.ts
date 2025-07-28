import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import checkoutRoutes from './routes/checkout';
import postPurchaseRoutes from './routes/post-purchase';
import revealRoutes from './routes/reveal';
import mercadopagoWebhookRoutes from './routes/mercadopago-webhook';
import summaryRoutes from './routes/summary';
import premiumFiltersRoutes from './routes/premium-filters';
import axios from 'axios'

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors()); // Permite que el frontend se comunique con el backend
app.use(express.json()); // Permite al servidor entender JSON

// --- NUEVA RUTA POST para crear una reserva ---
app.post('/api/bookings', async (req, res) => {
  console.log('Recibida solicitud para crear una nueva reserva...');
  
  try {
    // Para este primer paso, creamos una reserva con valores por defecto.
    // Más adelante, estos valores vendrán de la selección del usuario.
    // Nota: Necesitamos un `userId` válido. Por ahora, asumimos que existe un usuario de prueba.
    // Reemplaza "tu-id-de-usuario-de-prueba" con un ID real de tu tabla User.
    const newBooking = await prisma.booking.create({
      data: {
        userId: 'bea7c6e8-98e5-4940-bdbc-5f5fc8f13992', // IMPORTANTE: Reemplazar con un ID de usuario real de tu base de datos
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
  } catch (error) {
    console.error('Error al crear la reserva:', error);
    res.status(500).json({ error: 'No se pudo crear la reserva.' });
  }
});

app.get('/', (req, res) => {
  res.send('Randomtrip Backend API');
});

app.use('/api/checkout', checkoutRoutes);
app.use('/api/post-purchase', postPurchaseRoutes);
app.use('/api/reveal', revealRoutes);
app.use('/webhooks/mercadopago', mercadopagoWebhookRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/premium-filters', premiumFiltersRoutes);

app.patch('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  // El body puede contener diferentes datos dependiendo del paso del flujo
  const { travelType, experienceLevel, basePrice, originCity, startDate, travelerCount, duration_nights, premiumFilters, filtersCost, selectedAddons, addonsCost, status } = req.body;

  try {
    const bookingToUpdate = await prisma.booking.findUnique({ where: { id } });
    if (!bookingToUpdate) {
      return res.status(404).json({ error: "Reserva no encontrada." });
    }

    // Construimos el objeto de datos a actualizar dinámicamente
    const dataToUpdate: any = {};
    if (travelType) dataToUpdate.travelType = travelType;
    if (experienceLevel) dataToUpdate.experienceLevel = experienceLevel;
    if (basePrice) dataToUpdate.basePrice = basePrice;
    if (originCity) dataToUpdate.originCity = originCity;
    if (startDate) dataToUpdate.startDate = startDate;
    if (travelerCount) dataToUpdate.travelerCount = travelerCount;
    if (duration_nights) dataToUpdate.duration_nights = duration_nights; // Guardamos la duración
    if (premiumFilters) dataToUpdate.premiumFilters = premiumFilters;
    if (filtersCost) dataToUpdate.filtersCost = filtersCost;
    if (selectedAddons) dataToUpdate.selectedAddons = selectedAddons;
    if (addonsCost) dataToUpdate.addonsCost = addonsCost;
    if (status) dataToUpdate.status = status; // Para confirmar el pago

    // NEW LOGIC: If status is being confirmed, assign a destination
    if (status === 'CONFIRMED') {
        const destinations = ['Kyoto, Japan', 'Reykjavik, Iceland', 'Marrakech, Morocco', 'Lisbon, Portugal', 'Cusco, Peru'];
        const randomIndex = Math.floor(Math.random() * destinations.length);
        dataToUpdate.destination = destinations[randomIndex];
        console.log(`Destination assigned to booking ${id}: ${dataToUpdate.destination}`);
    }

    // Actualizamos el precio total si hay cambios en los costos
    let newTotalPrice = bookingToUpdate.totalPrice;
    if (basePrice) newTotalPrice = basePrice;
    if (filtersCost) newTotalPrice += filtersCost;
    if (addonsCost) newTotalPrice += addonsCost;
    dataToUpdate.totalPrice = newTotalPrice;
    
    const updatedBooking = await prisma.booking.update({
      where: { id: id },
      data: dataToUpdate,
    });
    
    console.log(`Reserva ${id} actualizada.`);
    res.status(200).json(updatedBooking);

  } catch (error) {
    console.error(`Error al actualizar la reserva ${id}:`, error);
    res.status(500).json({ error: 'No se pudo actualizar la reserva.' });
  }
});

// --- NUEVA RUTA GET para obtener una reserva por ID ---
app.get('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: id },
    });
    if (booking) {
      res.status(200).json(booking);
    } else {
      res.status(404).json({ error: 'Reserva no encontrada.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'No se pudo obtener la reserva.' });
  }
});

// --- NUEVA RUTA GET para la REVELACIÓN ---
app.get('/api/bookings/:id/reveal', async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking || !booking.startDate || !(booking as any).destination) {
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
    
    res.status(200).json({ destination: (booking as any).destination });

  } catch (error) {
    res.status(500).json({ error: 'No se pudo procesar la revelación.' });
  }
});

import { createClient } from 'pexels';

// This line can go near the top with your other imports
const pexelsClient = createClient(process.env.PEXELS_API_KEY || '');

// Add this new route before the app.listen call
app.get('/api/images/:query', async (req, res) => {
  const { query } = req.params;
  try {
    const response = await pexelsClient.photos.search({ query, per_page: 10, orientation: 'portrait' });
    if ('photos' in response && response.photos.length > 0) {
      const randomIndex = Math.floor(Math.random() * response.photos.length);
      res.json({ imageUrl: response.photos[randomIndex].src.large });
    } else {
      // Fallback image if Pexels finds nothing
      res.json({ imageUrl: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b' });
    }
  } catch (error) {
    console.error("Pexels API error:", error);
    res.status(500).json({ error: 'Failed to fetch image.' });
  }
});

// --- NEW ROUTE for Ticketmaster Event Search ---
// Replace the existing /api/events route with this
app.get('/api/events', async (req, res) => {
  const { keyword, city, startDate, endDate } = req.query;

  try {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    
    // Build parameters for Ticketmaster API
    const params: any = {
      apikey: apiKey,
      size: 5,
    };
    if (keyword) params.keyword = keyword as string;
    if (city) params.city = city as string;
    // Add date parameters if they exist
    if (startDate) params.startDateTime = `${startDate}T00:00:00Z`;
    if (endDate) params.endDateTime = `${endDate}T23:59:59Z`;

    const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { params });
    
    const events = response.data._embedded?.events.map((event: any) => ({
      id: event.id,
      name: event.name,
      url: event.url,
      date: event.dates.start.localDate,
      venue: event._embedded?.venues[0]?.name || 'Venue not specified',
      image: event.images.find((img: any) => img.ratio === '16_9')?.url || event.images[0]?.url // Prefer 16:9 ratio for consistency
    }));

    res.json({ events: events || [] });

  } catch (error) {
    console.error('Ticketmaster API error:', error);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
