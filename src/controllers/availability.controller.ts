import { Request, Response } from 'express';
import pool from '../database/db';

export class AvailabilityController {
  // Check availability for a specific date
  async checkAvailability(req: Request, res: Response) {
    try {
      const { date } = req.params;

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }

      // Check if date is in the past
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return res.status(400).json({ 
          error: 'Cannot check availability for past dates',
          available: false 
        });
      }

      // Check availability table
      const result = await pool.query(
        'SELECT * FROM availability WHERE date = $1',
        [date]
      );

      if (result.rows.length > 0) {
        const availability = result.rows[0];
        return res.json({
          date,
          available: !availability.is_closed && availability.available_capacity > 0,
          available_capacity: availability.available_capacity,
          total_capacity: availability.total_capacity,
          is_closed: availability.is_closed,
          notes: availability.notes,
        });
      }

      // If no record exists, date is available (default capacity: 60)
      return res.json({
        date,
        available: true,
        available_capacity: 60,
        total_capacity: 60,
        is_closed: false,
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      res.status(500).json({ error: 'Failed to check availability' });
    }
  }

  // Get available time slots for a specific date
  async getTimeSlots(req: Request, res: Response) {
    try {
      const { date } = req.params;

      // Get all active time slots
      const slotsResult = await pool.query(
        'SELECT * FROM time_slots WHERE is_active = TRUE ORDER BY time_slot'
      );

      // Get reservations count for each time slot on the selected date
      const reservationsResult = await pool.query(
        `SELECT reservation_time, COUNT(*) as count 
         FROM reservations 
         WHERE reservation_date = $1 AND status != 'cancelled'
         GROUP BY reservation_time`,
        [date]
      );

      const reservationCounts = new Map(
        reservationsResult.rows.map(row => [row.reservation_time, parseInt(row.count)])
      );

      const timeSlots = slotsResult.rows.map(slot => ({
        time: slot.time_slot,
        max_reservations: slot.max_reservations,
        current_reservations: reservationCounts.get(slot.time_slot) || 0,
        available: (reservationCounts.get(slot.time_slot) || 0) < slot.max_reservations,
      }));

      res.json({ date, timeSlots });
    } catch (error) {
      console.error('Error getting time slots:', error);
      res.status(500).json({ error: 'Failed to get time slots' });
    }
  }
}
