CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL, password_hash text NOT NULL,
  first_name text NOT NULL, last_name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users(lower(email));

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sku text UNIQUE NOT NULL, name text NOT NULL, description text NOT NULL,
  price_cents integer NOT NULL CHECK(price_cents >= 0), currency char(3) NOT NULL DEFAULT 'usd', inventory_count integer NOT NULL DEFAULT 0 CHECK(inventory_count >= 0),
  category text NOT NULL, attributes jsonb NOT NULL DEFAULT '{}', active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_search_idx ON products USING gin(to_tsvector('english', name || ' ' || description));

CREATE TABLE IF NOT EXISTS carts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS cart_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE, product_id uuid NOT NULL REFERENCES products(id), quantity integer NOT NULL CHECK(quantity > 0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(cart_id,product_id));
CREATE TABLE IF NOT EXISTS orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), status text NOT NULL CHECK(status IN ('pending','payment_processing','paid','fulfilled','cancelled','refunded')), subtotal_cents integer NOT NULL, shipping_cents integer NOT NULL, tax_cents integer NOT NULL, total_cents integer NOT NULL, currency char(3) NOT NULL, shipping_address jsonb NOT NULL, stripe_payment_intent_id text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS order_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id uuid NOT NULL REFERENCES products(id), quantity integer NOT NULL CHECK(quantity > 0), unit_price_cents integer NOT NULL CHECK(unit_price_cents >= 0));
CREATE TABLE IF NOT EXISTS reviews (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5), title text NOT NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(product_id,user_id));
CREATE INDEX IF NOT EXISTS reviews_product_created_idx ON reviews(product_id,created_at DESC);
