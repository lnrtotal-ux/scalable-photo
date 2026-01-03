# PhotoShare - Simplified Cloud-Native Platform

A lightweight, scalable photo-sharing platform built with Azure serverless architecture, Bootstrap UI, and username/password authentication.

## 🎯 Project Overview

This is a streamlined implementation of a cloud-native media sharing platform designed for educational purposes. It demonstrates:

- **Serverless Architecture**: Azure Functions for backend API
- **Scalable Storage**: Azure Blob Storage for photos, Azure SQL for metadata
- **Modern UI**: Bootstrap 5 with Font Awesome icons
- **Simple Auth**: Username/password authentication (no OAuth complexity)
- **Clean Design**: Traditional menu navigation with thumbnail-based post layout

## 🏗️ Architecture

### Frontend
- **Framework**: Vanilla JavaScript + Bootstrap 5
- **Icons**: Font Awesome 6
- **Pages**: Home, Creator Area, Login
- **Layout**: Traditional menu with row-based post cards (thumbnail left, details right)

### Backend
- **Platform**: Azure Functions (Node.js)
- **Database**: Azure SQL Database (serverless tier)
- **Storage**: Azure Blob Storage
- **Authentication**: JWT-based username/password

### API Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/photos` - List all photos
- `GET /api/photos/{id}` - Get single photo
- `POST /api/photos` - Upload photo (creators only)
- `PUT /api/photos/{id}` - Update photo (creators only)
- `DELETE /api/photos/{id}` - Delete photo (creators only)
- `POST /api/photos/{id}/like` - Like/unlike photo
- `POST /api/photos/{id}/comment` - Add comment
- `DELETE /api/comments/{id}` - Delete comment

## 📁 Project Structure

```
Scalable - Benjamin/
├── backend/
│   └── functions/
│       ├── auth-login/
│       ├── auth-register/
│       ├── photos-list/
│       ├── photo-get/
│       ├── photo-create/
│       ├── photo-update/
│       ├── photo-delete/
│       ├── photo-like/
│       ├── comment-add/
│       ├── comment-delete/
│       ├── utils/
│       │   ├── db.js
│       │   ├── auth.js
│       │   └── storage.js
│       ├── host.json
│       ├── package.json
│       └── local.settings.json (not committed)
├── frontend/
│   ├── index.html (Home)
│   ├── creator.html (Creator Area)
│   ├── login.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── config.js
│       ├── auth.js
│       ├── api.js
│       ├── home.js
│       └── creator.js
├── config/
│   └── database-schema.sql
└── docs/
    ├── SETUP_GUIDE.md
    └── DEPLOYMENT_GUIDE.md
```

## 🚀 Quick Start

### Prerequisites
- Azure account (free tier)
- Node.js 18+ and npm
- Azure Functions Core Tools
- Azure CLI

### Local Development

1. **Clone and navigate**
   ```bash
   cd "Scalable - Benjamin"
   ```

2. **Setup backend**
   ```bash
   cd backend/functions
   npm install
   cp local.settings.json.template local.settings.json
   # Edit local.settings.json with your Azure credentials
   func start
   ```

3. **Setup frontend**
   ```bash
   cd frontend
   python3 -m http.server 3000
   ```

4. **Access application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:7071

## 🔐 Authentication

- Registration creates new users with hashed passwords (bcrypt)
- Login returns JWT token valid for 24 hours
- Token must be included in Authorization header for protected endpoints
- Two user roles: `consumer` (default) and `creator`

## 📊 Database Schema

### Users Table
- `UserId` (PK)
- `Username` (unique)
- `Email` (unique)
- `PasswordHash`
- `Role` (consumer/creator)
- `CreatedAt`

### Photos Table
- `PhotoId` (PK)
- `UserId` (FK)
- `Title`
- `Caption`
- `Location`
- `BlobUrl`
- `ThumbnailUrl`
- `LikesCount`
- `CreatedAt`

### Likes & Comments Tables
- Standard many-to-many relationships
- Cascade deletes for data integrity

## 🎨 UI Features

- **Responsive Bootstrap design** that works on mobile and desktop
- **Card-based layout** with thumbnails and metadata
- **Font Awesome icons** for actions (like, comment, edit, delete)
- **Modal dialogs** for upload and edit forms
- **Toast notifications** for user feedback
- **Loading states** and error handling

## 📝 License

MIT License - Educational use only

## 👨‍💻 Author

John Seun - Advanced Software Solution Deployment Coursework
