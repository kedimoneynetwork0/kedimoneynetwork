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
```

## Common Issues

### Case-sensitive file names
If you encounter an error like "Could not resolve './pages/Signup' from 'src/App.jsx'", it's likely due to case-sensitive file names. Make sure the import statement in `App.jsx` matches the actual file name case:

```javascript
// Correct import (lowercase 's')
import Signup from './pages/signup';
```

Also, ensure there's only one signup component file in the `frontend/src/pages` directory with the correct case.

Similarly, if you encounter an error like "Could not resolve '../Api' from 'src/pages/UserProfile.jsx'", it's due to the same issue with the API file. Make sure all import statements for the API file use the correct case:

```javascript
// Correct import (lowercase 'a')
import { getUserProfile, changePassword, requestPasswordReset } from '../api';
```

Also, ensure there's only one API file in the `frontend/src` directory with the correct case (`api.js`).