/**
 * Admin Module - User Management
 * DMS - Defect Management System
 */

// API Base URL
const API_URL = '/api';

// Store users data
let usersData = [];
let currentUser = null;

// Bootstrap modals
let userModal, passwordModal, deleteModal, toast;

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();
    
    // Initialize Bootstrap components
    userModal = new bootstrap.Modal(document.getElementById('userModal'));
    passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    toast = new bootstrap.Toast(document.getElementById('toast'));
    
    // Load users
    loadUsers();
    
    // Load roles
    loadRoles();
    
    // Load areas
    loadAreas();
    
    // Setup event listeners
    setupEventListeners();
});

/**
 * Load areas from API
 */
async function loadAreas() {
    try {
        const response = await axios.get(`${API_URL}/usuarios/areas/list`);
        
        if (response.data.success) {
            const areas = response.data.data;
            const areaSelect = document.getElementById('area');
            
            // Clear existing options except the first one
            areaSelect.innerHTML = '<option value="">Sin área asignada</option>';
            
            areas.forEach(area => {
                const option = document.createElement('option');
                option.value = area.value;
                option.textContent = area.label;
                areaSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar áreas:', error);
    }
}

/**
 * Load roles from API
 */
async function loadRoles() {
    try {
        const response = await axios.get(`${API_URL}/usuarios/roles/list`);
        
        if (response.data.success) {
            const roles = response.data.data;
            const rolSelect = document.getElementById('rol');
            const filterRoleSelect = document.getElementById('filterRole');
            
            // Clear existing options except the first one
            rolSelect.innerHTML = '<option value="">Seleccionar rol...</option>';
            filterRoleSelect.innerHTML = '<option value="">Todos los roles</option>';
            
            roles.forEach(role => {
                // Add to form select
                const option = document.createElement('option');
                option.value = role.value;
                option.textContent = role.label;
                rolSelect.appendChild(option);
                
                // Add to filter select
                const filterOption = document.createElement('option');
                filterOption.value = role.value;
                filterOption.textContent = role.label;
                filterRoleSelect.appendChild(filterOption);
            });
        }
    } catch (error) {
        console.error('Error al cargar roles:', error);
    }
}

/**
 * Check if user is authenticated and is admin
 */
function checkAuth() {
    // Support both storage keys for compatibility
    const token = localStorage.getItem('dms_token') || localStorage.getItem('token');
    const userStr = localStorage.getItem('dms_user') || localStorage.getItem('userData');
    const user = JSON.parse(userStr || '{}');
    
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    const adminRoles = ['Admin', 'Admin_Calidad', 'Admin_Reparacion'];
    if (!adminRoles.includes(user.rol)) {
        showToast('Acceso denegado', 'No tienes permisos de administrador', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    currentUser = user;
    
    // Setup axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', debounce(filterUsers, 300));
    
    // Filter selects
    document.getElementById('filterRole').addEventListener('change', filterUsers);
    document.getElementById('filterStatus').addEventListener('change', filterUsers);
    
    // Username input - prevent spaces
    document.getElementById('username').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\s/g, '').toLowerCase();
    });
}

/**
 * Load users from API
 */
async function loadUsers() {
    try {
        const response = await axios.get(`${API_URL}/usuarios`);
        
        if (response.data.success) {
            usersData = response.data.data;
            renderUsers(usersData);
            updateStats();
        }
    } catch (error) {
        handleApiError(error, 'Error al cargar usuarios');
    }
}

/**
 * Render users table
 */
function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (users.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td><strong>${user.username}</strong></td>
            <td>${user.nombre_completo}</td>
            <td><span class="badge-role ${getRoleBadgeClass(user.rol)}">${formatRole(user.rol)}</span></td>
            <td>${user.area || '-'}</td>
            <td><span class="badge-status ${user.activo ? 'active' : 'inactive'}">${user.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td>${formatDate(user.ultimo_acceso)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action edit" onclick="openEditModal(${user.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-action password" onclick="openPasswordModal(${user.id}, '${user.username}')" title="Cambiar contraseña">
                        <i class="bi bi-key"></i>
                    </button>
                    ${user.id !== currentUser.id ? `
                        <button class="btn-action delete" onclick="openDeleteModal(${user.id}, '${user.username}')" title="Desactivar">
                            <i class="bi bi-person-x"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Update statistics
 */
function updateStats() {
    document.getElementById('totalUsers').textContent = usersData.length;
    document.getElementById('activeUsers').textContent = usersData.filter(u => u.activo).length;
    document.getElementById('inactiveUsers').textContent = usersData.filter(u => !u.activo).length;
    
    const adminRoles = ['Admin', 'Admin_Calidad', 'Admin_Reparacion'];
    document.getElementById('adminUsers').textContent = usersData.filter(u => adminRoles.includes(u.rol)).length;
}

/**
 * Filter users based on search and filters
 */
function filterUsers() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const roleFilter = document.getElementById('filterRole').value;
    const statusFilter = document.getElementById('filterStatus').value;
    
    let filtered = usersData;
    
    // Search filter
    if (search) {
        filtered = filtered.filter(u => 
            u.username.toLowerCase().includes(search) || 
            u.nombre_completo.toLowerCase().includes(search)
        );
    }
    
    // Role filter
    if (roleFilter) {
        filtered = filtered.filter(u => u.rol === roleFilter);
    }
    
    // Status filter
    if (statusFilter !== '') {
        const isActive = statusFilter === '1';
        filtered = filtered.filter(u => u.activo === isActive);
    }
    
    renderUsers(filtered);
}

/**
 * Open create user modal
 */
function openCreateModal() {
    document.getElementById('modalTitle').textContent = 'Nuevo Usuario';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('username').disabled = false;
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('password').required = true;
    document.getElementById('statusGroup').style.display = 'none';
    
    userModal.show();
}

/**
 * Open edit user modal
 */
async function openEditModal(userId) {
    try {
        const response = await axios.get(`${API_URL}/usuarios/${userId}`);
        
        if (response.data.success) {
            const user = response.data.data;
            
            document.getElementById('modalTitle').textContent = 'Editar Usuario';
            document.getElementById('userId').value = user.id;
            document.getElementById('username').value = user.username;
            document.getElementById('username').disabled = true;
            document.getElementById('nombre_completo').value = user.nombre_completo;
            document.getElementById('rol').value = user.rol;
            document.getElementById('area').value = user.area || '';
            document.getElementById('activo').checked = user.activo;
            
            // Hide password field for edit
            document.getElementById('passwordGroup').style.display = 'none';
            document.getElementById('password').required = false;
            
            // Show status field
            document.getElementById('statusGroup').style.display = 'block';
            
            userModal.show();
        }
    } catch (error) {
        handleApiError(error, 'Error al cargar usuario');
    }
}

/**
 * Save user (create or update)
 */
async function saveUser() {
    const userId = document.getElementById('userId').value;
    const isEdit = userId !== '';
    
    // Gather form data
    const userData = {
        nombre_completo: document.getElementById('nombre_completo').value.trim(),
        rol: document.getElementById('rol').value,
        area: document.getElementById('area').value || null
    };
    
    if (!isEdit) {
        userData.username = document.getElementById('username').value.trim();
        userData.password = document.getElementById('password').value;
        
        // Validate password for new users
        if (!userData.password || userData.password.length < 6) {
            showToast('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
    } else {
        userData.activo = document.getElementById('activo').checked;
    }
    
    // Validate required fields
    if (!userData.nombre_completo || !userData.rol) {
        showToast('Error', 'Completa todos los campos requeridos', 'error');
        return;
    }
    
    try {
        let response;
        
        if (isEdit) {
            response = await axios.put(`${API_URL}/usuarios/${userId}`, userData);
        } else {
            response = await axios.post(`${API_URL}/usuarios`, userData);
        }
        
        if (response.data.success) {
            showToast('Éxito', response.data.message, 'success');
            userModal.hide();
            loadUsers();
        }
    } catch (error) {
        handleApiError(error, 'Error al guardar usuario');
    }
}

/**
 * Open change password modal
 */
function openPasswordModal(userId, username) {
    document.getElementById('passwordUserId').value = userId;
    document.getElementById('passwordUserName').textContent = username;
    document.getElementById('passwordForm').reset();
    
    passwordModal.show();
}

/**
 * Change user password
 */
async function changePassword() {
    const userId = document.getElementById('passwordUserId').value;
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    
    // Validate
    if (!newPassword || newPassword.length < 6) {
        showToast('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('Error', 'Las contraseñas no coinciden', 'error');
        return;
    }
    
    try {
        const response = await axios.put(`${API_URL}/usuarios/${userId}/password`, {
            new_password: newPassword
        });
        
        if (response.data.success) {
            showToast('Éxito', 'Contraseña actualizada correctamente', 'success');
            passwordModal.hide();
        }
    } catch (error) {
        handleApiError(error, 'Error al cambiar contraseña');
    }
}

/**
 * Open delete confirmation modal
 */
function openDeleteModal(userId, username) {
    document.getElementById('deleteUserId').value = userId;
    document.getElementById('deleteUserName').textContent = username;
    
    deleteModal.show();
}

/**
 * Confirm delete (deactivate) user
 */
async function confirmDelete() {
    const userId = document.getElementById('deleteUserId').value;
    
    try {
        const response = await axios.delete(`${API_URL}/usuarios/${userId}`);
        
        if (response.data.success) {
            showToast('Éxito', response.data.message, 'success');
            deleteModal.hide();
            loadUsers();
        }
    } catch (error) {
        handleApiError(error, 'Error al desactivar usuario');
    }
}

/**
 * Toggle password visibility
 */
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('bi-eye-slash', 'bi-eye');
    }
}

/**
 * Show toast notification
 */
function showToast(title, message, type = 'info') {
    const toastEl = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // Set icon and color based on type
    toastIcon.className = 'bi me-2';
    switch (type) {
        case 'success':
            toastIcon.classList.add('bi-check-circle', 'text-success');
            toastIcon.style.color = '#2ecc71'; // Bright green
            break;
        case 'error':
            toastIcon.classList.add('bi-x-circle', 'text-danger');
            toastIcon.style.color = '#ff4d4d'; // Bright red
            break;
        default:
            toastIcon.classList.add('bi-info-circle', 'text-info');
            toastIcon.style.color = '#3498db'; // Bright blue
    }
    
    toast.show();
}

/**
 * Handle API errors
 */
function handleApiError(error, defaultMessage) {
    console.error(error);
    
    if (error.response) {
        if (error.response.status === 401) {
            localStorage.removeItem('dms_token');
            localStorage.removeItem('dms_user');
            window.location.href = 'index.html';
            return;
        }
        
        showToast('Error', error.response.data.error || defaultMessage, 'error');
    } else {
        showToast('Error', defaultMessage, 'error');
    }
}

/**
 * Format role for display
 */
function formatRole(rol) {
    const roles = {
        'Admin': 'Super Admin',
        'Admin_Calidad': 'Admin Calidad',
        'Admin_Reparacion': 'Admin Reparación',
        'Inspector_LQC': 'Inspector LQC',
        'Inspector_OQC': 'Inspector OQC',
        'Tecnico_Reparacion': 'Técnico Reparación',
        'Inspector_QA': 'Inspector QA'
    };
    return roles[rol] || rol;
}

/**
 * Get badge class for role
 */
function getRoleBadgeClass(rol) {
    const classes = {
        'Admin': 'admin',
        'Admin_Calidad': 'admin',
        'Admin_Reparacion': 'admin',
        'Inspector_LQC': 'inspector-lqc',
        'Inspector_OQC': 'inspector-oqc',
        'Tecnico_Reparacion': 'tecnico',
        'Inspector_QA': 'inspector-qa'
    };
    return classes[rol] || '';
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
    if (!dateStr) return 'Nunca';
    
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
