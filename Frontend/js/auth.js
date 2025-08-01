// Form toggle functionality
function showForm(formType) {
    // Update toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide forms
    document.querySelectorAll('.form').forEach(form => form.classList.remove('active'));
    if (formType === 'login') {
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('registerForm').classList.add('active');
    }
    
    // Clear messages
    clearMessages();
}

// Clear all error and success messages
function clearMessages() {
    document.querySelectorAll('.error-message, .success-message').forEach(msg => {
        msg.style.display = 'none';
        msg.textContent = '';
    });
}

// Show error or success message
function showMessage(elementId, message, isError = true) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
    element.className = isError ? 'error-message' : 'success-message';
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

// Forgot password functionality
function showForgotPassword() {
    window.location.href = '/pages/forgot-password.html';
}

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearMessages();
    
    const email = document.getElementById('loginEmail').value.toLowerCase();
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('loginSuccess', 'Login successful! Redirecting to dashboard...', false);
            // Store token if needed
            localStorage.setItem('token', data.access_token);
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/pages/dashboard.html';
            }, 1500);
        } else {
            showMessage('loginError', data.detail || 'Invalid email or password');
        }
    } catch (error) {
        showMessage('loginError', 'Network error. Please try again.');
    }
});

// Register form submission
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearMessages();
    
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showMessage('registerError', 'Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showMessage('registerError', 'Password must be at least 6 characters long');
        return;
    }
    
    // Convert email to lowercase and validate domain
    const email = document.getElementById('registerEmail').value.toLowerCase();
    if (!(email.endsWith('@bmsce.ac.in') || email.endsWith('@gmail.com'))) {
        showMessage('registerError', 'Only Gmail (@gmail.com) or BMS College (@bmsce.ac.in) addresses are allowed');
        return;
    }
    
    const formData = {
        name: document.getElementById('registerName').value,
        email: email,  // Use lowercase email
        password: password,
        branch: document.getElementById('branch').value,
        section: document.getElementById('section').value,
        year_of_passout: parseInt(document.getElementById('yearOfPassout').value)
    };
    
    // Extract year from email and validate (only for BMS emails)
    if (email.endsWith('@bmsce.ac.in')) {
        const passoutYear = extractYearFromEmail(email);
        if (passoutYear) {
            document.getElementById('yearOfPassout').value = passoutYear;
            document.getElementById('yearOfPassout').disabled = true;
            formData.year_of_passout = passoutYear;
        }
    }
    
    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('registerSuccess', 'Registration successful! Please sign in.', false);
            document.getElementById('registerForm').reset();
            setTimeout(() => showForm('login'), 2000);
        } else {
            showMessage('registerError', data.detail || 'Registration failed');
        }
    } catch (error) {
        showMessage('registerError', 'Network error. Please try again.');
    }
});

// Function to extract year from BMS College email and calculate passing out year
function extractYearFromEmail(email) {
    // Pattern: name.xx00@bmsce.ac.in where xx can be letters and 00 is the year
    // This will match: anurag.is22@bmsce.ac.in, john.doe23@bmsce.ac.in, etc.
    const pattern = /\.([a-zA-Z]*\d{2})@bmsce\.ac\.in$/;
    const match = email.match(pattern);
    
    if (match) {
        const fullCode = match[1]; // e.g., "is22", "doe23"
        // Extract the last 2 digits as the year
        const yearCode = fullCode.slice(-2);
        // Convert 2-digit year to 4-digit year (assuming 20xx)
        const emailYear = 2000 + parseInt(yearCode);
        // Calculate passing out year (4 years after email year)
        const passoutYear = emailYear + 4;
        console.log(`Email: ${email}, Extracted year code: ${yearCode}, Email year: ${emailYear}, Passout year: ${passoutYear}`);
        return passoutYear;
    }
    
    console.log(`Email: ${email} - No match found`);
    return null;
}

// Function to validate email and auto-set year
function validateEmailAndSetYear(email) {
    const lowerEmail = email.toLowerCase();
    const yearOfPassoutField = document.getElementById('yearOfPassout');
    
    if (lowerEmail.endsWith('@bmsce.ac.in')) {
        const passoutYear = extractYearFromEmail(lowerEmail);
        
        if (passoutYear) {
            // Set the calculated passing out year
            yearOfPassoutField.value = passoutYear;
            // Lock the dropdown and style it to show it's disabled
            yearOfPassoutField.disabled = true;
            yearOfPassoutField.style.backgroundColor = '#e9ecef';
            yearOfPassoutField.style.color = '#6c757d';
            yearOfPassoutField.style.cursor = 'not-allowed';
            yearOfPassoutField.style.borderColor = '#ced4da';
            yearOfPassoutField.title = `Year automatically calculated from email: ${passoutYear} (4 years after ${passoutYear - 4})`;
            
            // Add a visual indicator
            const wrapper = yearOfPassoutField.parentElement;
            wrapper.style.position = 'relative';
            
            // Remove existing indicator if any
            const existingIndicator = wrapper.querySelector('.auto-calculated-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            // Add indicator
            const indicator = document.createElement('div');
            indicator.className = 'auto-calculated-indicator';
            indicator.innerHTML = '<i class="fas fa-lock" style="color: #28a745; font-size: 12px; margin-left: 5px;"></i>';
            indicator.style.position = 'absolute';
            indicator.style.right = '15px';
            indicator.style.top = '50%';
            indicator.style.transform = 'translateY(-50%)';
            indicator.style.pointerEvents = 'none';
            wrapper.appendChild(indicator);
            
        } else {
            // Invalid email format, allow manual selection
            yearOfPassoutField.disabled = false;
            yearOfPassoutField.style.backgroundColor = '';
            yearOfPassoutField.style.color = '';
            yearOfPassoutField.style.cursor = '';
            yearOfPassoutField.style.borderColor = '';
            yearOfPassoutField.title = 'Please select your year of passout';
            
            // Remove indicator
            const wrapper = yearOfPassoutField.parentElement;
            const existingIndicator = wrapper.querySelector('.auto-calculated-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
        }
    } else {
        // Non-BMS email, allow manual selection
        yearOfPassoutField.disabled = false;
        yearOfPassoutField.style.backgroundColor = '';
        yearOfPassoutField.style.color = '';
        yearOfPassoutField.style.cursor = '';
        yearOfPassoutField.style.borderColor = '';
        yearOfPassoutField.title = 'Please select your year of passout';
        
        // Remove indicator
        const wrapper = yearOfPassoutField.parentElement;
        const existingIndicator = wrapper.querySelector('.auto-calculated-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }
}

// Add input focus effects and email validation
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
    
    // Add email validation for register form
    const registerEmail = document.getElementById('registerEmail');
    if (registerEmail) {
        registerEmail.addEventListener('input', function() {
            validateEmailAndSetYear(this.value);
        });
        
        registerEmail.addEventListener('blur', function() {
            validateEmailAndSetYear(this.value);
        });
    }
    // Convert email inputs to lowercase as user types
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.toLowerCase();
            if (this.id === 'registerEmail') {
                validateEmailAndSetYear(this.value);
            }
        });
    });
}); 