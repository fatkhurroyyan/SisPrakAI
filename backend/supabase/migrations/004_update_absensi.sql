-- Update absensi table constraints for new attendance statuses and delay durations

-- Drop the existing status constraint
ALTER TABLE absensi DROP CONSTRAINT IF EXISTS absensi_status_check;

-- Add the new status constraint
ALTER TABLE absensi ADD CONSTRAINT absensi_status_check 
  CHECK (status IN ('HADIR', 'SAKIT', 'IZIN', 'DISPEN', 'ALPA', 'TERLAMBAT'));

-- Add the keterlambatan column for TERLAMBAT status
ALTER TABLE absensi ADD COLUMN IF NOT EXISTS keterlambatan TEXT 
  CHECK (keterlambatan IN ('<= 10', '11-30', '31-60', '> 60'));
