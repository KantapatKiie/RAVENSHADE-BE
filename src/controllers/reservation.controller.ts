import { Request, Response } from 'express';
import pool from '../database/db';
import { createReservationSchema } from '../validators/reservation.validator';
import { z } from 'zod';

export class ReservationController {
  // Create a new reservation
  async createReservation(req: Request, res: Response) {
    const client = await pool.connect();
    
    try {
      // Validate input
      const validatedData = createReservationSchema.parse(req.body);

      // Check if date is available
      const availabilityCheck = await client.query(
        'SELECT * FROM availability WHERE date = $1 AND is_closed = TRUE',
        [validatedData.reservation_date]
      );

      if (availabilityCheck.rows.length > 0) {
        return res.status(400).json({ 
          error: 'This date is not available for reservations' 
        });
      }

      // Check for existing private or group reservations
      const existingReservations = await client.query(
        `SELECT reservation_type FROM reservations 
         WHERE reservation_date = $1 
         AND status != 'cancelled'`,
        [validatedData.reservation_date]
      );

      // If there's a private or group booking, block all other reservations
      const hasPrivateOrGroup = existingReservations.rows.some(
        row => row.reservation_type === 'private' || row.reservation_type === 'group'
      );

      if (hasPrivateOrGroup) {
        return res.status(400).json({ 
          error: 'This date is already booked for a private or group event' 
        });
      }

      // If trying to book private/group and there are existing reservations
      if ((validatedData.reservation_type === 'private' || validatedData.reservation_type === 'group') 
          && existingReservations.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot book private/group event on a date with existing reservations' 
        });
      }

      // Begin transaction
      await client.query('BEGIN');

      // Insert reservation
      const result = await client.query(
        `INSERT INTO reservations 
        (name, phone, email, reservation_date, reservation_time, number_of_guests, reservation_type, special_requests, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
        RETURNING *`,
        [
          validatedData.name,
          validatedData.phone,
          validatedData.email || null,
          validatedData.reservation_date,
          validatedData.reservation_time,
          validatedData.number_of_guests,
          validatedData.reservation_type,
          validatedData.special_requests || null,
        ]
      );

      // Update or create availability record
      await client.query(
        `INSERT INTO availability (date, available_capacity)
         VALUES ($1, $2)
         ON CONFLICT (date) 
         DO UPDATE SET available_capacity = availability.available_capacity - $3`,
        [validatedData.reservation_date, 60 - validatedData.number_of_guests, validatedData.number_of_guests]
      );

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Reservation created successfully',
        reservation: result.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }

      console.error('Error creating reservation:', error);
      res.status(500).json({ error: 'Failed to create reservation' });
    } finally {
      client.release();
    }
  }

  // Get reservation by ID
  async getReservation(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'SELECT * FROM reservations WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting reservation:', error);
      res.status(500).json({ error: 'Failed to get reservation' });
    }
  }

  // Cancel reservation
  async cancelReservation(req: Request, res: Response) {
    const client = await pool.connect();

    try {
      const { id } = req.params;

      await client.query('BEGIN');

      // Get reservation details
      const reservationResult = await client.query(
        'SELECT * FROM reservations WHERE id = $1 AND status != $2',
        [id, 'cancelled']
      );

      if (reservationResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Reservation not found or already cancelled' });
      }

      const reservation = reservationResult.rows[0];

      // Update reservation status
      await client.query(
        'UPDATE reservations SET status = $1 WHERE id = $2',
        ['cancelled', id]
      );

      // Update availability
      await client.query(
        `UPDATE availability 
         SET available_capacity = available_capacity + $1
         WHERE date = $2`,
        [reservation.number_of_guests, reservation.reservation_date]
      );

      await client.query('COMMIT');

      res.json({ message: 'Reservation cancelled successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error cancelling reservation:', error);
      res.status(500).json({ error: 'Failed to cancel reservation' });
    } finally {
      client.release();
    }
  }

  // Get all reservations (Admin)
  async getAllReservations(req: Request, res: Response) {
    try {
      const { status, date, limit = 50, offset = 0 } = req.query;

      let query = 'SELECT * FROM reservations WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (status) {
        query += ` AND status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      if (date) {
        query += ` AND reservation_date = $${paramCount}`;
        params.push(date);
        paramCount++;
      }

      query += ` ORDER BY reservation_date DESC, reservation_time DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      res.json({
        reservations: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error('Error getting reservations:', error);
      res.status(500).json({ error: 'Failed to get reservations' });
    }
  }

  // Update reservation status (Admin)
  async updateReservationStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status
      if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const result = await pool.query(
        'UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating reservation status:', error);
      res.status(500).json({ error: 'Failed to update reservation status' });
    }
  }
}
