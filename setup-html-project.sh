#!/bin/bash
# setup-html-project.sh - Create complete HTML project structure

# Create main directories
mkdir -p html-version/{css,js,images,pages/{guest,member,trainer,admin}}

# Create CSS files
touch html-version/css/styles.css
touch html-version/css/tailwind.css

# Create JavaScript files
touch html-version/js/main.js
touch html-version/js/auth.js
touch html-version/js/navigation.js

# Guest pages
touch html-version/pages/guest/index.html
touch html-version/pages/guest/login.html
touch html-version/pages/guest/register.html
touch html-version/pages/guest/blog.html
touch html-version/pages/guest/blog-detail.html
touch html-version/pages/guest/reset-password.html

# Member pages
touch html-version/pages/member/dashboard.html
touch html-version/pages/member/profile.html
touch html-version/pages/member/sessions.html
touch html-version/pages/member/book-session.html
touch html-version/pages/member/bookings.html
touch html-version/pages/member/create-blog.html

# Trainer pages
touch html-version/pages/trainer/dashboard.html
touch html-version/pages/trainer/sessions.html
touch html-version/pages/trainer/create-session.html
touch html-version/pages/trainer/edit-session.html
touch html-version/pages/trainer/session-bookings.html
touch html-version/pages/trainer/blog.html
touch html-version/pages/trainer/profile.html

# Admin pages
touch html-version/pages/admin/dashboard.html
touch html-version/pages/admin/users.html
touch html-version/pages/admin/add-edit-user.html
touch html-version/pages/admin/sessions.html
touch html-version/pages/admin/activities.html
touch html-version/pages/admin/locations.html
touch html-version/pages/admin/bookings.html
touch html-version/pages/admin/blog.html

echo "HTML project structure created successfully!"