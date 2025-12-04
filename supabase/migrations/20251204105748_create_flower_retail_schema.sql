/*
  # Flower Retail Management System Database Schema

  ## Overview
  Complete database schema for a flower retail management application used by retailers
  to manage daily flower supplies from farmers, sales to customers, pricing, and payments.

  ## 1. New Tables

  ### `retailers`
  - `id` (uuid, primary key) - Links to auth.users
  - `phone` (text, unique) - Retailer phone number
  - `name` (text) - Retailer name
  - `shop_name` (text) - Shop name
  - `location` (text) - Shop location
  - `whatsapp_enabled` (boolean) - WhatsApp integration status
  - `sms_enabled` (boolean) - SMS integration status
  - `created_at` (timestamptz) - Account creation timestamp

  ### `farmers`
  - `id` (uuid, primary key) - Unique farmer ID
  - `retailer_id` (uuid, foreign key) - Links to retailers
  - `name` (text) - Farmer name
  - `phone` (text) - Farmer phone number
  - `farmer_code` (text) - Unique farmer code/ID
  - `photo_url` (text, optional) - Farmer photo
  - `outstanding_amount` (decimal) - Current outstanding amount
  - `last_payment_date` (date) - Last payment date
  - `created_at` (timestamptz)

  ### `customers`
  - `id` (uuid, primary key) - Unique customer ID
  - `retailer_id` (uuid, foreign key) - Links to retailers
  - `name` (text) - Customer name
  - `phone` (text) - Customer phone number
  - `customer_code` (text) - Unique customer code
  - `payment_type` (text) - 'daily' or 'on_demand'
  - `pending_dues` (decimal) - Current pending dues
  - `last_purchase_date` (date) - Last purchase date
  - `created_at` (timestamptz)

  ### `flower_types`
  - `id` (uuid, primary key)
  - `retailer_id` (uuid, foreign key)
  - `name` (text) - Flower name (Jasmine, Rose, Marigold, Others)
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz)

  ### `daily_supplies`
  - `id` (uuid, primary key)
  - `retailer_id` (uuid, foreign key)
  - `farmer_id` (uuid, foreign key)
  - `flower_type_id` (uuid, foreign key)
  - `quantity` (decimal) - Quantity in kg
  - `supply_date` (date) - Date of supply
  - `notes` (text, optional) - Additional notes
  - `notification_sent` (boolean) - Notification status
  - `created_at` (timestamptz)

  ### `flower_prices`
  - `id` (uuid, primary key)
  - `retailer_id` (uuid, foreign key)
  - `flower_type_id` (uuid, foreign key)
  - `price_date` (date) - Date for prices
  - `morning_price` (decimal) - Morning price per kg
  - `afternoon_price` (decimal) - Afternoon price per kg
  - `evening_price` (decimal) - Evening price per kg
  - `created_at` (timestamptz)

  ### `customer_purchases`
  - `id` (uuid, primary key)
  - `retailer_id` (uuid, foreign key)
  - `customer_id` (uuid, foreign key)
  - `flower_type_id` (uuid, foreign key)
  - `quantity` (decimal) - Quantity purchased
  - `price_per_kg` (decimal) - Price at time of purchase
  - `total_amount` (decimal) - Total purchase amount
  - `purchase_date` (date) - Date of purchase
  - `time_slot` (text) - 'morning', 'afternoon', or 'evening'
  - `payment_status` (text) - 'pending', 'paid', 'partial'
  - `created_at` (timestamptz)

  ### `farmer_payments`
  - `id` (uuid, primary key)
  - `retailer_id` (uuid, foreign key)
  - `farmer_id` (uuid, foreign key)
  - `amount` (decimal) - Payment amount
  - `payment_date` (date) - Date of payment
  - `payment_cycle_start` (date) - 15-day cycle start date
  - `payment_cycle_end` (date) - 15-day cycle end date
  - `payment_method` (text) - Payment method
  - `status` (text) - 'pending', 'completed'
  - `slip_generated` (boolean) - Payment slip status
  - `created_at` (timestamptz)

  ### `customer_payments`
  - `id` (uuid, primary key)
  - `retailer_id` (uuid, foreign key)
  - `customer_id` (uuid, foreign key)
  - `amount` (decimal) - Payment amount
  - `payment_date` (date) - Date of payment
  - `payment_method` (text) - Payment method
  - `status` (text) - 'pending', 'completed'
  - `invoice_sent` (boolean) - Invoice sent status
  - `created_at` (timestamptz)

  ### `notifications`
  - `id` (uuid, primary key)
  - `retailer_id` (uuid, foreign key)
  - `recipient_type` (text) - 'farmer', 'customer', 'system'
  - `recipient_id` (uuid, optional) - Farmer or customer ID
  - `title` (text) - Notification title
  - `message` (text) - Notification content
  - `is_read` (boolean) - Read status
  - `created_at` (timestamptz)

  ### `sms_whatsapp_logs`
  - `id` (uuid, primary key)
  - `retailer_id` (uuid, foreign key)
  - `recipient_type` (text) - 'farmer' or 'customer'
  - `recipient_id` (uuid) - Farmer or customer ID
  - `phone_number` (text) - Recipient phone
  - `message_type` (text) - 'sms' or 'whatsapp'
  - `message_content` (text) - Message sent
  - `delivery_status` (text) - 'sent', 'delivered', 'failed'
  - `sent_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Add policies for authenticated retailers to access only their data
  - Restrict access based on retailer_id
*/

-- Create retailers table
CREATE TABLE IF NOT EXISTS retailers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE NOT NULL,
  name text NOT NULL,
  shop_name text NOT NULL,
  location text NOT NULL,
  whatsapp_enabled boolean DEFAULT false,
  sms_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create farmers table
CREATE TABLE IF NOT EXISTS farmers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  farmer_code text NOT NULL,
  photo_url text,
  outstanding_amount decimal(10,2) DEFAULT 0,
  last_payment_date date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(retailer_id, farmer_code)
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  customer_code text NOT NULL,
  payment_type text DEFAULT 'daily' CHECK (payment_type IN ('daily', 'on_demand')),
  pending_dues decimal(10,2) DEFAULT 0,
  last_purchase_date date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(retailer_id, customer_code)
);

-- Create flower_types table
CREATE TABLE IF NOT EXISTS flower_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(retailer_id, name)
);

-- Create daily_supplies table
CREATE TABLE IF NOT EXISTS daily_supplies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  flower_type_id uuid NOT NULL REFERENCES flower_types(id) ON DELETE CASCADE,
  quantity decimal(10,2) NOT NULL,
  supply_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  notification_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create flower_prices table
CREATE TABLE IF NOT EXISTS flower_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  flower_type_id uuid NOT NULL REFERENCES flower_types(id) ON DELETE CASCADE,
  price_date date NOT NULL DEFAULT CURRENT_DATE,
  morning_price decimal(10,2) DEFAULT 0,
  afternoon_price decimal(10,2) DEFAULT 0,
  evening_price decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(retailer_id, flower_type_id, price_date)
);

-- Create customer_purchases table
CREATE TABLE IF NOT EXISTS customer_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  flower_type_id uuid NOT NULL REFERENCES flower_types(id) ON DELETE CASCADE,
  quantity decimal(10,2) NOT NULL,
  price_per_kg decimal(10,2) NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  time_slot text CHECK (time_slot IN ('morning', 'afternoon', 'evening')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial')),
  created_at timestamptz DEFAULT now()
);

-- Create farmer_payments table
CREATE TABLE IF NOT EXISTS farmer_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_cycle_start date NOT NULL,
  payment_cycle_end date NOT NULL,
  payment_method text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  slip_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create customer_payments table
CREATE TABLE IF NOT EXISTS customer_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  invoice_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  recipient_type text NOT NULL CHECK (recipient_type IN ('farmer', 'customer', 'system')),
  recipient_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create sms_whatsapp_logs table
CREATE TABLE IF NOT EXISTS sms_whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  recipient_type text NOT NULL CHECK (recipient_type IN ('farmer', 'customer')),
  recipient_id uuid NOT NULL,
  phone_number text NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('sms', 'whatsapp')),
  message_content text NOT NULL,
  delivery_status text DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'failed')),
  sent_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flower_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE flower_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for retailers table
CREATE POLICY "Users can view own retailer profile"
  ON retailers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own retailer profile"
  ON retailers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own retailer profile"
  ON retailers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for farmers table
CREATE POLICY "Retailers can view own farmers"
  ON farmers FOR SELECT
  TO authenticated
  USING (retailer_id = auth.uid());

CREATE POLICY "Retailers can insert own farmers"
  ON farmers FOR INSERT
  TO authenticated
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can update own farmers"
  ON farmers FOR UPDATE
  TO authenticated
  USING (retailer_id = auth.uid())
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can delete own farmers"
  ON farmers FOR DELETE
  TO authenticated
  USING (retailer_id = auth.uid());

-- RLS Policies for customers table
CREATE POLICY "Retailers can view own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (retailer_id = auth.uid());

CREATE POLICY "Retailers can insert own customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can update own customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (retailer_id = auth.uid())
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can delete own customers"
  ON customers FOR DELETE
  TO authenticated
  USING (retailer_id = auth.uid());

-- RLS Policies for flower_types table
CREATE POLICY "Retailers can view own flower types"
  ON flower_types FOR SELECT
  TO authenticated
  USING (retailer_id = auth.uid());

CREATE POLICY "Retailers can insert own flower types"
  ON flower_types FOR INSERT
  TO authenticated
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can update own flower types"
  ON flower_types FOR UPDATE
  TO authenticated
  USING (retailer_id = auth.uid())
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can delete own flower types"
  ON flower_types FOR DELETE
  TO authenticated
  USING (retailer_id = auth.uid());

-- RLS Policies for daily_supplies table
CREATE POLICY "Retailers can view own supplies"
  ON daily_supplies FOR SELECT
  TO authenticated
  USING (retailer_id = auth.uid());

CREATE POLICY "Retailers can insert own supplies"
  ON daily_supplies FOR INSERT
  TO authenticated
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can update own supplies"
  ON daily_supplies FOR UPDATE
  TO authenticated
  USING (retailer_id = auth.uid())
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can delete own supplies"
  ON daily_supplies FOR DELETE
  TO authenticated
  USING (retailer_id = auth.uid());

-- RLS Policies for flower_prices table
CREATE POLICY "Retailers can view own prices"
  ON flower_prices FOR SELECT
  TO authenticated
  USING (retailer_id = auth.uid());

CREATE POLICY "Retailers can insert own prices"
  ON flower_prices FOR INSERT
  TO authenticated
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can update own prices"
  ON flower_prices FOR UPDATE
  TO authenticated
  USING (retailer_id = auth.uid())
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can delete own prices"
  ON flower_prices FOR DELETE
  TO authenticated
  USING (retailer_id = auth.uid());

-- RLS Policies for customer_purchases table
CREATE POLICY "Retailers can view own purchases"
  ON customer_purchases FOR SELECT
  TO authenticated
  USING (retailer_id = auth.uid());

CREATE POLICY "Retailers can insert own purchases"
  ON customer_purchases FOR INSERT
  TO authenticated
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can update own purchases"
  ON customer_purchases FOR UPDATE
  TO authenticated
  USING (retailer_id = auth.uid())
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can delete own purchases"
  ON customer_purchases FOR DELETE
  TO authenticated
  USING (retailer_id = auth.uid());

-- RLS Policies for farmer_payments table
CREATE POLICY "Retailers can view own farmer payments"
  ON farmer_payments FOR SELECT
  TO authenticated
  USING (retailer_id = auth.uid());

CREATE POLICY "Retailers can insert own farmer payments"
  ON farmer_payments FOR INSERT
  TO authenticated
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can update own farmer payments"
  ON farmer_payments FOR UPDATE
  TO authenticated
  USING (retailer_id = auth.uid())
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can delete own farmer payments"
  ON farmer_payments FOR DELETE
  TO authenticated
  USING (retailer_id = auth.uid());

-- RLS Policies for customer_payments table
CREATE POLICY "Retailers can view own customer payments"
  ON customer_payments FOR SELECT
  TO authenticated
  USING (retailer_id = auth.uid());

CREATE POLICY "Retailers can insert own customer payments"
  ON customer_payments FOR INSERT
  TO authenticated
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can update own customer payments"
  ON customer_payments FOR UPDATE
  TO authenticated
  USING (retailer_id = auth.uid())
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can delete own customer payments"
  ON customer_payments FOR DELETE
  TO authenticated
  USING (retailer_id = auth.uid());

-- RLS Policies for notifications table
CREATE POLICY "Retailers can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (retailer_id = auth.uid());

CREATE POLICY "Retailers can insert own notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (retailer_id = auth.uid())
  WITH CHECK (retailer_id = auth.uid());

CREATE POLICY "Retailers can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (retailer_id = auth.uid());

-- RLS Policies for sms_whatsapp_logs table
CREATE POLICY "Retailers can view own message logs"
  ON sms_whatsapp_logs FOR SELECT
  TO authenticated
  USING (retailer_id = auth.uid());

CREATE POLICY "Retailers can insert own message logs"
  ON sms_whatsapp_logs FOR INSERT
  TO authenticated
  WITH CHECK (retailer_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_farmers_retailer ON farmers(retailer_id);
CREATE INDEX IF NOT EXISTS idx_customers_retailer ON customers(retailer_id);
CREATE INDEX IF NOT EXISTS idx_daily_supplies_retailer ON daily_supplies(retailer_id);
CREATE INDEX IF NOT EXISTS idx_daily_supplies_date ON daily_supplies(supply_date);
CREATE INDEX IF NOT EXISTS idx_flower_prices_date ON flower_prices(price_date);
CREATE INDEX IF NOT EXISTS idx_customer_purchases_date ON customer_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_notifications_retailer ON notifications(retailer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);