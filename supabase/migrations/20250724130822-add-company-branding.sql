-- Add company branding fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN company JSONB DEFAULT '{
  "company_name": "Your Company Name",
  "company_email": "contact@yourcompany.com", 
  "company_phone": "+1 (555) 123-4567",
  "company_address": "123 Business St, City, State 12345",
  "company_logo": ""
}'::jsonb;

-- Add index for company data
CREATE INDEX idx_profiles_company ON public.profiles USING GIN (company); 