import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';

const router = Router();
const reservationController = new ReservationController();

router.post('/', (req, res) => reservationController.createReservation(req, res));
router.get('/:id', (req, res) => reservationController.getReservation(req, res));
router.put('/:id/cancel', (req, res) => reservationController.cancelReservation(req, res));

export default router;
