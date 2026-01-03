#!/bin/bash
# Deployment script for PhotoShare to Azure

echo "PhotoShare Deployment Script"
echo "=============================\n"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="scalable-group"
APP_SERVICE_NAME="scalable-photo-app"
STORAGE_ACCOUNT="scalablemediastorage"
SQL_SERVER="scalable-sql"
SQL_DB="scalable-db"
REGION="francecentral"

echo -e "${YELLOW}Step 1: Installing backend dependencies${NC}"
cd backend
npm install
cd ..

echo -e "${YELLOW}Step 2: Building the application${NC}"
# No build step needed for Node.js with Express

echo -e "${YELLOW}Step 3: Deploying to Azure App Service${NC}"
echo "Make sure to:"
echo "1. Commit your changes: git add . && git commit -m 'Deployment'"
echo "2. Push to GitHub: git push origin main"
echo "3. GitHub Actions will deploy automatically"

echo -e "\n${GREEN}Deployment setup complete!${NC}"
echo -e "App Service URL: ${YELLOW}https://${APP_SERVICE_NAME}.azurewebsites.net${NC}"
