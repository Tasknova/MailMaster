-- Create table for Gmail API credentials
CREATE TABLE IF NOT EXISTS gmail_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gmail_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own Gmail credentials" ON gmail_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Gmail credentials" ON gmail_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Gmail credentials" ON gmail_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Gmail credentials" ON gmail_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gmail_credentials_updated_at 
  BEFORE UPDATE ON gmail_credentials 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 