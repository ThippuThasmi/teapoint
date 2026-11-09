-- Prices are in minor units (paise). 2000 = INR 20.00
INSERT INTO categories (slug, name, description, emoji, sort_order) VALUES
  ('tea-coffee',  'Tea & Coffee', 'Freshly brewed hot classics',       '🍵', 1),
  ('juices',      'Fresh Juices', 'Pressed to order, no added sugar',  '🍊', 2),
  ('milkshakes',  'Milkshakes',   'Thick, cold and creamy',            '🥤', 3),
  ('snacks',      'Snacks',       'Crispy bites to go with your cup',  '🥪', 4),
  ('ice-creams',  'Ice Creams',   'Scoops and sundaes',                '🍨', 5);

INSERT INTO products (category_id, name, description, emoji, price_minor)
SELECT c.id, v.name, v.description, v.emoji, v.price
FROM (VALUES
  ('tea-coffee', 'Masala Chai',        'Assam tea simmered with ginger and cardamom', '🍵', 2000),
  ('tea-coffee', 'Ginger Lemon Tea',   'Warm and soothing',                           '🍋', 2500),
  ('tea-coffee', 'Green Tea',          'Light, antioxidant-rich',                     '🍃', 3000),
  ('tea-coffee', 'Filter Coffee',      'South Indian decoction with frothy milk',     '☕', 3000),
  ('tea-coffee', 'Cappuccino',         'Espresso with steamed milk foam',             '☕', 12000),
  ('juices',     'Orange Juice',       'Fresh-pressed oranges',                       '🍊', 7000),
  ('juices',     'Watermelon Juice',   'Chilled and refreshing',                      '🍉', 6000),
  ('juices',     'Mosambi Juice',      'Sweet lime, served cold',                     '🍋', 6500),
  ('juices',     'Pineapple Juice',    'Tangy and fresh',                             '🍍', 7000),
  ('milkshakes', 'Chocolate Milkshake','Rich cocoa with vanilla ice cream',           '🍫', 12000),
  ('milkshakes', 'Strawberry Milkshake','Real strawberry blended thick',              '🍓', 12000),
  ('milkshakes', 'Mango Milkshake',    'Alphonso mango when in season',               '🥭', 13000),
  ('milkshakes', 'Cold Coffee',        'Blended coffee with ice cream',               '🧋', 11000),
  ('snacks',     'Veg Sandwich',       'Grilled with mint chutney',                   '🥪', 6000),
  ('snacks',     'Samosa',             'Crispy potato-stuffed pastry (2 pcs)',        '🥟', 3000),
  ('snacks',     'French Fries',       'Salted, with ketchup',                        '🍟', 9000),
  ('snacks',     'Veg Puff',           'Flaky pastry with spiced vegetables',         '🥐', 2500),
  ('ice-creams', 'Vanilla Scoop',      'Classic vanilla',                             '🍦', 5000),
  ('ice-creams', 'Chocolate Scoop',    'Dark chocolate',                              '🍨', 5500),
  ('ice-creams', 'Butterscotch Sundae','Butterscotch sauce and crunchy praline',      '🍨', 11000),
  ('ice-creams', 'Kulfi',              'Traditional malai kulfi on a stick',          '🍡', 6000)
) AS v(slug, name, description, emoji, price)
JOIN categories c ON c.slug = v.slug;
