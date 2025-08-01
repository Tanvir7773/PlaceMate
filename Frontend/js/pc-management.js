// PC Management JavaScript functionality

// Load user data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadCurrentUserData();
    setupFormHandling();
});

// Function to load current user data
async function loadCurrentUserData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login if no token
            window.location.href = '/';
            return;
        }

        // Call the API to get current user data
        const response = await fetch('/auth/user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            document.getElementById('currentPCName').textContent = userData.name;
            
            // Check if user is PC, if not redirect to dashboard
            if (!userData.is_pc) {
                window.location.href = '/pages/dashboard.html';
            }
        } else {
            // If API fails, redirect to login
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        window.location.href = '/';
    }
}

// Function to setup form handling
function setupFormHandling() {
    const form = document.getElementById('pcAccessForm');
    form.addEventListener('submit', handleFormSubmit);
}

// Function to handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const pcData = {
        email: formData.get('pcEmail')
    };

    // Validate form data
    if (!validateFormData(pcData)) {
        return;
    }

    // Disable submit button and show loading
    const submitBtn = event.target.querySelector('.grant-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Granting Access...';

    try {
        const token = localStorage.getItem('token');
        console.log('Token:', token ? 'Present' : 'Missing');
        console.log('PC Data:', pcData);
        
        const response = await fetch('/auth/grant-pc-access', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pcData)
        });

        console.log('Response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Success result:', result);
            showSuccessModal(result.name, pcData.email);
            // Reset form
            event.target.reset();
        } else {
            const errorData = await response.json();
            console.log('Error data:', errorData);
            showErrorModal(errorData.detail || 'Failed to grant PC access');
        }
    } catch (error) {
        console.error('Error granting PC access:', error);
        showErrorModal('Network error. Please try again.');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Function to validate form data
function validateFormData(data) {
    if (!data.email || !isValidEmail(data.email)) {
        showErrorModal('Please enter a valid email address');
        return false;
    }

    // Check if it's a BMS College email
    if (!data.email.endsWith('@bmsce.ac.in')) {
        showErrorModal('Only BMS College email addresses (@bmsce.ac.in) are allowed');
        return false;
    }

    return true;
}

// Function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to show success modal
function showSuccessModal(pcName, pcEmail) {
    document.getElementById('grantedPCName').textContent = pcName;
    document.getElementById('successModal').style.display = 'flex';
}

// Function to show error modal
function showErrorModal(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').style.display = 'flex';
}

// Function to close modal
function closeModal() {
    document.getElementById('successModal').style.display = 'none';
    document.getElementById('errorModal').style.display = 'none';
}

// Function to go back to dashboard
function goBack() {
    window.location.href = '/pages/dashboard.html';
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const successModal = document.getElementById('successModal');
    const errorModal = document.getElementById('errorModal');
    
    if (event.target === successModal) {
        closeModal();
    }
    
    if (event.target === errorModal) {
        closeModal();
    }
});

// Add keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Add form field validation on blur
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('.pc-form input, .pc-form select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
});

// Function to validate individual field
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    
    // Remove existing error styling
    field.classList.remove('error');
    
    // Validate based on field type
    switch (fieldName) {
        case 'pcEmail':
            if (!isValidEmail(value)) {
                field.classList.add('error');
                showFieldError(field, 'Please enter a valid email address');
            } else if (!value.endsWith('@bmsce.ac.in')) {
                field.classList.add('error');
                showFieldError(field, 'Only BMS College email addresses are allowed');
            }
            break;
    }
}

// Function to show field-specific error
function showFieldError(field, message) {
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Create and show new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc143c';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '5px';
    
    field.parentNode.appendChild(errorDiv);
}

// Add CSS for error styling
const style = document.createElement('style');
style.textContent = `
    .form-group input.error,
    .form-group select.error {
        border-color: #dc143c;
        box-shadow: 0 0 0 3px rgba(220, 20, 60, 0.1);
    }
    
    .field-error {
        color: #dc143c;
        font-size: 12px;
        margin-top: 5px;
    }
`;
document.head.appendChild(style); 