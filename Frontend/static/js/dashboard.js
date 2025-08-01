// Dashboard JavaScript functionality

// Load user data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    ensureSettingsVisibility();
});

// Function to ensure settings button is always visible
function ensureSettingsVisibility() {
    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) {
        settingsBtn.style.display = 'flex';
    }
    
    // Ensure user info is visible
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        userInfo.style.display = 'flex';
        userInfo.style.visibility = 'visible';
        userInfo.style.opacity = '1';
    }
    
    // Ensure header right is visible
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
        headerRight.style.display = 'flex';
        headerRight.style.visibility = 'visible';
        headerRight.style.opacity = '1';
    }
}

// Function to load user data from API
async function loadUserData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            // Temporarily skip authentication for testing
            document.getElementById('userName').textContent = 'Test User';
            // Show PC button for testing (remove this in production)
            document.getElementById('pcManageBtn').style.display = 'flex';
            return;
        }

        // Call the API to get user data
        const response = await fetch('/auth/user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            document.getElementById('userName').textContent = userData.name;
            
                    // Show PC management button if user is a PC
        if (userData.is_pc) {
            document.getElementById('pcManageBtn').style.display = 'flex';
        } else {
            // Ensure settings button is always visible for all users
            document.getElementById('pcManageBtn').style.display = 'none';
        }
        } else {
            // If API fails, use dummy data for now
            document.getElementById('userName').textContent = 'John Doe';
            // Show PC button for testing when API fails
            document.getElementById('pcManageBtn').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        // Use dummy data as fallback
        document.getElementById('userName').textContent = 'John Doe';
        // Show PC button for testing when there's an error
        document.getElementById('pcManageBtn').style.display = 'flex';
    }
}

// Function to handle logout
async function logout() {
    try {
        const token = localStorage.getItem('token');
        
        // Call logout API
        const response = await fetch('/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Clear local storage regardless of API response
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        
        // Redirect to login page
        window.location.href = '/';
    } catch (error) {
        console.error('Error during logout:', error);
        // Still redirect even if API fails
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = '/';
    }
}

// Function to view year statistics
function viewYearStats(year) {
    // Store the selected year in localStorage for the next page
    localStorage.setItem('selectedYear', year);
    
    // Navigate to the year stats page
    window.location.href = `/pages/year.html?year=${year}`;
}

// Function to open PC management page
function openPCManagement() {
    window.location.href = '/pages/pc-management.html';
}

// Add click event listeners for year buttons
document.addEventListener('DOMContentLoaded', function() {
    const yearButtons = document.querySelectorAll('.year-btn');
    
    yearButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Add a small delay for visual feedback
            setTimeout(() => {
                const year = this.textContent.trim();
                viewYearStats(year);
            }, 200);
        });
    });
});

// Add keyboard navigation for year buttons
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        const activeElement = document.activeElement;
        if (activeElement.classList.contains('year-btn')) {
            event.preventDefault();
            activeElement.click();
        }
    }
    
    // Close settings panel on Escape key
    if (event.key === 'Escape') {
        closeSettingsPanel();
    }
});

// Settings Panel Functions
function toggleSettingsPanel() {
    const panel = document.getElementById('settingsPanel');
    const overlay = document.getElementById('settingsOverlay');
    
    if (!panel || !overlay) {
        console.error('Settings panel elements not found');
        return;
    }
    
    if (panel.classList.contains('active')) {
        closeSettingsPanel();
    } else {
        openSettingsPanel();
    }
}

function openSettingsPanel() {
    const panel = document.getElementById('settingsPanel');
    const overlay = document.getElementById('settingsOverlay');
    
    if (!panel || !overlay) {
        console.error('Settings panel elements not found');
        return;
    }
    
    panel.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSettingsPanel() {
    const panel = document.getElementById('settingsPanel');
    const overlay = document.getElementById('settingsOverlay');
    
    if (!panel || !overlay) {
        console.error('Settings panel elements not found');
        return;
    }
    
    panel.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Change Password Functions
function showChangePasswordModal() {
    closeSettingsPanel();
    document.getElementById('changePasswordModal').style.display = 'flex';
    document.getElementById('changePasswordForm').reset();
}

// About Us Function
function showAboutUs() {
    closeSettingsPanel();
    // TODO: Implement About Us functionality
    console.log('About Us clicked - functionality to be implemented');
    // For now, show a simple alert
    alert('About Us feature will be implemented soon!');
}

// Feedback Function
function showFeedback() {
    closeSettingsPanel();
    // TODO: Implement Feedback functionality
    console.log('Feedback clicked - functionality to be implemented');
    // For now, show a simple alert
    alert('Feedback feature will be implemented soon!');
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
}

function closeModal() {
    document.getElementById('successModal').style.display = 'none';
    document.getElementById('errorModal').style.display = 'none';
}

// Password toggle functionality
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggleIcon = input.parentElement.querySelector('.password-toggle');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    } else {
        input.type = 'password';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    }
}

// Submit change password
async function submitChangePassword() {
    const form = document.getElementById('changePasswordForm');
    const formData = new FormData(form);
    
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmNewPassword = formData.get('confirmNewPassword');
    
    // Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        showError('All fields are required');
        return;
    }
    
    if (newPassword.length < 6) {
        showError('New password must be at least 6 characters long');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showError('New passwords do not match');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/auth/change-password', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess('Password changed successfully!');
            closeChangePasswordModal();
        } else {
            showError(data.detail || 'Failed to change password');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showError('Network error. Please try again.');
    }
}

// Show success message
function showSuccess(message) {
    document.getElementById('successMessage').textContent = message;
    document.getElementById('successModal').style.display = 'flex';
}

// Show error message
function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').style.display = 'flex';
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            closeModal();
            closeChangePasswordModal();
        }
    });
}); 