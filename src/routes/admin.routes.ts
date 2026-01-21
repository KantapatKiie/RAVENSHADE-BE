import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { AvailabilityController } from '../controllers/availability.controller';

const router = Router();
const reservationController = new ReservationController();
const availabilityController = new AvailabilityController();

// Reservation routes
router.get('/reservations', (req, res) => reservationController.getAllReservations(req, res));
router.put('/reservations/:id/status', (req, res) => reservationController.updateReservationStatus(req, res));

// Availability routes
router.get('/availability', (req, res) => availabilityController.getAllAvailability(req, res));
router.post('/availability', (req, res) => availabilityController.setAvailability(req, res));
router.delete('/availability/:id', (req, res) => availabilityController.deleteAvailability(req, res));

export default router;
