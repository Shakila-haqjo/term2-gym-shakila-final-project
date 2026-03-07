#!/bin/bash
# setup-backend.sh - Create Node.js/Express backend structure

mkdir -p backend/{config,controllers,middleware,models,routes,utils,public}
mkdir -p backend/controllers/{auth,user,session,booking,blog,activity,location}

# Create placeholder files
touch backend/server.js
touch backend/package.json
touch backend/.env.example
touch backend/.gitignore

# Config files
touch backend/config/database.js
touch backend/config/env.js

# Middleware
touch backend/middleware/auth.js
touch backend/middleware/errorHandler.js
touch backend/middleware/validator.js

# Models
touch backend/models/User.js
touch backend/models/Session.js
touch backend/models/Booking.js
touch backend/models/Activity.js
touch backend/models/Location.js
touch backend/models/Blog.js

# Controllers
touch backend/controllers/auth/authController.js
touch backend/controllers/user/userController.js
touch backend/controllers/session/sessionController.js
touch backend/controllers/booking/bookingController.js
touch backend/controllers/blog/blogController.js
touch backend/controllers/activity/activityController.js
touch backend/controllers/location/locationController.js

# Routes
touch backend/routes/authRoutes.js
touch backend/routes/userRoutes.js
touch backend/routes/sessionRoutes.js
touch backend/routes/bookingRoutes.js
touch backend/routes/blogRoutes.js
touch backend/routes/activityRoutes.js
touch backend/routes/locationRoutes.js

# Utils
touch backend/utils/hashPassword.js
touch backend/utils/generateToken.js

# Database
touch backend/database.sql

echo "Backend structure created successfully!"