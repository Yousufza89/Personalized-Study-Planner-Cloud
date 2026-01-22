# Study Planner - Personalized Cloud-Based Study Planner

A modern, cloud-based study planner application built with Next.js, Azure Active Directory authentication, Azure Cosmos DB, and Azure Blob Storage.

## Features

- 🔐 **Azure AD Authentication** - Secure login with Microsoft accounts
- 📅 **Study Schedule Management** - Create, update, and manage study schedules
- 📁 **Resource Upload** - Upload and manage study resources (PDFs, notes, images)
- 📊 **Dashboard** - View upcoming tasks and statistics
- 🎨 **Modern UI** - Clean, responsive design inspired by Notion/Linear

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Authentication**: NextAuth.js with Azure AD provider
- **Database**: Azure Cosmos DB
- **Storage**: Azure Blob Storage
- **Form Handling**: React Hook Form + Zod validation
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Azure account with:
  - Azure Active Directory app registration
  - Azure Cosmos DB account
  - Azure Storage Account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd studyplanner
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory:

**For Demo/Development Mode (No Azure Required):**
```env
# NextAuth Configuration (Required)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Leave Azure credentials empty for demo mode
# The app will use mock authentication
```

**For Production (With Azure):**
```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Azure Active Directory
AZURE_AD_CLIENT_ID=your-azure-ad-client-id
AZURE_AD_CLIENT_SECRET=your-azure-ad-client-secret
AZURE_AD_TENANT_ID=your-azure-ad-tenant-id

# Azure Cosmos DB
AZURE_COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
AZURE_COSMOS_KEY=your-cosmos-db-key
AZURE_COSMOS_DATABASE_ID=studyplanner
AZURE_COSMOS_CONTAINER_ID=schedules

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-storage-account-key
AZURE_STORAGE_CONTAINER_NAME=study-resources
```

4. Generate a NextAuth secret:
```bash
openssl rand -base64 32
```

**Note:** If you don't have Azure AD configured, the app will automatically use demo mode with a simple email-based login. Just click "Quick Login" on the login page!

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Azure Setup

### Azure Active Directory App Registration

1. Go to Azure Portal → Azure Active Directory → App registrations
2. Create a new registration
3. Add redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
4. Create a client secret
5. Copy Client ID, Tenant ID, and Client Secret to `.env.local`

### Azure Cosmos DB

1. Create a Cosmos DB account
2. Create a database named `studyplanner`
3. Create a container named `schedules` with partition key `/userId`
4. Copy the endpoint and key to `.env.local`

### Azure Blob Storage

1. Create a Storage Account
2. Create a container named `study-resources`
3. Copy the account name and key to `.env.local`

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth configuration
│   │   ├── schedules/              # Schedule API routes
│   │   └── upload/                 # File upload API routes
│   ├── dashboard/                  # Dashboard page
│   ├── login/                      # Login page
│   ├── schedules/                  # Schedule pages
│   ├── upload/                     # Upload page
│   ├── profile/                    # Profile page
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home page (redirects)
│   └── providers.tsx               # Session provider
├── components/
│   ├── layout/                     # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── ProtectedRoute.tsx
│   └── ui/                         # UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Modal.tsx
└── lib/
    ├── apiClient.ts                # Axios client
    ├── auth.ts                     # Auth utilities
    ├── blobSas.ts                  # Blob storage utilities
    ├── cosmosClient.ts             # Cosmos DB client
    └── types.ts                    # TypeScript types
```

## API Routes

### Schedules

- `GET /api/schedules` - Get all schedules for the current user
- `POST /api/schedules` - Create a new schedule
- `GET /api/schedules/[id]` - Get a specific schedule
- `PUT /api/schedules/[id]` - Update a schedule
- `DELETE /api/schedules/[id]` - Delete a schedule

### Upload

- `GET /api/upload/sas?fileName=...&scheduleId=...` - Get SAS URL for file upload
- `POST /api/upload/finish` - Save file metadata after upload

## Features in Detail

### Authentication
- Secure login with Azure AD
- Protected routes that redirect to login if not authenticated
- Session management with NextAuth

### Schedule Management
- Create schedules with title, description, and dates
- View all schedules in a grid/list layout
- Edit and delete schedules
- Mark schedules as completed
- Search functionality

### Resource Management
- Upload files to Azure Blob Storage
- Associate files with schedules
- View and download uploaded resources
- Delete resources

### Dashboard
- Overview of upcoming schedules (next 7 days)
- Statistics: upcoming tasks, completed tasks, total schedules
- Quick access to create new schedules

## Development

### Building for Production

```bash
npm run build
npm start
```

### Environment Variables

Make sure all required environment variables are set in `.env.local` for local development, or in your deployment platform's environment settings for production.

## Deployment

This application can be deployed to:
- Azure App Service
- Vercel
- Any platform that supports Next.js

Make sure to set all environment variables in your deployment platform.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
