-- Wash + dry service, detergent, and purchasable dryer sheet packs on bookings.

ALTER TABLE public.hosts
  ADD COLUMN IF NOT EXISTS wash_price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS dry_price numeric(10, 2);

UPDATE public.hosts SET wash_price = 0 WHERE wash_price IS NULL;
UPDATE public.hosts SET dry_price = price WHERE dry_price IS NULL;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS wash_price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS wash_service boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS laundry_service_mode text,
  ADD COLUMN IF NOT EXISTS detergent_option text,
  ADD COLUMN IF NOT EXISTS detergent_price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS dryer_sheets_packs integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dryer_sheets_price numeric(10, 2);
