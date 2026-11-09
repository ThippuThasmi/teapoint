CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji       TEXT NOT NULL DEFAULT '🍵',
  sort_order  INT  NOT NULL DEFAULT 0
);

CREATE TABLE products (
  id          SERIAL PRIMARY KEY,
  category_id INT  NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji       TEXT NOT NULL DEFAULT '🍵',
  price_minor INT  NOT NULL CHECK (price_minor > 0),
  available   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON products(category_id);

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id            SERIAL PRIMARY KEY,
  user_id       INT REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone         TEXT NOT NULL,
  notes         TEXT,
  status        TEXT NOT NULL DEFAULT 'placed'
                CHECK (status IN ('placed', 'preparing', 'ready', 'completed', 'cancelled')),
  total_minor   INT  NOT NULL CHECK (total_minor >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user ON orders(user_id);

CREATE TABLE order_items (
  id               SERIAL PRIMARY KEY,
  order_id         INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       INT REFERENCES products(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  unit_price_minor INT NOT NULL,
  quantity         INT NOT NULL CHECK (quantity > 0)
);
CREATE INDEX idx_order_items_order ON order_items(order_id);
