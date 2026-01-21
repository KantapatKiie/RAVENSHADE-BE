# Ravenshade Restaurant Backend API

Backend API สำหรับระบบจองโต๊ะร้านอาหาร Ravenshade

## Database Schema

### Tables

#### 1. reservations
ตารางหลักสำหรับเก็บข้อมูลการจอง

```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100) NOT NULL - ชื่อผู้จอง
- phone: VARCHAR(20) NOT NULL - เบอร์โทรศัพท์
- email: VARCHAR(100) - อีเมล (optional)
- reservation_date: DATE NOT NULL - วันที่จอง
- reservation_time: TIME NOT NULL - เวลาที่จอง
- number_of_guests: INTEGER NOT NULL - จำนวนผู้เข้าใช้บริการ
- reservation_type: VARCHAR(20) NOT NULL - ประเภทการจอง (regular, group, private)
- special_requests: TEXT - คำขอพิเศษ
- status: VARCHAR(20) DEFAULT 'pending' - สถานะ (pending, confirmed, cancelled, completed)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()
```

#### 2. availability
ตารางสำหรับจัดการความพร้อมของร้าน

```sql
- id: SERIAL PRIMARY KEY
- date: DATE NOT NULL UNIQUE
- total_capacity: INTEGER DEFAULT 60 - ความจุทั้งหมด
- available_capacity: INTEGER - ความจุที่เหลือ
- is_closed: BOOLEAN DEFAULT FALSE - ปิดทำการ
- notes: TEXT
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()
```

#### 3. time_slots
ตารางช่วงเวลาที่เปิดให้จอง

```sql
- id: SERIAL PRIMARY KEY
- time_slot: TIME NOT NULL - เวลา (18:00, 19:00, 20:00, etc.)
- max_reservations: INTEGER DEFAULT 10 - จำนวนการจองสูงสุดต่อช่วงเวลา
- is_active: BOOLEAN DEFAULT TRUE
```

## API Endpoints

### 1. Check Availability
`GET /api/availability/:date`
- ตรวจสอบความพร้อมของวันที่

### 2. Get Available Time Slots
`GET /api/timeslots/:date`
- ดูช่วงเวลาที่ว่างในวันที่เลือก

### 3. Create Reservation
`POST /api/reservations`
- สร้างการจองใหม่

### 4. Get Reservation
`GET /api/reservations/:id`
- ดูรายละเอียดการจอง

### 5. Cancel Reservation
`PUT /api/reservations/:id/cancel`
- ยกเลิกการจอง

### 6. Get All Reservations (Admin)
`GET /api/admin/reservations`
- ดูการจองทั้งหมด (สำหรับ admin)

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Setup database
npm run db:migrate

# Run development server
npm run dev

# Build for production
npm run build

# Run production
npm start
```

## Environment Variables

See `.env.example` for required environment variables.

## Database Setup

1. Install PostgreSQL
2. Create database: `CREATE DATABASE ravenshade_db;`
3. Run migration: `npm run db:migrate`
