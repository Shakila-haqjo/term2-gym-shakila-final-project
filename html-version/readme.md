<!-- html-version/readme.md -->
# High Street Gym - HTML/CSS/JS Version

Complete rewrite of the React-based gym management system in pure HTML, CSS (Tailwind CDN), and vanilla JavaScript.

## Project Structure

```
html-version/
├── css/
│   └── styles.css              # Custom CSS styles
├── js/
│   ├── main.js                 # Main utilities and navigation
│   └── auth.js                 # Authentication logic
├── images/                     # Image assets
└── pages/
    ├── guest/                  # Public pages
    │   ├── index.html         # Home page
    │   ├── login.html         # Login page
    │   ├── register.html      # Registration page
    │   ├── blog.html          # Blog listing
    │   ├── blog-detail.html   # Single blog post
    │   └── reset-password.html
    ├── member/                # Member dashboard pages
    │   ├── dashboard.html
    │   ├── profile.html
    │   ├── sessions.html
    │   ├── book-session.html
    │   ├── bookings.html
    │   └── create-blog.html
    ├── trainer/               # Trainer dashboard pages
    │   ├── dashboard.html
    │   ├── sessions.html
    │   ├── create-session.html
    │   ├── edit-session.html
    │   ├── session-bookings.html
    │   ├── blog.html
    │   └── profile.html
    └── admin/                 # Admin dashboard pages
        ├── dashboard.html
        ├── users.html
        ├── add-edit-user.html
        ├── sessions.html
        ├── activities.html
        ├── locations.html
        ├── bookings.html
        └── blog.html
```

## Features

### Completed Pages

✅ **Guest Pages:**
- Home page with hero section, features, activities
- Login page with role selection (member/trainer/admin)
- Registration page with form validation
- Blog listing with search and categories
- Password reset page

✅ **Member Dashboard:**
- Dashboard with stats cards and upcoming sessions
- Sidebar navigation
- Quick actions panel
- Activity summary

### Technology Stack

- **HTML5** - Semantic markup
- **Tailwind CSS** - Via CDN for rapid styling
- **Vanilla JavaScript** - No framework dependencies
- **Lucide Icons** - Icon library via CDN
- **LocalStorage** - Client-side session management

### Key Features

1. **Role-Based Access Control**
   - Guest (unauthenticated)
   - Member
   - Trainer
   - Admin

2. **Authentication System**
   - Login/Register forms
   - Session management using localStorage
   - Page protection middleware
   - Role-based redirects

3. **Responsive Design**
   - Mobile-first approach
   - Tailwind CSS utilities
   - Responsive grids and layouts

4. **Reusable Components**
   - Navigation bars
   - Sidebars
   - Cards
   - Forms
   - Modals (to be implemented)

## How to Run

### Option 1: Direct File Opening
Simply open any HTML file in your browser:
```bash
open pages/guest/index.html
```

### Option 2: Local Server (Recommended)
Use a simple HTTP server to avoid CORS issues:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then navigate to: `http://localhost:8000/pages/guest/index.html`

## Demo Credentials

**Member:**
- Email: member@gym.com
- Password: password

**Trainer:**
- Email: trainer@gym.com
- Password: password

**Admin:**
- Email: admin@gym.com
- Password: password

## Pages to be Created

The following pages need to be created following the same pattern:

### Guest Pages (Remaining)
- [ ] blog-detail.html
- [ ] reset-password.html

### Member Pages (Remaining)
- [ ] profile.html
- [ ] sessions.html
- [ ] book-session.html
- [ ] bookings.html
- [ ] create-blog.html

### Trainer Pages (All)
- [ ] dashboard.html
- [ ] sessions.html
- [ ] create-session.html
- [ ] edit-session.html
- [ ] session-bookings.html
- [ ] blog.html
- [ ] profile.html

### Admin Pages (All)
- [ ] dashboard.html
- [ ] users.html
- [ ] add-edit-user.html
- [ ] sessions.html
- [ ] activities.html
- [ ] locations.html
- [ ] bookings.html
- [ ] blog.html

## Development Guide

### Creating New Pages

1. **Copy Template Structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title - High Street Gym</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="../../css/styles.css">
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-gray-50">
  <!-- Content here -->
  
  <script src="../../js/main.js"></script>
  <script src="../../js/auth.js"></script>
  <script>
    lucide.createIcons();
  </script>
</body>
</html>
```

2. **For Authenticated Pages:**
Add protection at the bottom of your script:
```javascript
protectPage('member'); // or 'trainer' or 'admin'
```

3. **Use Sidebar for Dashboard Pages:**
Copy the sidebar structure from any dashboard page.

### JavaScript Utilities Available

**Navigation:**
```javascript
navigateTo('path/to/page.html')
```

**Toast Notifications:**
```javascript
showToast('Message here', 'success') // or 'error' or 'info'
```

**Authentication:**
```javascript
isLoggedIn()           // Check if user is logged in
getUserSession()       // Get current user data
getUserRole()          // Get user role
logout()              // Logout and redirect
protectPage('role')   // Protect page by role
```

**Date/Time Formatting:**
```javascript
formatDate('2024-03-20')    // Returns: March 20, 2024
formatTime('14:30')         // Returns: 2:30 PM
```

## Color Palette

```css
--primary: #4f46e5;         /* Indigo 600 */
--primary-hover: #4338ca;   /* Indigo 700 */
--destructive: #ef4444;     /* Red 500 */
--border: #e5e7eb;          /* Gray 200 */
--foreground: #111827;      /* Gray 900 */
--background: #ffffff;      /* White */
--muted: #f3f4f6;          /* Gray 100 */
--accent: #f9fafb;         /* Gray 50 */
```

## Next Steps

1. **Complete Remaining Pages** - Follow the pattern established in existing pages
2. **Add Backend Integration** - Replace localStorage with actual API calls
3. **Implement MySQL** - Connect to database for real data
4. **Add Form Validation** - Client-side validation for all forms
5. **Create Modals/Dialogs** - For confirmations and quick actions
6. **Add Charts** - Use Chart.js for dashboard analytics
7. **Implement Search/Filter** - For sessions, bookings, users
8. **Add Pagination** - For listing pages

## Converting to Node.js/Express

This HTML version can be easily integrated into a Node.js/Express application:

1. Move HTML files to `views/` directory
2. Rename `.html` to `.ejs`
3. Replace CDN links with local assets
4. Add EJS partials for header/footer/sidebar
5. Replace localStorage with Express sessions
6. Connect to MySQL database

## Notes

- All pages use Tailwind CSS via CDN for quick prototyping
- Icons are from Lucide Icons library
- Authentication is simulated using localStorage
- Data is currently static/mock data
- No backend or database required to run

## License

Proprietary - High Street Gym Management System