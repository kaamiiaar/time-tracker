# ⏱️ Time Tracker Assistant

A beautiful, modern productivity tracking application that helps you monitor your work hours, track workout habits, and visualize your productivity trends. Now powered by Supabase for cross-platform data sync!

## ✨ Features

- **⏱️ Live Timer**: Built-in stopwatch for real-time time tracking
- **📝 Manual Entry**: Add hours manually with flexible input
- **💪 Workout Tracking**: Monitor your fitness consistency
- **📊 Individual Entries**: Track and manage individual time sessions
- **📈 Statistics & Analytics**: Beautiful charts showing productivity trends
- **🔄 Bulk Operations**: Select and delete multiple entries at once
- **💾 Cloud Sync**: Data stored in Supabase for access across devices
- **📱 Responsive Design**: Works perfectly on desktop and mobile
- **🎨 Modern UI**: Clean, intuitive interface with smooth animations

## 🚀 Live Demo

Visit the live application: [Your Vercel URL will go here]

## 🛠️ Setup Instructions

### 1. Supabase Setup

1. Create a free account at [Supabase](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the SQL from `supabase-setup.sql` file:

```sql
-- Copy and paste the contents of supabase-setup.sql into your Supabase SQL Editor
```

4. Go to Settings > API to get your:
   - Project URL
   - Anon/public key

### 2. Local Development

**Option A: Using config.js (Recommended for simple setup)**

1. Clone this repository:

```bash
git clone <your-repo-url>
cd time-tracker
```

2. Create your local config file:

```bash
cp config.example.js config.js
```

3. Edit `config.js` and add your Supabase credentials:

```javascript
export const config = {
  SUPABASE_URL: "https://your-project-id.supabase.co",
  SUPABASE_ANON_KEY: "your_anon_key_here",
};
```

4. Serve the application locally:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

5. Open http://localhost:8000 in your browser

**Option B: Using .env file (For Vite/build tool environments)**

1. Clone and navigate to the repository
2. Create a `.env` file:

```bash
cp .env.example .env
```

3. Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Use a build tool like Vite to serve the application

### 3. Vercel Deployment

1. Push your code to GitHub (make sure `config.js` and `.env` are in `.gitignore`)

2. Connect your repository to [Vercel](https://vercel.com)

3. In Vercel project settings, add environment variables:

   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

4. Deploy! Vercel will automatically build and deploy your app

## 🔒 Security Notes

- `config.js` is gitignored and contains your credentials for local development only
- Environment variables are safely handled and not exposed to the client in production
- Supabase Row Level Security (RLS) is enabled for data protection
- The anon key is safe to use in client-side applications
- For production, consider implementing user authentication

## 📊 Database Schema

### daily_records

- `date` (TEXT, PRIMARY KEY): Date in YYYY-MM-DD format
- `hours` (REAL): Total hours worked that day
- `workout` (TEXT): "Yes" or "No" for workout completion
- `created_at`, `updated_at` (TIMESTAMP): Audit fields

### time_entries

- `id` (SERIAL, PRIMARY KEY): Unique entry identifier
- `date` (TEXT): Date this entry belongs to
- `hours` (REAL): Hours for this specific entry
- `type` (TEXT): "manual" or "stopwatch"
- `description` (TEXT): Optional description
- `created_at` (TIMESTAMP): When entry was created

## 🎯 Usage

1. **Daily Tracking**: Use the date picker to select any day
2. **Add Time**: Either use the stopwatch or add manual hours
3. **Workout Logging**: Check the workout box if you exercised
4. **View Records**: Switch to Records tab to see all your data
5. **Analytics**: Check Statistics tab for insights and trends
6. **Manage Entries**: View, select, and delete individual time entries

## 💡 Features Explained

### Stopwatch Timer

- Start/pause/reset functionality
- Automatically creates time entries when you stop
- Tracks session duration accurately

### Manual Hours

- Add hours incrementally (not as total)
- Supports decimal values (e.g., 1.5 hours)
- Creates individual entries for each addition

### Time Entries Management

- View all entries for selected date
- Bulk select and delete multiple entries
- Entries are color-coded by type (manual vs stopwatch)

### Statistics Dashboard

- Beautiful charts showing 30-day trends
- Key metrics: total days, hours, averages
- Workout consistency tracking
- AI-generated insights based on your data

## 🔧 Technical Details

- **Frontend**: Vanilla JavaScript with ES6 modules
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Charts**: Chart.js
- **Styling**: Modern CSS with gradients and animations
- **Architecture**: Modular design with separate files for each feature

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:

1. Check that your Supabase credentials are correct
2. Verify the database tables were created properly
3. Check browser console for any errors
4. Ensure environment variables are set in Vercel

## 🚀 Future Enhancements

- User authentication and multi-user support
- Project/category tracking
- Export functionality (CSV, PDF)
- Mobile app using React Native
- Integrations with calendar apps
- Advanced analytics and reporting
- Goal setting and achievement tracking

---

Made with ❤️ for productivity enthusiasts everywhere!

# 🔽 Deployment Instructions

## Vercel Deployment

### 1. Deploy to Vercel

1. **Connect your GitHub repository** to Vercel
2. **Import your project** on vercel.com
3. Vercel will automatically detect it as a static site

### 2. Set Environment Variables

In your Vercel project dashboard:

1. Go to **Settings → Environment Variables**
2. Add the following variables for **Production, Preview, and Development**:

| Variable Name            | Value                         |
| ------------------------ | ----------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL     |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

### 3. Redeploy

After setting environment variables, trigger a new deployment:

- Go to **Deployments** tab
- Click **"Redeploy"** on your latest deployment

### 4. Update Code and Deploy

To deploy new changes:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Vercel will automatically deploy the changes.

## Environment Variables Setup

The app uses a fallback system for environment variables:

1. **Production**: Fetches from `/api/env` serverless function
2. **Development**: Uses local `config.js` file (create from `config.example.js`)

### For Local Development

1. Copy `config.example.js` to `config.js`
2. Add your Supabase credentials to `config.js`
3. The file is gitignored for security

### For Production

Environment variables are set in Vercel dashboard and served via the `/api/env` endpoint.
