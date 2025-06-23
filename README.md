# Family OS - React/Next.js PWA

A collaborative family management Progressive Web App built with React, Next.js, Supabase, and Tailwind CSS.

## 🏠 Features

- **Authentication** - Secure email/password authentication via Supabase
- **Family Groups** - Create and join family groups with unique invite codes
- **Collaborative Lists** - Shared shopping lists, to-do lists, and more
- **Document Management** - Store and share important family documents
- **Event Planning** - Family calendar and event management
- **Real-time Updates** - Live synchronization across all family members
- **PWA Support** - Installable app with offline capabilities
- **Mobile-First Design** - Responsive design optimized for all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd family-os-react
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Create a `.env.local` file:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Set up the database**
   Run these SQL commands in your Supabase SQL editor:

   ```sql
   -- Create family_groups table
   CREATE TABLE family_groups (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     invite_code TEXT UNIQUE NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create group_members table
   CREATE TABLE group_members (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(group_id, user_id)
   );

   -- Create lists table
   CREATE TABLE lists (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     items JSONB DEFAULT '[]'::jsonb,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create documents table
   CREATE TABLE documents (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     url TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create events table
   CREATE TABLE events (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     date DATE NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

5. **Set up Row Level Security (RLS)**
   ```sql
   -- Enable RLS
   ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
   ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
   ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
   ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
   ALTER TABLE events ENABLE ROW LEVEL SECURITY;

   -- Family groups policies
   CREATE POLICY "Users can view groups they belong to" ON family_groups
     FOR SELECT USING (
       id IN (
         SELECT group_id FROM group_members WHERE user_id = auth.uid()
       )
     );

   CREATE POLICY "Users can create groups" ON family_groups
     FOR INSERT WITH CHECK (owner_id = auth.uid());

   -- Group members policies
   CREATE POLICY "Users can view group memberships" ON group_members
     FOR SELECT USING (
       group_id IN (
         SELECT group_id FROM group_members WHERE user_id = auth.uid()
       )
     );

   CREATE POLICY "Users can join groups" ON group_members
     FOR INSERT WITH CHECK (user_id = auth.uid());

   -- Lists policies
   CREATE POLICY "Group members can manage lists" ON lists
     FOR ALL USING (
       group_id IN (
         SELECT group_id FROM group_members WHERE user_id = auth.uid()
       )
     );

   -- Documents policies
   CREATE POLICY "Group members can manage documents" ON documents
     FOR ALL USING (
       group_id IN (
         SELECT group_id FROM group_members WHERE user_id = auth.uid()
       )
     );

   -- Events policies
   CREATE POLICY "Group members can manage events" ON events
     FOR ALL USING (
       group_id IN (
         SELECT group_id FROM group_members WHERE user_id = auth.uid()
       )
     );
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 PWA Installation

The app can be installed on devices:

- **Desktop**: Click the install button in your browser's address bar
- **Mobile**: Use "Add to Home Screen" from your browser menu
- **Offline**: The app works offline with cached data

## 🏗️ Project Structure

```
family-os-react/
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── ListsTab.tsx
│   │   ├── DocumentsTab.tsx
│   │   └── EventsTab.tsx
│   ├── family/
│   │   └── FamilyGroupSetup.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── Modal.tsx
├── lib/
│   └── supabase.ts
├── pages/
│   ├── _app.tsx
│   └── index.tsx
├── styles/
│   └── globals.css
├── public/
│   ├── manifest.json
│   └── sw.js
└── package.json
```

## 🎯 Usage

### Getting Started
1. **Sign Up/Sign In** - Create an account or login
2. **Create a Family** - Set up your first family group
3. **Invite Members** - Share the invite code with family members
4. **Start Collaborating** - Add lists, documents, and events

### Features Overview

#### Lists Management
- Create multiple lists (shopping, to-do, etc.)
- Add/remove items in real-time
- Check off completed items
- All changes sync instantly across devices

#### Document Storage
- Save important document links
- Organize family documents by category
- Quick access to shared resources

#### Event Planning
- Add family events and appointments
- View upcoming and past events
- Shared family calendar

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Technologies Used

- **Frontend**: React 18, Next.js 14, TypeScript
- **UI**: Tailwind CSS, Lucide React icons
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **PWA**: next-pwa for service worker and manifest

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## 🔐 Security

- All data is secured with Supabase RLS policies
- Users can only access their family groups
- Authentication required for all operations
- HTTPS enforced in production

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify your Supabase configuration
3. Ensure your database tables are set up correctly
4. Check that RLS policies are enabled

For additional support, please open an issue on GitHub.

---

Built with ❤️ for families everywhere 