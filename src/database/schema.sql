-- Ravenshade Restaurant Database Schema

-- Drop tables if exists (for clean migration)
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;

-- 1. Time Slots Table
CREATE TABLE time_slots (
    id SERIAL PRIMARY KEY,
    time_slot TIME NOT NULL UNIQUE,
    max_reservations INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Availability Table
CREATE TABLE availability (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_capacity INTEGER DEFAULT 60,
    available_capacity INTEGER DEFAULT 60,
    is_closed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Reservations Table
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    number_of_guests INTEGER NOT NULL CHECK (number_of_guests > 0),
    reservation_type VARCHAR(20) NOT NULL CHECK (reservation_type IN ('regular', 'group', 'private')),
    special_requests TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_guest_count CHECK (
        (reservation_type = 'regular' AND number_of_guests <= 8) OR
        (reservation_type = 'group' AND number_of_guests BETWEEN 8 AND 40) OR
        (reservation_type = 'private' AND number_of_guests BETWEEN 40 AND 60)
    )
);

-- Indexes for better query performance
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_availability_date ON availability(date);

-- Insert default time slots (6:00 PM - 11:00 PM, every hour)
INSERT INTO time_slots (time_slot, max_reservations) VALUES
    ('18:00:00', 10),
    ('19:00:00', 10),
    ('20:00:00', 10),
    ('21:00:00', 8),
    ('22:00:00', 8),
    ('23:00:00', 5);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON time_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some closed dates (fully booked)
INSERT INTO availability (date, available_capacity, is_closed, notes) VALUES
    ('2025-01-25', 0, TRUE, 'Fully booked'),
    ('2025-01-26', 0, TRUE, 'Fully booked'),
    ('2025-02-01', 0, TRUE, 'Fully booked'),
    ('2025-02-14', 0, TRUE, 'Valentine''s Day - Fully booked'),
    ('2025-02-15', 0, TRUE, 'Fully booked'),
    ('2025-02-28', 0, TRUE, 'Fully booked'),
    ('2025-03-08', 0, TRUE, 'Fully booked'),
    ('2025-03-15', 0, TRUE, 'Fully booked');
