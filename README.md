# Streakify

**Social productivity powered by proof.**

Streakify is a high-performance productivity platform designed to turn your daily habits into an engaging social experience. Build streaks, join real-time focus rooms, and stay accountable with your circle.

![Productivity](https://img.shields.io/badge/Productivity-Social%20First-333333?style=for-the-badge)
![Focus](https://img.shields.io/badge/Focus-Real--Time-1DB954?style=for-the-badge)
![Build](https://img.shields.io/badge/Build-Next.js%2015-000000?style=for-the-badge)
![Security](https://img.shields.io/badge/Security-Firebase%20Auth-FFCA28?style=for-the-badge)
![Style](https://img.shields.io/badge/Style-Tailwind%20CSS%204-38B2AC?style=for-the-badge)

## Key Features

### Social Streak Tracking
- **Friend Grid**: See what your friends are working on in real-time.
- **Proof of Work**: Every streak update requires a screenshot/proof to maintain accountability.
- **Interactive Calendar**: Visualize your consistency with a dynamic activity heatmap.

### Live Focus Rooms
- **Real-Time Collaboration**: Join focus sessions with friends using a production-grade Pomodoro timer.
- **Interactive Chat**: Built-in messaging for motivation and coordination.
- **Shared Task List**: Manage room-specific goals together.
- **Member Presence**: Live activity bubbles showing who is currently working and on what.

### Gamified Experience
- **Global Leaderboard**: Compete with users worldwide for the top streak and productivity score.
- **Micro-Interactions**: Premium animations and haptic-feel interactions using Framer Motion.
- **Status Updates**: Share your current focus task with the community.

### Premium Mobile Experience
- **Fully Responsive**: Identical desktop-grade experience on mobile devices.
- **Bottom Navigation**: Intuitive mobile-first navigation bar.
- **Staggered Animations**: Fluid list transitions and responsive layouts.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **Storage**: Firebase Storage (for proof of work images)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion 12](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ASIKKANI/Streakify.git
   cd Streakify
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env.local` file and add your Firebase configurations:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run local development server**:
   ```bash
   npm run dev
   ```

## Deployment

This project is optimized for deployment on Vercel or Netlify.

1. Connect your GitHub repository to Vercel/Netlify.
2. Add the environment variables from your `.env.local`.
3. The build command is `npm run build` and the output directory is `.next`.

---

Built for productivity beasts.
