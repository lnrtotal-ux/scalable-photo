# GitHub Setup & Deployment Instructions

This guide explains how to set up GitHub for continuous deployment of PhotoShare to Azure App Service.

## Step 1: Initialize Git Repository (if not done)

```bash
cd "Scalable - Benjamin"
git init
git add .
git commit -m "initial commit"
```

## Step 2: Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click **New Repository**
3. Enter repository name: `scalable-photo`
4. Make it **Public** (for deployment access)
5. Click **Create Repository**

## Step 3: Add Remote and Push Code

```bash
git remote add origin https://github.com/lnrtotal-ux/scalable-photo.git
git branch -M main
git push -u origin main
```

## Step 4: Configure GitHub Secrets

GitHub Actions needs Azure credentials to deploy. You need to set up secrets:

### 4.1 Get Azure App Service Publish Profile

```bash
az webapp deployment list-publishing-profiles \
  --resource-group scalable-group \
  --name scalable-photo-app \
  --xml > /tmp/publish-profile.xml
cat /tmp/publish-profile.xml
```

Copy the entire XML output.

### 4.2 Get Storage Account Key

```bash
az storage account keys list \
  --resource-group scalable-group \
  --account-name scalablemediastorage \
  --query "[0].value" \
  -o tsv
```

Copy the key.

### 4.3 Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these secrets:

| Secret Name | Value |
|------------|-------|
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Paste the entire XML publish profile |
| `AZURE_STORAGE_ACCOUNT_KEY` | Paste the storage account key |

## Step 5: Set Up Database Schema

The database needs to be initialized with the schema. Run this SQL script on your Azure SQL Database:

### Option A: Using Azure Portal Query Editor

1. Go to Azure Portal → SQL Databases → `scalable-db`
2. Click **Query Editor**
3. Copy the SQL from `/tmp/deploy.sql` (created earlier)
4. Execute the script

### Option B: Using Azure CLI (if sqlcmd is installed)

```bash
sqlcmd -S scalable-sql.database.windows.net \
  -d scalable-db \
  -U scalableadmin \
  -P 'scalable-admin-123!' \
  -i config/database-schema.sql
```

## Step 6: Verify Environment Variables

Verify that all environment variables are set in the App Service:

```bash
az webapp config appsettings list \
  --resource-group scalable-group \
  --name scalable-photo-app \
  --query "[].{name: name, value: value}"
```

You should see all these variables:
- `SQL_SERVER`
- `SQL_DATABASE`
- `SQL_USER`
- `SQL_PASSWORD`
- `STORAGE_ACCOUNT_NAME`
- `STORAGE_ACCOUNT_KEY`
- `STORAGE_CONTAINER`
- `JWT_SECRET`
- `NODE_ENV`

## Step 7: Deploy Workflow

The GitHub Actions workflow in `.github/workflows/deploy.yml` will automatically:

1. **Trigger on push to main branch** - When you push code to main, deployment starts
2. **Install dependencies** - Runs `npm install` in backend
3. **Deploy backend** - Uploads Node.js code to App Service
4. **Deploy frontend** - Uploads static files to Azure Storage

### Manual Deployment Trigger

To manually trigger deployment:

1. Go to **Actions** tab in GitHub
2. Select **Deploy PhotoShare to Azure** workflow
3. Click **Run workflow**

## Step 8: Monitor Deployment

### Check Deployment Status

1. Go to **Actions** tab → **Deploy PhotoShare to Azure**
2. Click the latest workflow run
3. View logs for each step

### View App Service Logs

```bash
az webapp log tail \
  --resource-group scalable-group \
  --name scalable-photo-app
```

## Step 9: Access Your Application

Once deployment succeeds:

- **Backend API**: `https://scalable-photo-app.azurewebsites.net/api`
- **Frontend**: `https://scalable-photo-app.azurewebsites.net/`
- **Health Check**: `https://scalable-photo-app.azurewebsites.net/health`

## Troubleshooting

### Deployment Fails

**Check GitHub Actions Logs:**
1. Go to **Actions** → Failed workflow
2. Expand each step to see error messages

**Common Issues:**

| Issue | Solution |
|-------|----------|
| `authentication required` | Verify `AZURE_WEBAPP_PUBLISH_PROFILE` secret is correct |
| `storage access denied` | Verify `AZURE_STORAGE_ACCOUNT_KEY` secret is correct |
| `npm ERR! missing dependency` | Ensure `package.json` has all dependencies |

### Application Won't Start

```bash
# View application logs
az webapp log tail --resource-group scalable-group --name scalable-photo-app

# Check app settings
az webapp config appsettings list --resource-group scalable-group --name scalable-photo-app
```

### Database Connection Issues

```bash
# Test SQL Server connectivity
az sql server show --resource-group scalable-group --name scalable-sql --query "state"

# Verify database exists
az sql db show --resource-group scalable-group --server scalable-sql --name scalable-db
```

### Storage Upload Fails

```bash
# Check storage account status
az storage account show --resource-group scalable-group --name scalablemediastorage

# Check container exists
az storage container exists --account-name scalablemediastorage --name photostorage
```

## Making Updates

To update your application:

1. **Make code changes** in your local repository
2. **Test locally** (optional):
   ```bash
   cd backend && npm install && npm start
   # In another terminal:
   cd frontend && python3 -m http.server 3000
   ```
3. **Commit changes**:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```
4. **Push to GitHub**:
   ```bash
   git push origin main
   ```
5. **GitHub Actions automatically deploys!**

## Rollback

If something goes wrong after deployment:

```bash
# Swap to previous version (if available)
az webapp deployment slot swap \
  --resource-group scalable-group \
  --name scalable-photo-app \
  --slot staging
```

Or manually redeploy a previous commit:

1. Go to GitHub **Actions**
2. Find the successful workflow run
3. Click **Re-run jobs**

## Next Steps

1. **Set up monitoring**: Enable Application Insights in Azure Portal
2. **Configure custom domain**: Point your domain to the App Service
3. **Enable HTTPS**: Azure provides free HTTPS certificates
4. **Set up backups**: Configure automated SQL Database backups
5. **Monitor costs**: Set up budget alerts in Azure Portal

## Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [GitHub Actions Workflows](https://docs.github.com/en/actions)
- [Azure SQL Database](https://docs.microsoft.com/en-us/azure/azure-sql/)
- [Azure Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/)
