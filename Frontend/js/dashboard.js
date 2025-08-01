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
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        // Use dummy data as fallback
        document.getElementById('userName').textContent = 'John Doe';
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
    // Open the year stats page in a new tab
    window.open(`/pages/year.html?year=${year}`, '_blank');
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
    window.open('/pages/about.html', '_blank');
}

// Feedback Function
function showFeedback() {
    closeSettingsPanel();
    window.open('/pages/feedback.html', '_blank');
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

// Personalized greeting
function setGreeting() {
    const user = document.getElementById('userName').textContent || 'User';
    document.getElementById('greetingMessage').textContent = `Welcome, ${user}!`;
    // Random motivational tips
    const tips = [
        '"Success is where preparation and opportunity meet."',
        '"Opportunities don’t happen, you create them."',
        '"Dream big and dare to fail."',
        '"Your future is created by what you do today."',
        '"Stay positive, work hard, make it happen."'
    ];
    document.getElementById('greetingTip').textContent = tips[Math.floor(Math.random() * tips.length)];
}
document.addEventListener('DOMContentLoaded', setGreeting);

// Details modal logic
function showDetails(type) {
    const modal = document.getElementById('detailsModal');
    const title = document.getElementById('detailsTitle');
    const body = document.getElementById('detailsBody');
    let content = '';
    if (type === 'students') {
        title.textContent = 'Total Students';
        content = '<ul><li>Branch-wise student count</li><li>Year-wise student count</li></ul>';
    } else if (type === 'placements') {
        title.textContent = 'Placements';
        content = '<ul><li>Company-wise placements</li><li>Highest offers</li></ul>';
    } else if (type === 'rate') {
        title.textContent = 'Placement Rate';
        content = '<ul><li>Yearly placement rate trend</li><li>Comparison with previous years</li></ul>';
    } else if (type === 'package') {
        title.textContent = 'Average Package';
        content = '<ul><li>Branch-wise average package</li><li>Top offers</li></ul>';
    }
    body.innerHTML = content;
    modal.style.display = 'flex';
}
function closeDetailsModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

// Chart.js for placement distribution
function renderPlacementChart() {
    const ctx = document.getElementById('placementChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['CSE', 'ISE', 'ECE', 'EEE', 'ME', 'Others'],
            datasets: [{
                data: [320, 210, 180, 120, 90, 60],
                backgroundColor: [
                    '#5fa8e6', '#7ec9f5', '#ff6f91', '#b388ff', '#ffd166', '#6ee7b7'
                ],
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}
document.addEventListener('DOMContentLoaded', renderPlacementChart);

// Download report as CSV
function downloadReport() {
    const rows = [
        ['Stat', 'Value'],
        ['Total Students', '1250'],
        ['Placements', '1180'],
        ['Placement Rate', '94.4%'],
        ['Avg Package', '₹8.5 LPA']
    ];
    let csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'placement_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
} 

// Live Placement Trends fetch and update
function updateLiveTrendsUI(data) {
    const cards = [
        { label: 'Placed Today', value: data.placed_today, icon: 'fa-user-check', color: '#28a745' },
        { label: 'Placed This Week', value: data.placed_this_week, icon: 'fa-calendar-week', color: '#007bff' },
        { label: 'New Companies', value: data.new_companies, icon: 'fa-building', color: '#ff9800' },
        { label: 'Highest Package (This Week)', value: data.highest_package_week, icon: 'fa-trophy', color: '#e91e63' }
    ];
    document.getElementById('liveTrendsCards').innerHTML = cards.map(card => `
        <div style="background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(30,60,114,0.07);padding:18px 24px;min-width:160px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <i class="fas ${card.icon}" style="font-size:1.6rem;color:${card.color};margin-bottom:8px;"></i>
            <div style="font-size:1.5rem;font-weight:700;color:#222;">${card.value}</div>
            <div style="font-size:1rem;color:#666;margin-top:2px;">${card.label}</div>
        </div>
    `).join('');
    document.getElementById('recentOffers').innerHTML = `
        <div style="font-weight:600;margin-bottom:8px;">Recent Offers</div>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:18px;">
            ${data.recent_offers.map(offer => `
                <li style="background:#f7fafd;border-radius:8px;padding:10px 18px;box-shadow:0 1px 4px rgba(30,60,114,0.04);font-size:1rem;">
                    <b>${offer.student}</b> - <span style="color:#5fa8e6;">${offer.company}</span> <span style="color:#28a745;">${offer.package}</span>
                </li>
            `).join('')}
        </ul>
    `;
}
async function fetchLiveTrends() {
    try {
        const res = await fetch('/api/live-trends');
        if (res.ok) {
            const data = await res.json();
            updateLiveTrendsUI(data);
        }
    } catch {}
}
setInterval(fetchLiveTrends, 10000);
document.addEventListener('DOMContentLoaded', fetchLiveTrends); 