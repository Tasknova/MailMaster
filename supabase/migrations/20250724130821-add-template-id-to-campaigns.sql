-- Add template_id column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_campaigns_template_id ON public.campaigns(template_id); 