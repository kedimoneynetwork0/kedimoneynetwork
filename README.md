# Kedi Money Network

## Deployment to Render

To deploy this application as a static site on Render, follow these steps:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" and select "Static Site"
3. Connect your GitHub repository or use the existing repository URL
4. Set the following configuration:
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`
5. Click "Create Static Site"

## Environment Variables

For the frontend to communicate with the backend, you may need to set the `VITE_API_BASE` environment variable in Render:
- Key: `VITE_API_BASE`
- Value: The URL of your backend API (e.g., `https://your-backend-url.onrender.com/api`)

## Backend Deployment

For the backend, you can deploy it as a web service on Render with the following settings:
- Runtime: Node.js
- Build Command: `npm install`
- Start Command: `node index.js`
- Environment Variables:
  - `PORT`: `10000` (or any port Render assigns)
  - `JWT_SECRET`: Your JWT secret key

## Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm start
```

## Database Migration

If you've fixed the news table issue, you'll need to run the migration script:
```bash
cd backend
node migrate-news-table.js