# HIGH STREET GYM - COMPLETE TESTING GUIDE

## 🚀 HOW TO RUN THE PROJECT

### Step 1: Setup
```bash
cd html-version
python3 -m http.server 8000
```

### Step 2: Open in Browser
```
http://localhost:8000/pages/guest/index.html
```

---

## 🧪 TESTING ALL ROLES - STEP BY STEP

### 🏠 **TEST 1: GUEST PAGES** (No Login Required)

#### Home Page
1. Visit: `http://localhost:8000/pages/guest/index.html`
2. **Verify:**
   - Hero section displays
   - Features cards show (Expert Trainers, Flexible Sessions, Personalized Programs)
   - Activities section shows (Yoga, Pilates, Abs, HIIT)
   - Footer displays with links

#### Blog Listing
1. Click "Blog" in navbar
2. **Verify:**
   - 6 blog posts display in grid
   - Search bar works
   - Category filter dropdown works
   - Click any blog post to go to detail page

#### Blog Detail
1. Click any blog post
2. **Verify:**
   - Full article displays
   - Author info shows
   - "Back to Blog" button works
   - Share buttons display

#### Login Page
1. Click "Login" button
2. **Verify:**
   - Email, Password, and Role dropdown show
   - "Remember me" checkbox works
   - "Forgot password?" link goes to reset page

#### Register Page
1. Click "Sign Up" button
2. **Verify:**
   - All form fields display (First Name, Last Name, Email, Phone, Password, Confirm Password)
   - Terms checkbox required
   - Form validation works
   - "Sign In" link goes back to login

#### Reset Password
1. From login, click "Forgot password?"
2. **Verify:**
   - Email input displays
   - "Send Reset Link" button works
   - "Back to Login" link works

---

### 👤 **TEST 2: MEMBER ROLE**

#### Login as Member
**Credentials:**
- Email: `member@gym.com`
- Password: `password`
- Role: `Member`

#### Member Dashboard
**URL:** `pages/member/dashboard.html`

1. **After login, verify:**
   - Redirects to member dashboard
   - Shows "Welcome Back, member!" (or your email username)
   - Stats cards display:
     - Total Bookings: 24
     - Completed Sessions: 18
     - Upcoming Sessions: 6
     - Monthly Goal: 75%
   - Upcoming sessions list shows 3 sessions
   - Quick actions panel displays
   - Activity summary (This Week) shows

2. **Test Sidebar Navigation:**
   - Click "My Profile" → Goes to profile page
   - Click "Sessions" → Goes to sessions page
   - Click "My Bookings" → Goes to bookings page
   - Click "Blog" → Goes to create blog page
   - Click "Dashboard" → Returns to dashboard
   - Click "Logout" → Returns to home page

#### Member Profile
**URL:** `pages/member/profile.html`

1. **Verify:**
   - Profile picture section displays
   - Personal information form shows (First Name, Last Name, Email, Phone, Address)
   - Change password section displays
   - "Save Changes" button works (shows toast notification)

#### Member Sessions
**URL:** `pages/member/sessions.html`

1. **Verify:**
   - Filter dropdowns work (Activity, Trainer, Date, Time)
   - 6 sessions display in grid
   - Each session shows:
     - Activity name
     - Trainer name
     - Date, Time, Duration
     - Location
     - "X spots left" badge
     - "Book Session" button
   - Click "Book Session" → Shows confirmation dialog
   - After confirming → Shows success toast
   - After booking → Redirects to bookings page

#### Member Bookings
**URL:** `pages/member/bookings.html`

1. **Verify Tabs:**
   - "Upcoming" tab (active by default) shows 3 bookings
   - Click "Past" tab → Shows 2 completed bookings
   - Click "Cancelled" tab → Shows 1 cancelled booking
   - Tab switching works correctly

2. **Verify Booking Cards:**
   - Each booking shows activity, trainer, date, time, location
   - Upcoming bookings have "Cancel" button
   - Click "Cancel" → Shows confirmation dialog
   - After cancelling → Booking moves to "Cancelled" tab
   - Past/Cancelled bookings have no action buttons

---

### 💪 **TEST 3: TRAINER ROLE**

#### Login as Trainer
**Credentials:**
- Email: `trainer@gym.com`
- Password: `password`
- Role: `Trainer`

#### Trainer Dashboard
**URL:** `pages/trainer/dashboard.html`

1. **After login, verify:**
   - Redirects to trainer dashboard
   - Shows "Welcome Back, trainer!" (or your email username)
   - Stats cards display:
     - Total Sessions: 42
     - Active Members: 128
     - Upcoming This Week: 12
     - Average Rating: 4.9
   - "My Upcoming Sessions" shows 3 sessions with enrollment counts
   - Quick actions panel displays:
     - Create Session
     - View All Sessions
     - Write Blog Post
   - "This Week" summary shows stats

2. **Test Sidebar Navigation:**
   - Sidebar shows "Trainer Portal"
   - Menu items: Dashboard, My Sessions, Blog Posts, Profile
   - Click each menu item → Goes to correct page
   - Click "Logout" → Returns to home page

3. **Test Quick Actions:**
   - Click "Create Session" → Goes to create-session.html
   - Click "View All Sessions" → Goes to sessions.html
   - Click "Write Blog Post" → Goes to blog.html

4. **Test Session Details:**
   - Each upcoming session shows enrollment (e.g., "8/10 enrolled")
   - Click "View Details" → Goes to session-bookings.html

---

### 🔧 **TEST 4: ADMIN ROLE**

#### Login as Admin
**Credentials:**
- Email: `admin@gym.com`
- Password: `password`
- Role: `Admin`

#### Admin Dashboard
**URL:** `pages/admin/dashboard.html`

1. **After login, verify:**
   - Redirects to admin dashboard
   - Shows "Admin Dashboard" header
   - Stats cards display:
     - Total Users: 1,248 (+12% this month)
     - Active Sessions: 156 (+8% this week)
     - Total Bookings: 3,842 (+15% this month)
     - Revenue: $45.2K (+22% this month)
   - "Recent Activity" shows 5 recent activities with icons
   - "User Distribution" shows breakdown:
     - Members: 956 (76%)
     - Trainers: 42 (3%)
     - Admins: 8 (1%)
   - Quick Actions panel displays

2. **Test Sidebar Navigation:**
   - Sidebar shows "Admin Portal"
   - Menu items display:
     - Dashboard
     - Users
     - Sessions
     - Activities
     - Locations
     - Bookings
     - Blog
   - Click each menu item → Goes to correct page
   - Click "Logout" → Returns to home page

3. **Test Quick Actions:**
   - Click "Manage Users" → Goes to users.html
   - Click "View Sessions" → Goes to sessions.html
   - Click "Check Bookings" → Goes to bookings.html

---

## ✅ COMPLETE TESTING CHECKLIST

### Guest Features
- [ ] Home page loads correctly
- [ ] Blog listing shows all posts
- [ ] Blog detail page works
- [ ] Login page accepts credentials
- [ ] Register form validates
- [ ] Password reset page works
- [ ] Navigation between pages works

### Member Features
- [ ] Login as member works
- [ ] Dashboard displays correctly
- [ ] Profile page loads and form works
- [ ] Sessions page shows available sessions
- [ ] Can book a session
- [ ] Bookings page shows all bookings
- [ ] Can cancel a booking
- [ ] Tab switching works (Upcoming/Past/Cancelled)
- [ ] Logout returns to home

### Trainer Features
- [ ] Login as trainer works
- [ ] Trainer dashboard displays correctly
- [ ] Stats cards show trainer-specific data
- [ ] Upcoming sessions show enrollment counts
- [ ] Quick actions work
- [ ] Can navigate to create session
- [ ] Sidebar navigation works
- [ ] Logout returns to home

### Admin Features
- [ ] Login as admin works
- [ ] Admin dashboard displays correctly
- [ ] System stats display correctly
- [ ] Recent activity shows
- [ ] User distribution chart displays
- [ ] Quick actions work
- [ ] Full sidebar with all admin menu items
- [ ] Logout returns to home

---

## 🎯 DEMO CREDENTIALS SUMMARY

| Role    | Email              | Password | Dashboard URL                  |
|---------|-------------------|----------|--------------------------------|
| Member  | member@gym.com    | password | pages/member/dashboard.html    |
| Trainer | trainer@gym.com   | password | pages/trainer/dashboard.html   |
| Admin   | admin@gym.com     | password | pages/admin/dashboard.html     |

---

## 🔍 TROUBLESHOOTING

### Problem: Pages don't load
**Solution:** Make sure you're running the HTTP server and accessing via `http://localhost:8000`

### Problem: Login doesn't work
**Solution:** 
1. Check you entered exact credentials (case-sensitive)
2. Check you selected correct role in dropdown
3. Open browser console (F12) to see any errors

### Problem: Icons don't show
**Solution:** Make sure you have internet connection (Lucide icons load from CDN)

### Problem: Styling looks broken
**Solution:** Make sure you have internet connection (Tailwind CSS loads from CDN)

### Problem: Navigation doesn't work
**Solution:** Check that all files are in correct directories as shown in structure

---

## 📁 FILE STRUCTURE REFERENCE

```
html-version/
├── pages/
│   ├── guest/
│   │   ├── index.html          ✅ Complete
│   │   ├── login.html          ✅ Complete
│   │   ├── register.html       ✅ Complete
│   │   ├── blog.html           ✅ Complete
│   │   ├── blog-detail.html    ✅ Complete
│   │   └── reset-password.html ✅ Complete
│   ├── member/
│   │   ├── dashboard.html      ✅ Complete
│   │   ├── profile.html        ✅ Complete
│   │   ├── sessions.html       ✅ Complete
│   │   └── bookings.html       ✅ Complete
│   ├── trainer/
│   │   └── dashboard.html      ✅ Complete
│   └── admin/
│       └── dashboard.html      ✅ Complete
├── css/
│   └── styles.css              ✅ Complete
└── js/
    ├── main.js                 ✅ Complete
    └── auth.js                 ✅ Complete
```

---

## 🎨 TESTING VISUAL ELEMENTS

### Colors (Verify these appear correctly)
- **Primary:** Indigo/Purple gradient (buttons, active states)
- **Success:** Green badges (confirmed bookings, positive stats)
- **Warning:** Orange badges (pending items)
- **Error:** Red buttons (cancel, delete, logout)

### Responsive Design
1. Test on desktop (>1024px)
2. Test on tablet (768px-1024px)
3. Test on mobile (<768px)
4. Verify sidebar collapses/adapts on mobile

### Interactive Elements
- [ ] Buttons change color on hover
- [ ] Cards have hover effects (shadow, slight lift)
- [ ] Forms show focus states (blue ring)
- [ ] Toast notifications appear and disappear
- [ ] Confirmation dialogs work

---

## 📝 NOTES FOR EACH ROLE

### Member Testing Focus:
- Booking flow (Sessions → Book → Bookings)
- Profile management
- Dashboard stats accuracy
- Booking cancellation

### Trainer Testing Focus:
- Session management interface
- Enrollment tracking
- Quick actions functionality
- Different stats from member

### Admin Testing Focus:
- System-wide statistics
- User distribution visualization
- Recent activity feed
- Access to all management sections

---

## 🚀 NEXT STEPS AFTER TESTING

1. **Verify all pages work** with the credentials above
2. **Check all navigation** between pages
3. **Test all interactive elements** (buttons, forms, tabs)
4. **Report any issues** you find
5. **Complete remaining pages** using the same patterns

---

## ⚡ QUICK TEST WORKFLOW

### 5-Minute Test:
1. Open home page → Check it loads
2. Login as member → Check dashboard
3. Click Sessions → Book a session
4. Logout
5. Login as trainer → Check dashboard
6. Logout
7. Login as admin → Check dashboard
8. Done!

### Complete Test (15 minutes):
Follow the full testing checklist above for each role.

---

**Last Updated:** March 2024
**Version:** 1.0
**Status:** Ready for Testing