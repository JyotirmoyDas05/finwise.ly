# FinWise.ly - Your Personal Finance Management Platform

FinWise.ly is a modern, AI-powered personal finance management platform that helps users track their expenses, set financial goals, and learn about personal finance through interactive content and AI assistance.

## Features

- 📊 Dashboard for financial overview
- 💰 Expense tracking and management
- 🎯 Goal setting and progress tracking
- 📚 Interactive financial learning resources
- 🤖 AI-powered financial advice and assistance
- 🌓 Dark/Light mode support
- 🔒 Secure authentication
- 📱 Responsive design

## Tech Stack

### Frontend
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: 
  - Radix UI (for accessible components)
  - Lucide React (for icons)
  - Framer Motion (for animations)
- **State Management**: React Hooks
- **Charts**: Recharts
- **Markdown Support**: React Markdown with Remark GFM

### Backend
- **Framework**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: NextAuth.js with Firebase
- **AI Integration**: Google Generative AI
- **File Storage**: Firebase Storage

### APIs Used
- Google Generative AI API for financial advice
- Firebase Authentication API
- Firebase Firestore API
- Firebase Storage API

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- Firebase account and project setup
- Google AI API key

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GOOGLE_AI_API_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/finwise-ly.git
cd finwise-ly
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up your environment variables as described above.

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

To start the production server:

```bash
npm start
# or
yarn start
```

## Project Structure

```
finwise-ly/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # Reusable UI components
│   ├── lib/             # Utility functions and configurations
│   └── styles/          # Global styles
├── public/              # Static assets
├── .env.local          # Environment variables
└── package.json        # Project dependencies
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@finwise.ly or join our Slack channel.

## Acknowledgments

- Next.js team for the amazing framework
- Firebase team for the backend services
- Google AI team for the generative AI capabilities
- All contributors who have helped shape this project
