// Year Statistics JavaScript functionality

let currentUser = null;
let currentYear = null;
let isPC = false;
let companiesData = []; // Global variable to store companies data
let filteredCompaniesData = []; // Global variable to store filtered companies data

// Branch mapping for full names to short forms
const branchMapping = {
    'Aerospace Engineering': 'AE',
    'Artificial Intelligence and Data Science': 'AI&DS',
    'Bio-Technology': 'BT',
    'Chemical Engineering': 'ChE',
    'Civil Engineering': 'CE',
    'Computer Science and Business Systems': 'CSBS',
    'Computer Science and Engineering': 'CSE',
    'Computer Science and Engineering (DS)': 'CSE(DS)',
    'Computer Science and Engineering (IoT and CS)': 'CSE(IoT&CS)',
    'Electrical and Electronics Engineering': 'EEE',
    'Electronics and Communication Engineering': 'ECE',
    'Electronics and Instrumentation Engineering': 'EIE',
    'Electronics and Telecommunication Engineering': 'ETE',
    'Industrial Engineering and Management': 'IEM',
    'Information Science and Engineering': 'ISE',
    'Machine Learning (AI and ML)': 'AI&ML',
    'Mechanical Engineering': 'ME',
    'Medical Electronics Engineering': 'MEE'
};

// Reverse mapping for short forms to full names
const reverseBranchMapping = {};
Object.keys(branchMapping).forEach(key => {
    reverseBranchMapping[branchMapping[key]] = key;
});

// Load year data when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkUserAuthentication();
    loadYearData();
});

// Function to check user authentication
async function checkUserAuthentication() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            // Not logged in, hide PC features
            console.log('No token found - user not logged in');
            return;
        }

        const response = await fetch('/auth/user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            isPC = currentUser.is_pc;
            console.log('User authentication successful:', { 
                name: currentUser.name, 
                is_pc: currentUser.is_pc, 
                year_of_passout: currentUser.year_of_passout 
            });
            
            // Check if PC can access this year
            if (isPC) {
                checkPCAccess();
            }
        } else {
            console.log('Authentication failed:', response.status);
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
    }
}

// Function to check PC access for specific year
function checkPCAccess() {
    const year = getYearFromURL();
    currentYear = year;
    
    console.log('Checking PC access for year:', year);
    console.log('Current user year_of_passout:', currentUser.year_of_passout);
    
    // Check if PC can access this specific year
    if (currentUser.year_of_passout) {
        const pcYear = currentUser.year_of_passout.toString();
        console.log('PC passing out year:', pcYear, 'Current year:', year);
        
        if (year === pcYear) {
            // PC can edit their own passing out year
            console.log('PC can edit this year - showing features');
            showPCFeatures();
        } else {
            // PC can view but not edit other years
            console.log('PC can only edit their own year:', pcYear, '- hiding edit features');
            hidePCFeatures();
        }
    } else {
        // PC without specific year cannot edit any year
        console.log('PC has no passing out year - hiding edit features');
        hidePCFeatures();
    }
}

// Function to show PC features
function showPCFeatures() {
    console.log('Showing PC features');
    const tableActions = document.getElementById('tableActions');
    const actionColumn = document.getElementById('actionColumn');
    
    console.log('tableActions element:', tableActions);
    console.log('actionColumn element:', actionColumn);
    
    if (tableActions) {
        tableActions.style.display = 'flex';
        console.log('Set tableActions display to flex');
    }
    if (actionColumn) {
        actionColumn.style.display = 'table-cell';
        console.log('Set actionColumn display to table-cell');
    }
    
    // Refresh the table to show action buttons
    refreshTableWithPCStatus();
}

// Function to hide PC features
function hidePCFeatures() {
    console.log('Hiding PC features');
    const tableActions = document.getElementById('tableActions');
    const actionColumn = document.getElementById('actionColumn');
    
    if (tableActions) {
        tableActions.style.display = 'none';
        console.log('Set tableActions display to none');
    }
    if (actionColumn) {
        actionColumn.style.display = 'none';
        console.log('Set actionColumn display to none');
    }
    
    // Refresh the table to hide action buttons
    refreshTableWithPCStatus();
}

// Function to get year from URL parameters
function getYearFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('year') || localStorage.getItem('selectedYear') || '2024';
}

// Function to load year statistics
async function loadYearData() {
    const year = getYearFromURL();
    
    // Update page title
    document.getElementById('yearTitle').textContent = `Placement Statistics - ${year}`;
    
    // Show loading state
    showLoading();
    
    try {
        // Ensure authentication is checked first
        await checkUserAuthentication();
        
        // Fetch data from API
        await loadDataFromAPI(year);
    } catch (error) {
        console.error('Error loading year data:', error);
        showError('Failed to load data. Please try again later.');
    }
}

// Function to refresh table with current PC status
function refreshTableWithPCStatus() {
    if (companiesData.length > 0) {
        console.log('Refreshing table with PC status:', isPC);
        updateCompanyTableFromAPI(companiesData);
    }
}

// Function to load data from API
async function loadDataFromAPI(year) {
    try {
        // Fetch year statistics from API
        const response = await fetch(`/api/companies/${year}/stats`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Update company table
            updateCompanyTableFromAPI(data.companies);
            
            // Update statistics
            updateStatsFromAPI(data);
        } else {
            throw new Error('Failed to load data from server');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// Function to update company table from API data
function updateCompanyTableFromAPI(companies) {
    // Store companies data globally
    companiesData = companies || [];
    filteredCompaniesData = [...companiesData]; // Initialize filtered data
    
    // Debug PC status
    console.log('updateCompanyTableFromAPI - isPC:', isPC);
    console.log('updateCompanyTableFromAPI - currentUser:', currentUser);
    
    const tableBody = document.getElementById('companyTableBody');
    tableBody.innerHTML = '';
    
    if (!companies || companies.length === 0) {
        const colspan = isPC ? '10' : '9';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="${colspan}" class="no-data">
                <div class="no-data-message">
                    <i class="fas fa-info-circle"></i>
                    <p>No company data available for this year.</p>
                    <small>Data will be populated when companies are added through the PC Management section.</small>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }
    
    // Apply current sorting and filtering
    applySortingAndFiltering();
}

// Function to apply sorting and filtering
function applySortingAndFiltering() {
    let data = [...companiesData];
    
    // Apply branch filter
    const branchFilter = document.getElementById('branchFilter').value;
    if (branchFilter) {
        data = data.filter(company => {
            if (!company.allowed_branches || !Array.isArray(company.allowed_branches)) {
                return false;
            }
            return company.allowed_branches.includes(branchFilter);
        });
    }
    
    // Apply sorting
    const sortSelect = document.getElementById('sortSelect');
    const sortBy = sortSelect ? sortSelect.value : 'name';
    
    data.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return (a.name || '').localeCompare(b.name || '');
            case 'ctc':
                const ctcA = a.ctc || 0;
                const ctcB = b.ctc || 0;
                return ctcB - ctcA; // High to low
            case 'date':
                const dateA = new Date(a.date_of_visit || '');
                const dateB = new Date(b.date_of_visit || '');
                return dateB - dateA; // Most recent first
            default:
                return 0;
        }
    });
    
    filteredCompaniesData = data;
    renderTable();
}

// Function to render the table with filtered data
function renderTable() {
    const tableBody = document.getElementById('companyTableBody');
    tableBody.innerHTML = '';
    
    if (!filteredCompaniesData || filteredCompaniesData.length === 0) {
        const colspan = isPC ? '10' : '9';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="${colspan}" class="no-data">
                <div class="no-data-message">
                    <i class="fas fa-info-circle"></i>
                    <p>No companies match the current filter criteria.</p>
                    <small>Try adjusting your filter settings.</small>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }
    
    filteredCompaniesData.forEach((company, index) => {
        const row = document.createElement('tr');
        const actionCell = isPC ? `
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" data-company-id="${company._id}" title="Edit Company">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-company-id="${company._id}" title="Delete Company">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        ` : '';
        
        console.log(`Row ${index + 1} - isPC: ${isPC}, actionCell: ${actionCell ? 'present' : 'empty'}`);
        
        // Display logic for CTC and stipend based on role
        let ctcDisplay = '₹0 LPA';
        let stipendDisplay = '-';
        
        if (company.role === 'IT') {
            // For IT role, show "-" for CTC if not provided
            ctcDisplay = company.ctc ? `₹${company.ctc} LPA` : '-';
            stipendDisplay = company.stipend ? `${company.stipend} KPM` : '-';
        } else if (company.role === 'IT + FT') {
            // For IT + FT role, both should be displayed
            ctcDisplay = company.ctc ? `₹${company.ctc} LPA` : '₹0 LPA';
            stipendDisplay = company.stipend ? `${company.stipend} KPM` : '-';
        } else if (company.role === 'FT') {
            // For FT role, only CTC is relevant
            ctcDisplay = company.ctc ? `₹${company.ctc} LPA` : '₹0 LPA';
            stipendDisplay = '-';
        } else {
            // For other roles (IT + PBC), show both
            ctcDisplay = company.ctc ? `₹${company.ctc} LPA` : '₹0 LPA';
            stipendDisplay = company.stipend ? `${company.stipend} KPM` : '-';
        }
        
        // Format allowed branches
        const allowedBranches = formatAllowedBranches(company.allowed_branches);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${company.name || 'N/A'}</td>
            <td>${ctcDisplay}</td>
            <td>${stipendDisplay}</td>
            <td>${company.role || 'N/A'}</td>
            <td>${company.offers || 0}</td>
            <td>${formatDate(company.date_of_visit) || 'N/A'}</td>
            <td class="allowed-branches-cell">${allowedBranches}</td>
            <td>
                <button class="details-btn" data-company-index="${index}">
                    <i class="fas fa-info-circle"></i>
                    View Details
                </button>
            </td>
            ${actionCell}
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners for the buttons
    addTableEventListeners();
}

// Function to format allowed branches
function formatAllowedBranches(allowedBranches) {
    if (!allowedBranches || !Array.isArray(allowedBranches) || allowedBranches.length === 0) {
        return '<span style="color: #999; font-style: italic;">Not specified</span>';
    }
    
    return allowedBranches.map(branch => 
        `<span class="branch-tag">${branch}</span>`
    ).join(' ');
}

// Function to apply sorting
function applySorting() {
    applySortingAndFiltering();
}

// Function to apply branch filter
function applyBranchFilter() {
    applySortingAndFiltering();
}

// Function to add event listeners to table buttons
function addTableEventListeners() {
    // Add event listeners for details buttons
    const detailsButtons = document.querySelectorAll('.details-btn');
    
    detailsButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const companyIndex = parseInt(this.getAttribute('data-company-index'));
            const company = filteredCompaniesData[companyIndex];
            if (company) {
                showInterviewDetails(company.name || 'Company', company.interview_details || 'No details available');
            }
        });
    });
    
    // Add event listeners for edit buttons (if PC)
    if (isPC) {
        const editButtons = document.querySelectorAll('.edit-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', function() {
                const companyId = this.getAttribute('data-company-id');
                editCompany(companyId);
            });
        });
        
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const companyId = this.getAttribute('data-company-id');
                deleteCompany(companyId);
            });
        });
    }
}

// Function to update statistics from API data
function updateStatsFromAPI(data) {
    document.getElementById('companiesVisited').textContent = data.companies_visited || 0;
    document.getElementById('totalOffers').textContent = (data.total_offers || 0).toLocaleString();
    document.getElementById('avgCTC').textContent = `₹${data.avg_ctc || 0} LPA`;
    document.getElementById('highestCTC').textContent = `₹${data.highest_ctc || 0} LPA`;
    
    // Add animation effect
    animateStatsUpdate();
}

// Function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

// Function to show error message
function showError(message) {
    // Update all stat cards to show error
    const statElements = ['companiesVisited', 'totalOffers', 'avgCTC', 'highestCTC'];
    statElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = 'Error';
        }
    });
    
    // Update table to show error
    const tableBody = document.getElementById('companyTableBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="error">
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                    <button onclick="loadYearData()" class="retry-btn">
                        <i class="fas fa-redo"></i>
                        Retry
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Function to animate stats update
function animateStatsUpdate() {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        stat.style.transform = 'scale(1.1)';
        stat.style.transition = 'transform 0.3s ease';
        setTimeout(() => {
            stat.style.transform = 'scale(1)';
        }, 300);
    });
}

// Function to go back to dashboard
function goBack() {
    window.location.href = '/pages/dashboard.html';
}

// Add keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        goBack();
    }
});

// Add loading animation
function showLoading() {
    const elements = ['companiesVisited', 'totalOffers', 'avgCTC', 'highestCTC'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = 'Loading...';
        }
    });
}

// Function to show interview details
function showInterviewDetails(companyName, details) {
    // Update modal content
    document.getElementById('interviewModalTitle').textContent = 'Interview Details';
    document.getElementById('interviewCompanyName').textContent = companyName;
    
    // Find the company data to get additional details
    const company = findCompanyByName(companyName);
    
    if (company) {
        document.getElementById('interviewCompanyRole').textContent = company.role || 'N/A';
        
        // Format CTC display
        let ctcText = 'N/A';
        if (company.ctc) {
            ctcText = `₹${company.ctc} LPA`;
        } else if (company.role === 'IT') {
            ctcText = 'Not applicable for IT role';
        }
        
        // Format stipend display
        let stipendText = 'N/A';
        if (company.stipend) {
            stipendText = `${company.stipend} KPM`;
        } else if (company.role === 'FT') {
            stipendText = 'Not applicable for FT role';
        }
        
        document.getElementById('interviewCompanyCTC').textContent = ctcText;
        document.getElementById('interviewCompanyOffers').textContent = `${company.offers || 0} offers`;
        
        // Add stipend information to the modal if it exists
        const companyMeta = document.getElementById('interviewCompanyCTC');
        if (company.stipend && company.role !== 'FT') {
            companyMeta.textContent = `${ctcText} • ${stipendText}`;
        } else {
            companyMeta.textContent = ctcText;
        }
    } else {
        document.getElementById('interviewCompanyRole').textContent = 'N/A';
        document.getElementById('interviewCompanyCTC').textContent = 'N/A';
        document.getElementById('interviewCompanyOffers').textContent = 'N/A';
    }
    
    // Update interview details content
    const detailsContent = document.getElementById('interviewDetailsContent');
    if (details && details.trim() !== '' && details !== 'No details available') {
        // Escape HTML and preserve line breaks
        const escapedDetails = details
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\n/g, '<br>');
        
        detailsContent.innerHTML = `<p>${escapedDetails}</p>`;
    } else {
        detailsContent.innerHTML = `
            <div class="no-details">
                <i class="fas fa-info-circle"></i>
                <p>No interview details available for this company.</p>
                <small>Interview details will be displayed here when added by Placement Coordinators.</small>
            </div>
        `;
    }
    
    // Show the modal
    const modal = document.getElementById('interviewDetailsModal');
    modal.style.display = 'flex';
}

// Function to find company by name (helper function)
function findCompanyByName(companyName) {
    return filteredCompaniesData.find(company => company.name === companyName) || null;
}

// Function to close interview details modal
function closeInterviewDetailsModal() {
    document.getElementById('interviewDetailsModal').style.display = 'none';
}

// Function to refresh data
function refreshData() {
    loadYearData();
}

// Company Management Functions
function showAddCompanyForm() {
    if (!isPC) {
        showError('Access denied. Only PCs can add companies.');
        return;
    }
    
    // Check if PC can access this specific year
    if (currentUser && currentUser.year_of_passout) {
        const pcYear = currentUser.year_of_passout.toString();
        const currentYear = getYearFromURL();
        
        if (pcYear !== currentYear) {
            showError(`Access denied. You can only add companies for your passing out year (${pcYear}).`);
            return;
        }
    } else {
        showError('Access denied. You need a valid passing out year to add companies.');
        return;
    }
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('companyDate').value = today;
    
    // Add event listener for role-based validation
    const roleSelect = document.getElementById('companyRole');
    roleSelect.addEventListener('change', function() {
        updateFieldRequirements('add');
    });
    
    // Update field requirements based on current role
    updateFieldRequirements('add');
    
    document.getElementById('addCompanyModal').style.display = 'flex';
}

function closeAddCompanyModal() {
    document.getElementById('addCompanyModal').style.display = 'none';
    document.getElementById('addCompanyForm').reset();
    clearFormErrors(); // Clear any error messages
}

async function submitAddCompany() {
    if (!isPC) {
        showError('Access denied. Only PCs can add companies.');
        return;
    }
    
    // Check if PC can access this specific year
    if (currentUser && currentUser.year_of_passout) {
        const pcYear = currentUser.year_of_passout.toString();
        const currentYear = getYearFromURL();
        
        if (pcYear !== currentYear) {
            showError(`Access denied. You can only add companies for your passing out year (${pcYear}).`);
            return;
        }
    } else {
        showError('Access denied. You need a valid passing out year to add companies.');
        return;
    }
    
    const form = document.getElementById('addCompanyForm');
    const formData = new FormData(form);
    
    // Clear previous error messages
    clearFormErrors();
    
    // Validate each field individually
    const validationErrors = [];
    
    const name = formData.get('name');
    if (!name || name.trim() === '') {
        validationErrors.push('Company Name is required');
        showFieldError('companyName', 'Company Name is required');
    }
    
    const ctc = formData.get('ctc');
    const stipend = formData.get('stipend');
    const role = formData.get('role');
    
    // Clear disabled field values based on role
    let finalCtc = ctc;
    let finalStipend = stipend;
    
    if (role === 'IT') {
        finalCtc = null; // Clear CTC for IT role
    } else if (role === 'FT') {
        finalStipend = null; // Clear stipend for FT role
    }
    
    if (!role || role.trim() === '') {
        validationErrors.push('Role is required');
        showFieldError('companyRole', 'Role is required');
    } else {
        // Role-based validation
        if (role === 'IT') {
            // For IT role, only stipend is compulsory
            if (!finalStipend || finalStipend <= 0) {
                validationErrors.push('Stipend is required for IT role');
                showFieldError('companyStipend', 'Stipend is required for IT role');
            }
        } else if (role === 'IT + PBC') {
            // For IT + PBC role, both CTC and stipend are compulsory
            if (!finalCtc || finalCtc <= 0) {
                validationErrors.push('CTC is required for IT + PBC role');
                showFieldError('companyCTC', 'CTC is required for IT + PBC role');
            }
            if (!finalStipend || finalStipend <= 0) {
                validationErrors.push('Stipend is required for IT + PBC role');
                showFieldError('companyStipend', 'Stipend is required for IT + PBC role');
            }
        } else if (role === 'FT') {
            // For FT role, only CTC is compulsory
            if (!finalCtc || finalCtc <= 0) {
                validationErrors.push('CTC is required for FT role');
                showFieldError('companyCTC', 'CTC is required for FT role');
            }
        } else if (role === 'IT + FT') {
            // For IT + FT role, both CTC and stipend are compulsory
            if (!finalCtc || finalCtc <= 0) {
                validationErrors.push('CTC is required for IT + FT role');
                showFieldError('companyCTC', 'CTC is required for IT + FT role');
            }
            if (!finalStipend || finalStipend <= 0) {
                validationErrors.push('Stipend is required for IT + FT role');
                showFieldError('companyStipend', 'Stipend is required for IT + FT role');
            }
        }
    }
    
    const offers = formData.get('offers');
    if (!offers || offers <= 0) {
        validationErrors.push('Number of Offers must be greater than 0');
        showFieldError('companyOffers', 'Number of Offers must be greater than 0');
    }
    
    const date = formData.get('date_of_visit');
    if (!date) {
        validationErrors.push('Date of Visit is required');
        showFieldError('companyDate', 'Date of Visit is required');
    }
    
    // Validate allowed branches
    if (!validateAllowedBranches('add')) {
        validationErrors.push('Please select at least one allowed branch for the company.');
    }
    
    // If there are validation errors, show them and return
    if (validationErrors.length > 0) {
        showError('Please fix the following errors:\n• ' + validationErrors.join('\n• '));
        return;
    }
    
    const companyData = {
        name: name.trim(),
        ctc: finalCtc ? parseFloat(finalCtc) : null,
        stipend: finalStipend ? parseFloat(finalStipend) : null,
        role: role.trim(),
        offers: parseInt(offers),
        date_of_visit: date,
        interview_details: formData.get('interview_details') || '',
        allowed_branches: getSelectedBranches('add'),
        year: currentYear
    };
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/companies', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(companyData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showSuccess('Company added successfully!');
            closeAddCompanyModal();
            loadYearData(); // Refresh the data
        } else {
            const errorData = await response.json();
            showError(errorData.detail || 'Failed to add company');
        }
    } catch (error) {
        console.error('Error adding company:', error);
        showError('Network error. Please try again.');
    }
}

function editCompany(companyId) {
    if (!isPC) {
        showError('Access denied. Only PCs can edit companies.');
        return;
    }
    
    // Check if PC can access this specific year
    if (currentUser && currentUser.year_of_passout) {
        const pcYear = currentUser.year_of_passout.toString();
        const currentYear = getYearFromURL();
        
        if (pcYear !== currentYear) {
            showError(`Access denied. You can only edit companies for your passing out year (${pcYear}).`);
            return;
        }
    } else {
        showError('Access denied. You need a valid passing out year to edit companies.');
        return;
    }
    
    // Find the company in the data
    const company = companiesData.find(c => c._id === companyId);
    if (!company) {
        showError('Company not found.');
        return;
    }
    
    // Populate the edit form
    document.getElementById('editCompanyId').value = company._id;
    document.getElementById('editCompanyName').value = company.name || '';
    document.getElementById('editCompanyCTC').value = company.ctc || '';
    document.getElementById('editCompanyStipend').value = company.stipend || '';
    document.getElementById('editCompanyRole').value = company.role || '';
    document.getElementById('editCompanyOffers').value = company.offers || '';
    document.getElementById('editCompanyDate').value = company.date_of_visit || '';
    document.getElementById('editCompanyDetails').value = company.interview_details || '';
    
    // Add event listener for role-based validation
    const roleSelect = document.getElementById('editCompanyRole');
    roleSelect.addEventListener('change', function() {
        updateFieldRequirements('edit');
    });
    
    // Update field requirements based on current role
    updateFieldRequirements('edit');

    // Set selected branches in checkboxes
    setSelectedBranches('edit', company.allowed_branches);
    
    // Show the edit modal
    document.getElementById('editCompanyModal').style.display = 'flex';
}

function deleteCompany(companyId) {
    if (!isPC) {
        showError('Access denied. Only PCs can delete companies.');
        return;
    }
    
    // Check if PC can access this specific year
    if (currentUser && currentUser.year_of_passout) {
        const pcYear = currentUser.year_of_passout.toString();
        const currentYear = getYearFromURL();
        
        if (pcYear !== currentYear) {
            showError(`Access denied. You can only delete companies for your passing out year (${pcYear}).`);
            return;
        }
    } else {
        showError('Access denied. You need a valid passing out year to delete companies.');
        return;
    }
    
    // Find the company in the data
    const company = companiesData.find(c => c._id === companyId);
    if (!company) {
        showError('Company not found.');
        return;
    }
    
    // Show confirmation modal
    document.getElementById('confirmMessage').textContent = `Are you sure you want to delete "${company.name}"? This action cannot be undone.`;
    
    // Store the company ID for confirmation
    window.pendingDeleteCompanyId = companyId;
    
    // Show the confirmation modal
    document.getElementById('confirmModal').style.display = 'flex';
}

// Function to confirm delete action
function confirmAction() {
    const companyId = window.pendingDeleteCompanyId;
    if (companyId) {
        performDeleteCompany(companyId);
    }
    closeConfirmModal();
}

// Function to perform the actual delete
async function performDeleteCompany(companyId) {
    // Check if PC can access this specific year
    if (currentUser && currentUser.year_of_passout) {
        const pcYear = currentUser.year_of_passout.toString();
        const currentYear = getYearFromURL();
        
        if (pcYear !== currentYear) {
            showError(`Access denied. You can only delete companies for your passing out year (${pcYear}).`);
            return;
        }
    } else {
        showError('Access denied. You need a valid passing out year to delete companies.');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/companies/${companyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showSuccess('Company deleted successfully!');
            loadYearData(); // Refresh the data
        } else {
            const errorData = await response.json();
            showError(errorData.detail || 'Failed to delete company');
        }
    } catch (error) {
        console.error('Error deleting company:', error);
        showError('Network error. Please try again.');
    }
}

// Function to submit edit company
async function submitEditCompany() {
    if (!isPC) {
        showError('Access denied. Only PCs can edit companies.');
        return;
    }
    
    // Check if PC can access this specific year
    if (currentUser && currentUser.year_of_passout) {
        const pcYear = currentUser.year_of_passout.toString();
        const currentYear = getYearFromURL();
        
        if (pcYear !== currentYear) {
            showError(`Access denied. You can only edit companies for your passing out year (${pcYear}).`);
            return;
        }
    } else {
        showError('Access denied. You need a valid passing out year to edit companies.');
        return;
    }
    
    const form = document.getElementById('editCompanyForm');
    const formData = new FormData(form);
    const companyId = formData.get('company_id');
    
    // Clear previous error messages
    clearEditFormErrors();
    
    // Validate each field individually
    const validationErrors = [];
    
    const name = formData.get('name');
    if (!name || name.trim() === '') {
        validationErrors.push('Company Name is required');
        showEditFieldError('editCompanyName', 'Company Name is required');
    }
    
    const ctc = formData.get('ctc');
    const stipend = formData.get('stipend');
    const role = formData.get('role');
    
    // Clear disabled field values based on role
    let finalCtc = ctc;
    let finalStipend = stipend;
    
    if (role === 'IT') {
        finalCtc = null; // Clear CTC for IT role
    } else if (role === 'FT') {
        finalStipend = null; // Clear stipend for FT role
    }
    
    if (!role || role.trim() === '') {
        validationErrors.push('Role is required');
        showEditFieldError('editCompanyRole', 'Role is required');
    } else {
        // Role-based validation
        if (role === 'IT') {
            // For IT role, only stipend is compulsory
            if (!finalStipend || finalStipend <= 0) {
                validationErrors.push('Stipend is required for IT role');
                showEditFieldError('editCompanyStipend', 'Stipend is required for IT role');
            }
        } else if (role === 'IT + PBC') {
            // For IT + PBC role, both CTC and stipend are compulsory
            if (!finalCtc || finalCtc <= 0) {
                validationErrors.push('CTC is required for IT + PBC role');
                showEditFieldError('editCompanyCTC', 'CTC is required for IT + PBC role');
            }
            if (!finalStipend || finalStipend <= 0) {
                validationErrors.push('Stipend is required for IT + PBC role');
                showEditFieldError('editCompanyStipend', 'Stipend is required for IT + PBC role');
            }
        } else if (role === 'FT') {
            // For FT role, only CTC is compulsory
            if (!finalCtc || finalCtc <= 0) {
                validationErrors.push('CTC is required for FT role');
                showEditFieldError('editCompanyCTC', 'CTC is required for FT role');
            }
        } else if (role === 'IT + FT') {
            // For IT + FT role, both CTC and stipend are compulsory
            if (!finalCtc || finalCtc <= 0) {
                validationErrors.push('CTC is required for IT + FT role');
                showEditFieldError('editCompanyCTC', 'CTC is required for IT + FT role');
            }
            if (!finalStipend || finalStipend <= 0) {
                validationErrors.push('Stipend is required for IT + FT role');
                showEditFieldError('editCompanyStipend', 'Stipend is required for IT + FT role');
            }
        }
    }
    
    const offers = formData.get('offers');
    if (!offers || offers <= 0) {
        validationErrors.push('Number of Offers must be greater than 0');
        showEditFieldError('editCompanyOffers', 'Number of Offers must be greater than 0');
    }
    
    const date = formData.get('date_of_visit');
    if (!date) {
        validationErrors.push('Date of Visit is required');
        showEditFieldError('editCompanyDate', 'Date of Visit is required');
    }

    // Validate allowed branches
    if (!validateAllowedBranches('edit')) {
        validationErrors.push('Please select at least one allowed branch for the company.');
    }
    
    // If there are validation errors, show them and return
    if (validationErrors.length > 0) {
        showError('Please fix the following errors:\n• ' + validationErrors.join('\n• '));
        return;
    }
    
    const companyData = {
        name: name.trim(),
        ctc: finalCtc ? parseFloat(finalCtc) : null,
        stipend: finalStipend ? parseFloat(finalStipend) : null,
        role: role.trim(),
        offers: parseInt(offers),
        date_of_visit: date,
        interview_details: formData.get('interview_details') || '',
        allowed_branches: getSelectedBranches('edit'),
        year: currentYear
    };
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/companies/${companyId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(companyData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showSuccess('Company updated successfully!');
            closeEditCompanyModal();
            loadYearData(); // Refresh the data
        } else {
            const errorData = await response.json();
            showError(errorData.detail || 'Failed to update company');
        }
    } catch (error) {
        console.error('Error updating company:', error);
        showError('Network error. Please try again.');
    }
}

// Function to close edit company modal
function closeEditCompanyModal() {
    document.getElementById('editCompanyModal').style.display = 'none';
    document.getElementById('editCompanyForm').reset();
    clearEditFormErrors(); // Clear any error messages
}

// Function to close confirmation modal
function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    window.pendingDeleteCompanyId = null;
}

// Modal functions
function showSuccess(message) {
    document.getElementById('successTitle').textContent = 'Success!';
    document.getElementById('successMessage').textContent = message;
    document.getElementById('successModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('successModal').style.display = 'none';
    document.getElementById('errorModal').style.display = 'none';
    document.getElementById('interviewDetailsModal').style.display = 'none';
    document.getElementById('confirmModal').style.display = 'none';
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            closeModal();
            closeAddCompanyModal();
            closeEditCompanyModal();
            closeConfirmModal();
        }
    });
});

// Add keyboard navigation for modals
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
        closeAddCompanyModal();
        closeEditCompanyModal();
        closeConfirmModal();
        closeInterviewDetailsModal();
    }
});

// Show loading initially
showLoading();

// Temporary test function to enable PC features (for debugging)
function enablePCTest() {
    console.log('Enabling PC features for testing');
    isPC = true;
    currentUser = { is_pc: true, name: 'Test PC' };
    showPCFeatures();
}

// Make test function globally available
window.enablePCTest = enablePCTest; 

// Function to show field-specific error
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.style.borderColor = '#dc143c';
        field.style.boxShadow = '0 0 0 3px rgba(220, 20, 60, 0.1)';
        
        // Add error message below the field
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#dc143c';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '5px';
        errorDiv.style.fontWeight = '500';
        
        // Remove any existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        field.parentNode.appendChild(errorDiv);
    }
} 

// Function to clear all form errors
function clearFormErrors() {
    const form = document.getElementById('addCompanyForm');
    const fields = form.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
        field.style.borderColor = '#e9ecef';
        field.style.boxShadow = 'none';
    });
    
    // Remove all error messages
    const errorMessages = form.querySelectorAll('.field-error');
    errorMessages.forEach(error => error.remove());
} 

// Function to show field-specific error for edit form
function showEditFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.style.borderColor = '#dc143c';
        field.style.boxShadow = '0 0 0 3px rgba(220, 20, 60, 0.1)';
        
        // Add error message below the field
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#dc143c';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '5px';
        errorDiv.style.fontWeight = '500';
        
        // Remove any existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        field.parentNode.appendChild(errorDiv);
    }
}

// Function to clear all edit form errors
function clearEditFormErrors() {
    const form = document.getElementById('editCompanyForm');
    const fields = form.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
        field.style.borderColor = '#e9ecef';
        field.style.boxShadow = 'none';
    });
    
    // Remove all error messages
    const errorMessages = form.querySelectorAll('.field-error');
    errorMessages.forEach(error => error.remove());
} 

// Function to update field requirements based on selected role
function updateFieldRequirements(formType) {
    const prefix = formType === 'edit' ? 'edit' : '';
    const roleSelect = document.getElementById(prefix ? 'editCompanyRole' : 'companyRole');
    const ctcField = document.getElementById(prefix ? 'editCompanyCTC' : 'companyCTC');
    const stipendField = document.getElementById(prefix ? 'editCompanyStipend' : 'companyStipend');
    const ctcLabel = ctcField.previousElementSibling;
    const stipendLabel = stipendField.previousElementSibling;
    
    const selectedRole = roleSelect.value;
    
    // Reset all fields to optional
    ctcField.required = false;
    stipendField.required = false;
    ctcLabel.innerHTML = ctcLabel.innerHTML.replace(' *', '');
    stipendLabel.innerHTML = stipendLabel.innerHTML.replace(' *', '');
    
         // Update based on role
     if (selectedRole === 'IT') {
         stipendField.required = true;
         stipendLabel.innerHTML = stipendLabel.innerHTML + ' *';
         // Disable CTC field for IT role
         ctcField.disabled = true;
         ctcField.value = '';
     } else if (selectedRole === 'IT + PBC') {
         ctcField.required = true;
         stipendField.required = true;
         ctcLabel.innerHTML = ctcLabel.innerHTML + ' *';
         stipendLabel.innerHTML = stipendLabel.innerHTML + ' *';
         // Enable both fields
         ctcField.disabled = false;
         stipendField.disabled = false;
     } else if (selectedRole === 'FT') {
         ctcField.required = true;
         ctcLabel.innerHTML = ctcLabel.innerHTML + ' *';
         // Disable stipend field for FT role
         stipendField.disabled = true;
         stipendField.value = '';
     } else if (selectedRole === 'IT + FT') {
         ctcField.required = true;
         stipendField.required = true;
         ctcLabel.innerHTML = ctcLabel.innerHTML + ' *';
         stipendLabel.innerHTML = stipendLabel.innerHTML + ' *';
         // Enable both fields
         ctcField.disabled = false;
         stipendField.disabled = false;
     }
} 

// Function to get selected branches from checkboxes
function getSelectedBranches(formType) {
    const prefix = formType === 'edit' ? 'edit_' : '';
    const checkboxes = document.querySelectorAll(`input[name="${prefix}allowed_branches"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

// Function to set selected branches in checkboxes
function setSelectedBranches(formType, branches) {
    const prefix = formType === 'edit' ? 'edit_' : '';
    const checkboxes = document.querySelectorAll(`input[name="${prefix}allowed_branches"]`);
    
    // Clear all checkboxes first
    checkboxes.forEach(cb => cb.checked = false);
    
    // Check the ones that should be selected
    if (branches && Array.isArray(branches)) {
        branches.forEach(branch => {
            const checkbox = document.querySelector(`input[name="${prefix}allowed_branches"][value="${branch}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
}

// Function to validate allowed branches
function validateAllowedBranches(formType) {
    const selectedBranches = getSelectedBranches(formType);
    if (selectedBranches.length === 0) {
        const fieldId = formType === 'edit' ? 'editCompanyBranches' : 'companyBranches';
        showFieldError(fieldId, 'Please select at least one allowed branch');
        return false;
    }
    return true;
}

// Download year report function
async function downloadYearReport() {
    try {
        const year = getYearFromURL();
        const token = localStorage.getItem('token');
        
        if (!token) {
            showError('Please log in to download reports');
            return;
        }

        // Show loading state
        const downloadBtn = document.querySelector('.download-btn');
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
        downloadBtn.disabled = true;

        const response = await fetch(`/api/companies/${year}/download`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `placement_report_${year}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showSuccess('Report downloaded successfully!');
        } else {
            const errorData = await response.json();
            showError(errorData.detail || 'Failed to download report');
        }
    } catch (error) {
        console.error('Error downloading report:', error);
        showError('Failed to download report. Please try again.');
    } finally {
        // Restore button state
        const downloadBtn = document.querySelector('.download-btn');
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Report';
        downloadBtn.disabled = false;
    }
} 