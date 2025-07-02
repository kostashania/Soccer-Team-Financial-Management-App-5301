# Soccer Team Finance Management System

A comprehensive financial management system for soccer teams built with React, Supabase, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd soccer-team-financial-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure your environment variables** in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_APP_NAME=Your Team Name
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔐 Security Configuration

### Environment Variables

This project uses environment variables to secure sensitive configuration:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_APP_NAME` - Application name
- `VITE_DEBUG_MODE` - Enable/disable debug logging

### Important Security Notes

⚠️ **NEVER commit `.env` files to version control!**

✅ **DO:**
- Use `.env.example` for documentation
- Add `.env` to `.gitignore`
- Use environment-specific configurations
- Rotate keys regularly

❌ **DON'T:**
- Hardcode secrets in source code
- Commit sensitive data
- Share environment files
- Use production keys in development

### Setting Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy your Project URL and anon key
4. Add them to your `.env` file
5. Set up your database tables using the provided SQL schema

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React context providers
├── pages/              # Page components
├── lib/                # Utility libraries
├── config/             # Configuration files
└── styles/             # CSS and styling
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌍 Environment Setup

### Development
```env
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key
VITE_DEBUG_MODE=true
```

### Production
```env
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
VITE_DEBUG_MODE=false
```

## 📝 Database Schema

The application expects the following Supabase tables:
- `users_stf2024` - User management
- `categories_stf2024` - Transaction categories
- `items_stf2024` - Category items
- `transactions_stf2024` - Financial transactions
- `platform_buttons_stf2024` - External platform links

## 🔒 Security Best Practices

1. **Environment Variables**: All sensitive data is stored in environment variables
2. **Row Level Security**: Enabled on all Supabase tables
3. **Input Validation**: Client and server-side validation
4. **Authentication**: Custom authentication system with role-based access
5. **HTTPS Only**: All communications over HTTPS

## 🚀 Deployment

### Vercel/Netlify
1. Connect your GitHub repository
2. Set environment variables in the dashboard
3. Deploy automatically on push

### Manual Deployment
1. Build the project: `npm run build`
2. Upload `dist/` folder to your hosting provider
3. Configure environment variables on your hosting platform

## 🆘 Troubleshooting

### Common Issues

**"Missing Supabase environment variables"**
- Ensure `.env` file exists and contains required variables
- Check variable names start with `VITE_`

**"Connection failed"**
- Verify Supabase URL and key are correct
- Check Supabase project is active
- Ensure database tables exist

**"Access denied"**
- Check user roles and permissions
- Verify Row Level Security policies

## 📄 License

This project is licensed under the MIT License.