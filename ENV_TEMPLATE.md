# Environment Variables Template

Create a `.env` file in your project root with the following variables:

```env
# Gmail API Configuration
# Get these from Google Cloud Console > APIs & Services > Credentials
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## How to Get Google Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API
4. Go to "APIs & Services" → "Credentials"
5. Click "Create Credentials" → "OAuth 2.0 Client IDs"
6. Choose "Web application"
7. Add redirect URI: `http://localhost:5173/gmail-callback`
8. Copy the Client ID and Client Secret

## Security Notes

- Never commit your `.env` file to version control
- Use different credentials for development and production
- Keep your Client Secret secure 