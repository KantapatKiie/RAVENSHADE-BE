import { Router } from 'express';
import { AvailabilityController } from '../controllers/availability.controller';

const router = Router();
const availabilityController = new AvailabilityController();

router.get('/:date', (req, res) => availabilityController.checkAvailability(req, res));
router.get('/:date/timeslots', (req, res) => availabilityController.getTimeSlots(req, res));

export default router;
