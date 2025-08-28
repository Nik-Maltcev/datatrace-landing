# Railway Environment Variables Setup

## Required Environment Variables for Railway

Add these environment variables in your Railway project dashboard:

### Core Configuration
```
NODE_ENV=production
PORT=3001
```

### API Keys (Required)
```
SNUSBASE_API_KEY=sb99cd2vxyohst65mh98ydz6ud844l
```

### Optional API Keys (for full functionality)
```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DEHASHED_API_KEY=your_dehashed_api_key
```

## Steps to Add Variables in Railway:

1. Open your Railway project dashboard
2. Go to **"Variables"** tab
3. Click **"New Variable"**
4. Add each variable:
   - Name: `SNUSBASE_API_KEY`
   - Value: `sb99cd2vxyohst65mh98ydz6ud844l`
5. Click **"Add"**
6. Repeat for other variables
7. **Deploy** or **Redeploy** your application

## Testing the Setup:

After deployment, test the Snusbase connection:
```
GET https://your-app.railway.app/api/snusbase/test
```

Should return:
```json
{
  "ok": true,
  "connection": "successful",
  "rows": 16720220425,
  "tablesCount": 1234
}
```

## Security Notes:

- Never commit API keys to git
- Use different keys for development and production
- Keep the `.env` file in `.gitignore`
- Use Railway's secure variable storage for production keys
