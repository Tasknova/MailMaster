-- Fix foreign key constraint to allow NULL values for default templates
-- Run this in your Supabase SQL Editor

-- First, drop the existing foreign key constraint
ALTER TABLE public.templates 
DROP CONSTRAINT IF EXISTS templates_user_id_fkey;

-- Recreate the foreign key constraint to allow NULL values
ALTER TABLE public.templates 
ADD CONSTRAINT templates_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Now you can run the template insertion SQL from manual_templates_fixed.sql 