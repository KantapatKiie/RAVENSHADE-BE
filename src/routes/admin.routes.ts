import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';

const router = Router();
const reservationController = new ReservationController();

router.get('/reservations', (req, res) => reservationController.getAllReservations(req, res));

export default router;
