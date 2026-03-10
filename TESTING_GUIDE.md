# High Street Gym - Complete Testing Guide

## Overview
This guide provides step-by-step instructions to test all CRUD operations and functionality for the High Street Gym application after renaming sessions to timetables and replacing profile with blogs.

## Test Credentials
```
Admin:   admin22@gym.com / admin12322
Trainer: trainer22@gym.com / trainer12322
Member:  member@gym22.com / member12322
```

## Pre-Testing Setup

### 1. Start Backend Server
```bash
cd /Users/TAYAB/Advantures/Business/NeuroApp/Customers/shakila_gym_pjt/backend
npm install
npm start
```
Backend should run on: `http://localhost:3000`

### 2. Start Frontend Server
```bash
cd /Users/TAYAB/Advantures/Business/NeuroApp/Customers/shakila_gym_pjt/html-version
python3 -m http.server 8080
```
Frontend should run on: `http://localhost:8080`

---

## GUEST ROLE TESTING

### Test 1: Homepage
1. Navigate to `http://localhost:8080/pages/guest/index.html`
2. ✅ Verify page loads correctly
3. ✅ Check navigation links work
4. ✅ Verify "Get Started" button redirects to login

### Test 2: Registration
1. Go to `http://localhost:8080/pages/guest/register.html`
2. Fill in registration form:
   - First Name: Test
   - Last Name: User
   - Email: testuser@gym.com
   - Password: test12345
   - Role: Member
3. ✅ Click "Create Account"
4. ✅ Verify success message
5. ✅ Verify redirect to login page

### Test 3: Login
1. Go to `http://localhost:8080/pages/guest/login.html`
2. ✅ Verify "Forgot password?" link is REMOVED
3. Login with member credentials
4. ✅ Verify redirect to member dashboard

### Test 4: Guest Blog Viewing
1. Go to `http://localhost:8080/pages/guest/blog.html`
2. ✅ Verify blog posts are displayed
3. ✅ Click on a blog post
4. ✅ Verify blog detail page loads correctly

---

## MEMBER ROLE TESTING

### Test 5: Member Dashboard
1. Login as member
2. Navigate to `http://localhost:8080/pages/member/dashboard.html`
3. ✅ Verify dashboard loads with stats
4. ✅ Check navigation shows: Dashboard, Timetables, Bookings, Blogs
5. ✅ Verify "Profile" link is REMOVED from navigation
6. ✅ Verify stats display correctly (Total Bookings, Completed Timetables, etc.)

### Test 6: View Timetables (formerly Sessions)
1. Click "Timetables" in navigation
2. Navigate to `http://localhost:8080/pages/member/timetables.html`
3. ✅ Verify page title shows "Timetables" not "Sessions"
4. ✅ Verify timetable list displays
5. ✅ Check filters work (Activity, Trainer, Date)
6. ✅ Verify "Book" button appears on available timetables

### Test 7: Book a Timetable
1. From timetables page, click "Book" on an available timetable
2. ✅ Verify booking confirmation modal appears
3. ✅ Confirm booking
4. ✅ Verify success message
5. ✅ Check timetable appears in "My Bookings"

### Test 8: View Bookings
1. Navigate to `http://localhost:8080/pages/member/bookings.html`
2. ✅ Verify all bookings are listed
3. ✅ Check tabs work (Upcoming, Past, All)
4. ✅ Verify booking details are correct
5. ✅ Test "Cancel Booking" functionality

### Test 9: Member Blogs (formerly Profile)
1. Navigate to `http://localhost:8080/pages/member/blogs.html`
2. ✅ Verify page shows "Fitness Blogs" not "Profile"
3. ✅ Verify blog posts are displayed
4. ✅ Check "Write Blog Post" button exists
5. ✅ Click on a blog to read details

### Test 10: Create Blog Post (Member)
1. From blogs page, click "+ Write Blog Post"
2. Navigate to `http://localhost:8080/pages/member/create-blog.html`
3. Fill in:
   - Title: My Fitness Journey
   - Content: This is my story...
4. ✅ Click "Publish Blog"
5. ✅ Verify success message
6. ✅ Verify blog appears in blogs list

---

## TRAINER ROLE TESTING

### Test 11: Trainer Dashboard
1. Login as trainer
2. Navigate to `http://localhost:8080/pages/trainer/dashboard.html`
3. ✅ Verify dashboard loads with stats
4. ✅ Check navigation shows: Dashboard, My Timetables, Blogs
5. ✅ Verify "Profile" link is REMOVED
6. ✅ Verify stats display (Total Timetables, Upcoming Timetables, Participants, Blog Posts)

### Test 12: View Trainer Timetables
1. Click "My Timetables" in navigation
2. Navigate to `http://localhost:8080/pages/trainer/timetables.html`
3. ✅ Verify page title shows "My Timetables" not "My Sessions"
4. ✅ Verify timetable list displays
5. ✅ Check tabs work (Upcoming, Past, All Timetables)
6. ✅ Verify "Create New Timetable" button exists

### Test 13: Create Timetable (formerly Create Session)
1. Click "+ Create New Timetable"
2. Navigate to `http://localhost:8080/pages/trainer/create-timetable.html`
3. ✅ Verify page title shows "Create New Timetable"
4. Fill in form:
   - Timetable Name: Morning HIIT
   - Activity: Select from dropdown (VERIFY DROPDOWN WORKS)
   - Location: Select from dropdown
   - Date: Tomorrow's date
   - Time: 09:00
   - Duration: 60
   - Max Participants: 10
   - Description: High intensity training
5. ✅ Click "Create Timetable"
6. ✅ Verify success message
7. ✅ Verify redirect to timetables page
8. ✅ Verify new timetable appears in list

### Test 14: Edit Timetable
1. From timetables page, click "Edit" on a timetable
2. Navigate to `http://localhost:8080/pages/trainer/edit-timetable.html?id=X`
3. ✅ Verify form is pre-populated with timetable data
4. ✅ Modify some fields
5. ✅ Click "Update Timetable"
6. ✅ Verify success message
7. ✅ Verify changes are saved

### Test 15: View Timetable Bookings
1. From timetables page, click "View Bookings"
2. Navigate to `http://localhost:8080/pages/trainer/timetable-bookings.html?id=X`
3. ✅ Verify page title shows "Timetable Bookings"
4. ✅ Verify list of members who booked
5. ✅ Verify participant count is correct

### Test 16: Delete Timetable
1. From timetables page, click "Delete" on a timetable
2. ✅ Verify confirmation modal appears
3. ✅ Confirm deletion
4. ✅ Verify success message
5. ✅ Verify timetable is removed from list

### Test 17: Trainer Blogs (formerly Profile)
1. Navigate to `http://localhost:8080/pages/trainer/blogs.html`
2. ✅ Verify page shows "My Blogs" not "Profile"
3. ✅ Verify trainer's blog posts are displayed
4. ✅ Check "Create New Blog" button exists
5. ✅ Verify edit/delete options for own blogs

### Test 18: Create Blog Post (Trainer)
1. From blogs page, click "Create New Blog"
2. Fill in blog details
3. ✅ Click "Publish"
4. ✅ Verify blog appears in list
5. ✅ Verify blog is visible to members

### Test 19: Edit Blog Post (Trainer)
1. From blogs page, click "Edit" on a blog
2. ✅ Modify content
3. ✅ Save changes
4. ✅ Verify updates are saved

### Test 20: Delete Blog Post (Trainer)
1. From blogs page, click "Delete" on a blog
2. ✅ Confirm deletion
3. ✅ Verify blog is removed

---

## ADMIN ROLE TESTING

### Test 21: Admin Dashboard
1. Login as admin
2. Navigate to `http://localhost:8080/pages/admin/dashboard.html`
3. ✅ Verify dashboard loads with system stats
4. ✅ Check navigation shows: Dashboard, Users, Timetables, Activities, Locations, Bookings
5. ✅ Verify all stats display correctly
6. ✅ Check "Recent Timetables" section (not "Recent Sessions")

### Test 22: Manage Users (CRUD)
1. Navigate to `http://localhost:8080/pages/admin/users.html`
2. ✅ Verify users list displays
3. ✅ Test search functionality
4. ✅ Test role filter (All, Members, Trainers, Admins)

**Create User:**
1. Click "+ Add New User"
2. Navigate to `http://localhost:8080/pages/admin/add-edit-user.html`
3. Fill in user details
4. ✅ Click "Create User"
5. ✅ Verify user appears in list

**Edit User:**
1. Click "Edit" on a user
2. ✅ Modify details
3. ✅ Save changes
4. ✅ Verify updates are saved

**Delete User:**
1. Click "Delete" on a user
2. ✅ Confirm deletion
3. ✅ Verify user is removed

### Test 23: Manage Timetables (Admin)
1. Navigate to `http://localhost:8080/pages/admin/timetables.html`
2. ✅ Verify page title shows "Manage Timetables" not "Manage Sessions"
3. ✅ Verify all timetables from all trainers are displayed
4. ✅ Test filters (Activity, Trainer, Date)
5. ✅ Test delete functionality

### Test 24: Manage Activities (CRUD)
1. Navigate to `http://localhost:8080/pages/admin/activities.html`
2. ✅ Verify activities list displays

**Create Activity:**
1. Click "+ Add New Activity"
2. Fill in:
   - Name: Pilates
   - Description: Low impact exercise
   - Duration: 45 minutes
3. ✅ Click "Create Activity"
4. ✅ Verify activity appears in list

**Edit Activity:**
1. Click "Edit" on an activity
2. ✅ Modify details
3. ✅ Save changes
4. ✅ Verify updates are saved

**Delete Activity:**
1. Click "Delete" on an activity
2. ✅ Confirm deletion
3. ✅ Verify activity is removed

### Test 25: Manage Locations (CRUD)
1. Navigate to `http://localhost:8080/pages/admin/locations.html`
2. ✅ Verify locations list displays

**Create Location:**
1. Click "+ Add New Location"
2. Fill in location details
3. ✅ Click "Create Location"
4. ✅ Verify location appears in list

**Edit Location:**
1. Click "Edit" on a location
2. ✅ Modify details
3. ✅ Save changes
4. ✅ Verify updates are saved

**Delete Location:**
1. Click "Delete" on a location
2. ✅ Confirm deletion
3. ✅ Verify location is removed

### Test 26: View All Bookings
1. Navigate to `http://localhost:8080/pages/admin/bookings.html`
2. ✅ Verify all bookings from all members are displayed
3. ✅ Test filters and search
4. ✅ Verify booking details are correct

### Test 27: Admin Blog Management
1. Navigate to `http://localhost:8080/pages/admin/blog.html`
2. ✅ Verify all blogs from all users are displayed
3. ✅ Test delete functionality for any blog
4. ✅ Verify admin can manage all blogs

---

## CROSS-ROLE TESTING

### Test 28: Terminology Consistency
1. ✅ Search all pages for "Session" - should be "Timetable"
2. ✅ Search all pages for "Profile" - should be "Blogs" (for member/trainer)
3. ✅ Verify navigation menus are consistent across roles
4. ✅ Verify all links work correctly

### Test 29: Authentication & Authorization
1. ✅ Try accessing admin pages as member - should redirect
2. ✅ Try accessing trainer pages as member - should redirect
3. ✅ Try accessing member pages as guest - should redirect to login
4. ✅ Verify logout works from all roles

### Test 30: Data Integrity
1. ✅ Create a timetable as trainer
2. ✅ Book it as member
3. ✅ Verify booking appears in:
   - Member's bookings
   - Trainer's timetable bookings
   - Admin's all bookings
4. ✅ Cancel booking as member
5. ✅ Verify cancellation reflects everywhere

---

## CRITICAL FIXES VERIFICATION

### Fix 1: Activity Selection in Create Timetable
1. Navigate to `http://localhost:8080/pages/trainer/create-timetable.html`
2. ✅ Click on Activity dropdown
3. ✅ Verify dropdown opens and shows activities
4. ✅ Verify you can select an activity
5. ✅ Verify selected activity is highlighted

### Fix 2: Timetables Loading (formerly Sessions)
1. Navigate to `http://localhost:8080/pages/trainer/timetables.html`
2. ✅ Verify loading spinner appears briefly
3. ✅ Verify timetables load successfully (no infinite spinner)
4. ✅ Verify "Loading timetables..." message (not "Loading sessions...")

### Fix 3: Forgot Password Removed
1. Navigate to `http://localhost:8080/pages/guest/login.html`
2. ✅ Verify "Forgot password?" link is NOT present
3. ✅ Verify only "Remember me" checkbox exists

---

## BACKEND API ENDPOINTS TO VERIFY

### Timetables (formerly Sessions)
- `GET /api/sessions` - Get all timetables
- `GET /api/sessions/trainer/:id` - Get trainer's timetables
- `POST /api/sessions` - Create timetable
- `PUT /api/sessions/:id` - Update timetable
- `DELETE /api/sessions/:id` - Delete timetable

### Blogs
- `GET /api/blogs` - Get all blogs
- `GET /api/blogs/user/:id` - Get user's blogs
- `POST /api/blogs` - Create blog
- `PUT /api/blogs/:id` - Update blog
- `DELETE /api/blogs/:id` - Delete blog

### Bookings
- `GET /api/bookings` - Get all bookings (admin)
- `GET /api/bookings/my-bookings` - Get user's bookings
- `POST /api/bookings` - Create booking
- `DELETE /api/bookings/:id` - Cancel booking

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

### Activities
- `GET /api/activities` - Get all activities
- `POST /api/activities` - Create activity (admin)
- `PUT /api/activities/:id` - Update activity (admin)
- `DELETE /api/activities/:id` - Delete activity (admin)

### Locations
- `GET /api/locations` - Get all locations
- `POST /api/locations` - Create location (admin)
- `PUT /api/locations/:id` - Update location (admin)
- `DELETE /api/locations/:id` - Delete location (admin)

---

## TROUBLESHOOTING

### Issue: Pages not loading
- Check backend server is running on port 3000
- Check frontend server is running on port 8080
- Check browser console for errors

### Issue: Authentication errors
- Clear localStorage: `localStorage.clear()`
- Re-login with correct credentials
- Check token is being sent in Authorization header

### Issue: Data not displaying
- Check API endpoints are responding
- Check browser network tab for failed requests
- Verify database has data

### Issue: Dropdown not working
- Check browser console for JavaScript errors
- Verify RoleNavigator script is loaded
- Check activity/location data exists in database

---

## SUCCESS CRITERIA

All tests should pass with ✅ marks. The application should:

1. ✅ Use "Timetables" terminology instead of "Sessions" everywhere
2. ✅ Use "Blogs" instead of "Profile" for member and trainer roles
3. ✅ Have working CRUD operations for all entities
4. ✅ Have proper role-based access control
5. ✅ Have no "Forgot password?" link on login page
6. ✅ Have working activity dropdown in create timetable form
7. ✅ Have no infinite loading spinners
8. ✅ Have all navigation links working correctly
9. ✅ Have consistent UI/UX across all pages
10. ✅ Have proper error handling and user feedback

---

## COMPLETION CHECKLIST

- [ ] All Guest tests passed (Tests 1-4)
- [ ] All Member tests passed (Tests 5-10)
- [ ] All Trainer tests passed (Tests 11-20)
- [ ] All Admin tests passed (Tests 21-27)
- [ ] All Cross-role tests passed (Tests 28-30)
- [ ] All Critical fixes verified
- [ ] All Backend API endpoints working
- [ ] No console errors
- [ ] No broken links
- [ ] Consistent terminology throughout

---

**Testing Date:** _____________
**Tested By:** _____________
**Status:** _____________
**Notes:** _____________
