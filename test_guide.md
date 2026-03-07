# API Integration Testing Guide

## ✅ Backend is Running
Your backend API is now live at: `http://localhost:3000/api`

## 🧪 Testing Steps

### 1. Test Login with Database Credentials

Open your browser and navigate to:
```
http://localhost:8000/pages/guest/login.html
```

**Test with these real database accounts:**

| Email              | Password    | Role    |
|-------------------|-------------|---------|
| member@gym.com    | member123   | Member  |
| trainer@gym.com   | trainer123  | Trainer |
| admin@gym.com     | admin123    | Admin   |

### 2. What Should Happen

1. **Enter credentials** → Click "Sign In"
2. **Backend processes login** → MySQL checks database
3. **JWT token generated** → Stored in browser localStorage
4. **Redirect to dashboard** → Based on user role
5. **Data loads from MySQL** → Real data, not fake!

### 3. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Should show API requests
- **Network tab**: Should show POST to `/api/auth/login`
- **Application tab** → **Local Storage**: Should have `token` and `user`

### 4. Test Registration

Navigate to:
```
http://localhost:8000/pages/guest/register.html
```

Create a new account:
- Fill out the form
- Click "Create Account"
- New user saved to MySQL database!
- Check database:

```bash
mysql -u root high_street_gym -e "SELECT * FROM users;"
```

### 5. Current Status

✅ **Working:**
- Login with real MySQL database
- Registration creates real users
- JWT authentication
- Role-based redirects
- Protected pages

⏳ **Still Using Hardcoded Data:**
- Sessions list (member/sessions.html)
- Bookings list (member/bookings.html)
- Trainer sessions
- Dashboard stats

## 🔧 Next Steps to Complete Integration

### Step 1: Update Member Sessions Page

File: `pages/member/sessions.html`

Replace the hardcoded sessions array with API call:

```javascript
// Instead of hardcoded sessions = [...]
async function loadSessions() {
    try {
        const data = await apiRequest('/sessions');
        if (data && data.success) {
            displaySessions(data.sessions);
        }
    } catch (error) {
        console.error('Error loading sessions:', error);
        showToast('Failed to load sessions', 'error');
    }
}

// Call on page load
loadSessions();
```

### Step 2: Update Bookings Page

File: `pages/member/bookings.html`

```javascript
async function loadBookings() {
    try {
        const data = await apiRequest('/bookings/my-bookings');
        if (data && data.success) {
            displayBookings(data.bookings);
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}
```

### Step 3: Implement Create Booking

```javascript
async function createBooking(sessionId) {
    try {
        const data = await apiRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify({ sessionId })
        });
        
        if (data && data.success) {
            showToast('Booking created successfully!', 'success');
            loadBookings(); // Refresh list
        } else {
            showToast(data.message || 'Booking failed', 'error');
        }
    } catch (error) {
        console.error('Booking error:', error);
        showToast('Failed to create booking', 'error');
    }
}
```

## 🎯 Priority Integration Order

1. ✅ **Login/Register** - DONE
2. **Member Sessions** - Load from API
3. **Member Bookings** - Load and create via API
4. **Trainer Sessions** - CRUD operations via API
5. **Dashboard Stats** - Calculate from real data
6. **Blog Posts** - Full CRUD via API

## 🐛 Troubleshooting

### Login fails with network error
- Check backend is running: `npm run dev` in backend folder
- Check backend terminal for errors
- Verify MySQL is running: `brew services list | grep mysql`

### CORS errors
- Backend already configured for `http://localhost:8000`
- If using different port, update `.env` FRONTEND_URL

### Token invalid errors
- Clear localStorage: Browser DevTools → Application → Local Storage → Clear
- Try logging in again

## 📊 Database Check Commands

```bash
# Check users
mysql -u root high_street_gym -e "SELECT user_id, email, first_name, last_name, role FROM users;"

# Check sessions
mysql -u root high_street_gym -e "SELECT * FROM sessions;"

# Check bookings
mysql -u root high_street_gym -e "SELECT * FROM bookings;"
```

## ✨ What You've Achieved

- ✅ MySQL database connected
- ✅ Node.js/Express backend running
- ✅ JWT authentication working
- ✅ Real login/register with database
- ✅ API endpoints ready for all features
- ✅ Frontend connected to backend

**Next: Complete the remaining page integrations to fully replace hardcoded data!**