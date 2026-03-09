const API_URL = 'https://scholarship-backend-6rdu.onrender.com/api';

// State
let selectedDate = null;
let selectedTime = null;
let selectedSlotId = null;
let currentSlots = [];
let adminToken = localStorage.getItem('mit_admin_token');

// DOM Elements
const slotsContainer = document.getElementById('slots-container');
const screenHome = document.getElementById('screen-home');
const screenBooking = document.getElementById('screen-booking');
const screenConfirmation = document.getElementById('screen-confirmation');
const selectedSlotDisplay = document.getElementById('selected-slot-display');
const bookingForm = document.getElementById('booking-form');

const navHome = document.getElementById('nav-home');
const navAdmin = document.getElementById('nav-admin');
const studentFlow = document.getElementById('student-flow');
const adminFlow = document.getElementById('admin-flow');

// Admin Elements
const screenAdminLogin = document.getElementById('screen-admin-login');
const screenAdminDashboard = document.getElementById('screen-admin-dashboard');
const adminLoginForm = document.getElementById('admin-login-form');
const btnAdminLogout = document.getElementById('btn-admin-logout');

// Modal Elements
const addSlotsModal = document.getElementById('add-slots-modal');
const btnAddSlotsModal = document.getElementById('btn-add-slots-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const addSlotsForm = document.getElementById('add-slots-form');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchSlots();
    setupEventListeners();
    
    // Check if admin is returning
    if (adminToken) {
        showAdminDashboard();
    }
});

// Fetch slots from API
async function fetchSlots() {
    try {
        const res = await fetch(`${API_URL}/slots`);
        const slots = await res.json();
        currentSlots = slots;
        renderSlots();
        
        // Populate date selector automatically based on available distinct dates
        updateDateSelector();
    } catch (err) {
        console.error('Error fetching slots:', err);
    }
}

function updateDateSelector() {
    // Only unique dates
    const dates = [...new Set(currentSlots.map(s => s.date))];
    
    if (dates.length > 0 && !selectedDate) {
        selectedDate = dates[0];
    }
    
    // We could dynamically build date buttons here, but for now we stick to the HTML structure
    // and manually filter slots based on the clicked date
}

// Render the slots grid
function renderSlots() {
    slotsContainer.innerHTML = '';
    
    // Filter slots by selectedDate (if we had dynamic tabs, currently ignoring filter for simplicity if dates don't match)
    const displaySlots = selectedDate ? currentSlots.filter(s => s.date === selectedDate) : currentSlots;

    if (displaySlots.length === 0) {
        slotsContainer.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1;">No slots available for this date.</p>';
        return;
    }

    displaySlots.forEach((slot) => {
        const slotEl = document.createElement('div');
        slotEl.className = `slot-card ${slot.isFull ? 'full' : ''}`;
        
        const spotsLeft = slot.capacity - slot.bookedCount;
        let iconHtml = slot.isFull ? '<i class="fas fa-ban"></i> Full' : `<i class="fas fa-check"></i> ${spotsLeft} left`;
        
        slotEl.innerHTML = `
            <span class="slot-time">${slot.time}</span>
            <span class="slot-status">${iconHtml}</span>
        `;
        
        if (!slot.isFull) {
            slotEl.addEventListener('click', () => handleSlotClick(slot._id, slot.date, slot.time));
        }
        
        slotsContainer.appendChild(slotEl);
    });
}

async function fetchAdminBookings() {
    try {
        const res = await fetch(`${API_URL}/bookings`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (res.status === 401) {
            handleLogout();
            return;
        }
        
        const bookings = await res.json();
        renderAdminTable(bookings);
        
        // Update stats
        document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = bookings.length;
        document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = bookings.filter(b => b.status === 'Verified').length;
        
    } catch (err) {
        console.error('Error fetching bookings:', err);
    }
}

function renderAdminTable(bookings) {
    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = '';

    bookings.forEach(row => {
        const slotTime = row.slotId ? `${row.slotId.date} ${row.slotId.time}` : 'Unknown';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${slotTime}</strong></td>
            <td>
                <div class="user-info">
                    <span class="name">${row.studentName}</span>
                    <span class="roll">${row.rollNumber}</span>
                </div>
            </td>
            <td>${row.department}</td>
            <td><span class="badge" style="background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border-color);">${row.scholarshipType}</span></td>
            <td><span class="status-badge ${row.status.toLowerCase()}">${row.status}</span></td>
            <td>
                <button class="action-btn verify" onclick="updateBookingStatus('${row._id}', 'Verified')" title="Verify Documents"><i class="fas fa-check-circle"></i></button>
                <button class="action-btn cancel" onclick="updateBookingStatus('${row._id}', 'Cancelled')" title="Cancel Appointment"><i class="fas fa-times"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateBookingStatus = async function(id, status) {
    try {
        await fetch(`${API_URL}/bookings/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status })
        });
        fetchAdminBookings(); // Refresh
        fetchSlots(); // Refresh capacity
    } catch (err) {
        console.error(err);
    }
};

function handleSlotClick(id, date, time) {
    selectedSlotId = id;
    selectedDate = date;
    selectedTime = time;
    selectedSlotDisplay.textContent = `Slot: ${selectedDate}, ${selectedTime}`;
    switchScreen(screenBooking);
}

function setupEventListeners() {
    // Back to home from booking
    document.getElementById('back-to-home').addEventListener('click', () => {
        switchScreen(screenHome);
        bookingForm.reset();
    });

    // Student Form Submission
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            studentName: document.getElementById('studentName').value,
            rollNumber: document.getElementById('rollNumber').value,
            department: document.getElementById('department').value,
            year: document.getElementById('year').value,
            scholarshipType: document.getElementById('scholarshipType').value,
            contactNumber: document.getElementById('contactNumber').value,
            slotId: selectedSlotId
        };

        try {
            const btn = e.target.querySelector('button');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            btn.disabled = true;

            const res = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || 'Error creating booking');
                btn.innerHTML = 'Confirm Appointment';
                btn.disabled = false;
                return;
            }

            // Populate confirmation
            document.getElementById('conf-name').textContent = data.studentName;
            document.getElementById('conf-roll').textContent = data.rollNumber;
            document.getElementById('conf-datetime').textContent = `${data.slotId.date}, ${data.slotId.time}`;
            document.getElementById('conf-scholarship').textContent = data.scholarshipType;
            document.getElementById('conf-id').textContent = data.ticketId;

            switchScreen(screenConfirmation);
            fetchSlots(); // Refresh slot capacities
            
            btn.innerHTML = 'Confirm Appointment';
            btn.disabled = false;
        } catch (err) {
            console.error(err);
            alert('Network error. Please try again.');
        }
    });

    // Return to home from confirmation
    document.getElementById('btn-return-home').addEventListener('click', () => {
        switchScreen(screenHome);
        bookingForm.reset();
    });

    // Date Selectors
    document.querySelectorAll('.date-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
            const currentBtn = e.currentTarget;
            currentBtn.classList.add('active');
            
            // Format to match DB exactly
            const dateObj = new Date(currentBtn.dataset.date);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            selectedDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
            
            // Re-render
            slotsContainer.style.opacity = '0.4';
            setTimeout(() => {
                slotsContainer.style.opacity = '1';
                renderSlots();
            }, 300);
        });
    });

    // Admin Login Logic
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('adminUsername').value;
        const p = document.getElementById('adminPassword').value;
        const errDiv = document.getElementById('login-error');
        
        try {
            const res = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p })
            });
            const data = await res.json();
            
            if (res.ok) {
                adminToken = data.token;
                localStorage.setItem('mit_admin_token', adminToken);
                showAdminDashboard();
                adminLoginForm.reset();
                errDiv.style.display = 'none';
            } else {
                errDiv.textContent = data.message;
                errDiv.style.display = 'block';
            }
        } catch (err) {
            errDiv.textContent = 'Server error during login.';
            errDiv.style.display = 'block';
        }
    });
    
    btnAdminLogout.addEventListener('click', handleLogout);

    // Admin Add Slots Logic
    if (btnAddSlotsModal) {
        btnAddSlotsModal.addEventListener('click', () => {
            addSlotsModal.classList.add('active');
        });
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
            addSlotsModal.classList.remove('active');
            addSlotsForm.reset();
        });
    }

    if (addSlotsForm) {
        addSlotsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const date = document.getElementById('slotDate').value;
            const time = document.getElementById('slotTime').value;
            const capacity = document.getElementById('slotCapacity').value;

            try {
                const btn = e.target.querySelector('button');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
                btn.disabled = true;

                const res = await fetch(`${API_URL}/slots`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({ date, time, capacity })
                });

                const data = await res.json();
                btn.innerHTML = originalText;
                btn.disabled = false;

                if (!res.ok) {
                    alert(data.message || 'Error creating slot');
                    return;
                }

                addSlotsModal.classList.remove('active');
                addSlotsForm.reset();
                fetchSlots(); // Refresh slots map
                
                // Show success
                alert('Slot created successfully!');
            } catch (err) {
                console.error(err);
                alert('Network error. Please try again.');
            }
        });
    }

    // Navigation (Student vs Admin)
    navHome.addEventListener('click', () => {
        if(navHome.classList.contains('active')) return;
        navAdmin.classList.remove('active');
        navHome.classList.add('active');
        adminFlow.classList.remove('active');
        studentFlow.classList.add('active');
        fetchSlots(); // Refresh slots for student view
    });

    navAdmin.addEventListener('click', () => {
        if(navAdmin.classList.contains('active')) return;
        navHome.classList.remove('active');
        navAdmin.classList.add('active');
        studentFlow.classList.remove('active');
        adminFlow.classList.add('active');
        
        if (adminToken) {
            showAdminDashboard();
        } else {
            screenAdminLogin.classList.add('active');
            screenAdminDashboard.classList.remove('active');
        }
    });
}

function showAdminDashboard() {
    screenAdminLogin.classList.remove('active');
    screenAdminDashboard.classList.add('active');
    fetchAdminBookings();
}

function handleLogout() {
    adminToken = null;
    localStorage.removeItem('mit_admin_token');
    screenAdminDashboard.classList.remove('active');
    screenAdminLogin.classList.add('active');
}

function switchScreen(activeScreen) {
    document.querySelectorAll('#student-flow .screen').forEach(screen => {
        screen.classList.remove('active');
    });
    activeScreen.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
