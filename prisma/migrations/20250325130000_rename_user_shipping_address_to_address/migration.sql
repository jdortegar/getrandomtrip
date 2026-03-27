-- Rename legacy column if present; otherwise ensure `address` exists (e.g. DB never had shippingAddress).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'shippingAddress'
  ) THEN
    ALTER TABLE "users" RENAME COLUMN "shippingAddress" TO "address";
  ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'address'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "address" JSONB;
  END IF;
END $$;
