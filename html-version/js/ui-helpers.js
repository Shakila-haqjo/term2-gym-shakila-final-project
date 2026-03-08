// html-version/js/ui-helpers.js
// Centralized UI helper functions for consistent UX across the app

const UIHelpers = {
    // Show loading state
    showLoading: function(containerId, message = 'Loading...') {
        console.log(`🔄 UIHelpers.showLoading('${containerId}')`);
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`⚠️ Container '${containerId}' not found`);
            return;
        }
        
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p class="mt-4 text-gray-600">${message}</p>
            </div>
        `;
        container.classList.remove('hidden');
    },

    // Show empty state
    showEmpty: function(containerId, message = 'No data available', actionText = null, actionUrl = null) {
        console.log(`📭 UIHelpers.showEmpty('${containerId}')`);
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`⚠️ Container '${containerId}' not found`);
            return;
        }
        
        let actionButton = '';
        if (actionText && actionUrl) {
            actionButton = `
                <a href="${actionUrl}" class="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    ${actionText}
                </a>
            `;
        }
        
        container.innerHTML = `
            <div class="text-center py-12">
                <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                <p class="mt-4 text-gray-600">${message}</p>
                ${actionButton}
            </div>
        `;
        container.classList.remove('hidden');
    },

    // Show error state with retry
    showError: function(containerId, message = 'Failed to load data', onRetry = null) {
        console.log(`❌ UIHelpers.showError('${containerId}')`);
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`⚠️ Container '${containerId}' not found`);
            return;
        }
        
        const retryButton = onRetry ? `
            <button onclick="(${onRetry.toString()})()" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Try Again
            </button>
        ` : '';
        
        container.innerHTML = `
            <div class="text-center py-12">
                <svg class="mx-auto h-16 w-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="mt-4 text-gray-600">${message}</p>
                ${retryButton}
            </div>
        `;
        container.classList.remove('hidden');
    },

    // Hide loading/empty/error and show content
    showContent: function(containerId) {
        console.log(`✅ UIHelpers.showContent('${containerId}')`);
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`⚠️ Container '${containerId}' not found`);
            return;
        }
        container.classList.remove('hidden');
    },

    // Hide container
    hide: function(containerId) {
        console.log(`🙈 UIHelpers.hide('${containerId}')`);
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`⚠️ Container '${containerId}' not found`);
            return;
        }
        container.classList.add('hidden');
    },

    // Handle API response with automatic state management
    handleApiResponse: async function(fetchPromise, options = {}) {
        const {
            loadingContainer,
            contentContainer,
            emptyContainer,
            emptyMessage = 'No data available',
            emptyAction = null,
            onSuccess,
            onError
        } = options;

        console.log('🔄 UIHelpers.handleApiResponse() called');

        try {
            // Show loading
            if (loadingContainer) this.showLoading(loadingContainer);
            if (contentContainer) this.hide(contentContainer);
            if (emptyContainer) this.hide(emptyContainer);

            const response = await fetchPromise;
            console.log('📥 API Response received:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('📦 Data parsed:', Array.isArray(data) ? `${data.length} items` : 'object');

            // Hide loading
            if (loadingContainer) this.hide(loadingContainer);

            // Check if data is empty
            const isEmpty = Array.isArray(data) ? data.length === 0 : !data || Object.keys(data).length === 0;

            if (isEmpty) {
                console.log('📭 Data is empty, showing empty state');
                if (emptyContainer) {
                    this.showEmpty(emptyContainer, emptyMessage, emptyAction?.text, emptyAction?.url);
                }
            } else {
                console.log('✅ Data available, showing content');
                if (contentContainer) this.showContent(contentContainer);
                if (onSuccess) onSuccess(data);
            }

            return data;

        } catch (error) {
            console.error('💥 API Error:', error);
            
            // Hide loading
            if (loadingContainer) this.hide(loadingContainer);
            
            // Show error
            if (emptyContainer) {
                this.showError(emptyContainer, 'Failed to load data. Please try again.', onError);
            }
            
            if (onError) onError(error);
            throw error;
        }
    }
};

// Make available globally
window.UIHelpers = UIHelpers;
