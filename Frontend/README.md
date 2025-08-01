# Frontend Directory Structure

This directory contains all the frontend files for the Placement Info Portal.

## Directory Structure

```
frontend/
├── css/
│   └── styles.css          # Main stylesheet
├── js/
│   └── auth.js            # Authentication JavaScript
├── images/                # Image assets (logos, icons, etc.)
├── pages/                 # Additional HTML pages
└── index.html             # Main homepage
```

## Files Description

### `index.html`
- Main homepage with login and registration forms
- Contains the college and company branding
- Responsive design for mobile and desktop

### `css/styles.css`
- All styling for the application
- Modern gradient design
- Responsive layout
- Form styling and animations

### `js/auth.js`
- Authentication functionality
- Form handling and validation
- API calls to backend endpoints
- Error and success message handling

### `images/`
- Directory for storing images, logos, and other assets
- Currently empty, ready for future assets

### `pages/`
- Directory for additional HTML pages
- Ready for dashboard, profile, and other pages

## Features

1. **Login Form**
   - Email and password fields
   - Form validation
   - Error handling

2. **Registration Form**
   - Full name, email, password, confirm password
   - Branch, section, year of passout fields
   - Password confirmation validation

3. **Branding**
   - B.M.S College of Engineering logo and name
   - Placement Info Portal branding
   - Professional tagline

4. **Responsive Design**
   - Works on desktop and mobile devices
   - Clean, modern UI
   - Smooth animations and transitions

## Usage

1. Start the FastAPI backend server
2. Access the homepage at `http://localhost:8000`
3. The frontend will be served from the backend

## Development

- CSS and JavaScript are separated for better organization
- External file references for maintainability
- Ready for future expansion with additional pages 