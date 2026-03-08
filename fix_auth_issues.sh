#!/bin/bash

# Script to fix authentication issues across all HTML pages

# Fix all pages with AuthGuard.protect to use RoleNavigator.protect
find /Users/TAYAB/Advantures/Business/NeuroApp/Customers/shakila_gym_pjt/html-version/pages -name "*.html" -type f -exec sed -i '' 's/AuthGuard\.protect/RoleNavigator.protect/g' {} +

# Fix all pages with AuthGuard.logout to use RoleNavigator.logout
find /Users/TAYAB/Advantures/Business/NeuroApp/Customers/shakila_gym_pjt/html-version/pages -name "*.html" -type f -exec sed -i '' 's/AuthGuard\.logout/RoleNavigator.logout/g' {} +

# Fix logout button selectors from getElementById('logoutBtn') to querySelector('[data-logout]')
find /Users/TAYAB/Advantures/Business/NeuroApp/Customers/shakila_gym_pjt/html-version/pages -name "*.html" -type f -exec sed -i '' "s/document\.getElementById('logoutBtn')/document.querySelector('[data-logout]')/g" {} +

echo "Authentication fixes applied to all HTML pages"
