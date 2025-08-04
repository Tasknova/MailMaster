-- Fix function search path security warnings by setting search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_contact_list_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.contact_lists 
    SET total_contacts = total_contacts + 1 
    WHERE id = NEW.list_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.contact_lists 
    SET total_contacts = total_contacts - 1 
    WHERE id = OLD.list_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create functions for campaign statistics updates
CREATE OR REPLACE FUNCTION increment_campaign_opens(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE campaigns 
  SET total_opened = total_opened + 1 
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_campaign_clicks(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE campaigns 
  SET total_clicked = total_clicked + 1 
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update campaign statistics from campaign_sends
CREATE OR REPLACE FUNCTION update_campaign_stats(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE campaigns 
  SET 
    total_sent = (
      SELECT COUNT(*) 
      FROM campaign_sends 
      WHERE campaign_sends.campaign_id = campaigns.id 
      AND status = 'sent'
    ),
    total_delivered = (
      SELECT COUNT(*) 
      FROM campaign_sends 
      WHERE campaign_sends.campaign_id = campaigns.id 
      AND status = 'sent'
    ),
    total_bounced = (
      SELECT COUNT(*) 
      FROM campaign_sends 
      WHERE campaign_sends.campaign_id = campaigns.id 
      AND status = 'failed'
    ),
    total_opened = (
      SELECT COUNT(*) 
      FROM campaign_sends 
      WHERE campaign_sends.campaign_id = campaigns.id 
      AND opened_at IS NOT NULL
    ),
    total_clicked = (
      SELECT COUNT(*) 
      FROM campaign_sends 
      WHERE campaign_sends.campaign_id = campaigns.id 
      AND clicked_at IS NOT NULL
    )
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update campaign stats when campaign_sends change
CREATE OR REPLACE FUNCTION trigger_update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_campaign_stats(NEW.campaign_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM update_campaign_stats(NEW.campaign_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_campaign_stats(OLD.campaign_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON campaign_sends
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_campaign_stats();