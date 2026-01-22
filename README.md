# Personalized-Study-Planner-Cloud
A cloud-native, web-based application built with Next.js and Microsoft Azure to help students organize academic schedules and resources.

Personalized Study Planner on the Cloud 🚀
A centralized, cloud-native web application designed to help students organize academic schedules, manage study resources, and track progress in real-time. This project was developed as part of the Introduction to Cloud Computing (CS4037) course.

🌟 **Key Features**
Smart Scheduling: Full CRUD operations for personalized academic timetables.

Resource Management: Securely upload and store PDFs, notes, and images.

Enterprise Security: User authentication powered by Azure Active Directory and NextAuth.js.

High Availability: Architecture designed for 99.95% uptime SLA using Azure's global infrastructure.

Responsive UI: Built with Next.js 16 and Tailwind CSS for a seamless experience on all devices.

**🛠️ Azure Cloud Services Used**
This project serves as a comprehensive case study in integrating multiple Microsoft Azure services:

Compute: Azure App Service & Azure Function Apps.

Database: Azure Cosmos DB (NoSQL) for high-performance data storage.

Storage: Azure Blob Storage for managing academic documents.

Identity: Azure Active Directory (Microsoft Entra ID).

Monitoring: Azure Monitor & Application Insights for real-time error tracking.

**🚀 Getting Started**
Prerequisites
Node.js (v20 or higher)

An active Azure Subscription (for cloud features)

Quick Setup (Demo Mode)
If you want to test the UI without configuring Azure:

Clone the repository:

Bash

git clone https://github.com/Yousufza89/Personalized-Study-Planner-Cloud.git
cd Personalized-Study-Planner-Cloud
Install dependencies:

Bash

npm install
Configure local environment: Create a .env.local file in the root directory:

Code snippet

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any-random-string-for-local-testing
Run the application:

Bash

npm run dev
Access the App: Open http://localhost:3000 and click "🚀 Quick Login (Demo)".

**🏗️ Architecture Overview**
The application follows a modern full-stack architecture:

Frontend: Next.js (App Router) with React 19.

API: Next.js Server Actions and API Routes.

Infrastructure: Provisioned on Azure to support 100+ concurrent users. file with:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=any-random-string
