// login.js - Sistema de autenticación y navegación por roles

// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Módulos disponibles por rol
const MODULES_BY_ROLE = {
    'Inspector_LQC': [
        {
            icon: '📸',
            iconClass: 'capture',
            title: 'Captura de Defectos',
            description: 'Registrar nuevos defectos detectados',
            url: 'capture.html'
        }
    ],
    'Inspector_OQC': [
        {
            icon: '📸',
            iconClass: 'capture',
            title: 'Captura de Defectos',
            description: 'Registrar nuevos defectos detectados',
            url: 'capture.html'
        }
    ],
    'Tecnico_Reparacion': [
        {
            icon: '🔧',
            iconClass: 'repair',
            title: 'Reparación',
            description: 'Gestionar reparaciones de defectos',
            url: 'reparacion.html'
        }
    ],
    'Inspector_QA': [
        {
            icon: '✅',
            iconClass: 'qa',
            title: 'Validación QA',
            description: 'Aprobar o rechazar reparaciones',
            url: 'qa-validacion.html'
        }
    ],
    'Admin': [
        {
            icon: '📸',
            iconClass: 'capture',
            title: 'Captura de Defectos',
            description: 'Registrar nuevos defectos detectados',
            url: 'capture.html'
        },
        {
            icon: '🔧',
            iconClass: 'repair',
            title: 'Reparación',
            description: 'Gestionar reparaciones de defectos',
            url: 'reparacion.html'
        },
        {
            icon: '✅',
            iconClass: 'qa',
            title: 'Validación QA',
            description: 'Aprobar o rechazar reparaciones',
            url: 'qa-validacion.html'
        },
        {
            icon: '⚙️',
            iconClass: 'admin',
            title: 'Administración',
            description: 'Configuración y reportes del sistema',
            url: 'menu.html'
        }
    ]
};

// Verificar si ya hay sesión activa al cargar
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');

    if (token && userData) {
        // Verificar que el token sea válido
        verifyToken(token);
    }
});

// Manejo del formulario de login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showAlert('Por favor ingresa usuario y contraseña', 'danger');
        return;
    }

    await login(username, password);
});

// Función de login
async function login(username, password) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const loginForm = document.getElementById('loginForm');
    const alertContainer = document.getElementById('alertContainer');

    try {
        // Mostrar spinner
        loginForm.style.display = 'none';
        loadingSpinner.style.display = 'block';
        alertContainer.innerHTML = '';

        // Llamar a la API de login
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            username: username,
            password: password
        });

        if (response.data.success) {
            const { token, user } = response.data;

            // Guardar en localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('userData', JSON.stringify(user));

            // Configurar axios para usar el token en futuras peticiones
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Mostrar dashboard
            showDashboard(user);
        } else {
            throw new Error(response.data.message || 'Error en el login');
        }

    } catch (error) {
        console.error('Error en login:', error);
        
        let errorMessage = 'Error al iniciar sesión. Por favor intenta nuevamente.';
        
        if (error.response) {
            if (error.response.status === 401) {
                errorMessage = 'Usuario o contraseña incorrectos';
            } else if (error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            }
        } else if (error.request) {
            errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
        }

        showAlert(errorMessage, 'danger');
        
        // Volver a mostrar el formulario
        loginForm.style.display = 'block';
        loadingSpinner.style.display = 'none';
    }
}

// Verificar token existente
async function verifyToken(token) {
    try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const response = await axios.get(`${API_BASE_URL}/auth/verify`);

        if (response.data.success) {
            const userData = JSON.parse(localStorage.getItem('userData'));
            showDashboard(userData);
        } else {
            // Token inválido, limpiar localStorage
            logout();
        }
    } catch (error) {
        console.error('Error verificando token:', error);
        logout();
    }
}

// Mostrar dashboard con módulos según rol
function showDashboard(user) {
    const loginContainer = document.getElementById('loginContainer');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const userName = document.getElementById('userName');
    const moduleGrid = document.getElementById('moduleGrid');

    // Ocultar login, mostrar dashboard
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'block';

    // Mostrar nombre del usuario
    userName.textContent = user.nombre_completo || user.username;

    // Obtener módulos según el rol
    const modules = MODULES_BY_ROLE[user.rol] || [];

    // Si no hay módulos, mostrar mensaje de error
    if (modules.length === 0) {
        moduleGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <p style="color: var(--ilsan-accent-red); font-size: 20px;">
                    No tienes módulos asignados. Contacta al administrador.
                </p>
            </div>
        `;
        return;
    }

    // Renderizar módulos
    moduleGrid.innerHTML = modules.map(module => `
        <a href="${module.url}" class="module-card">
            <div class="module-icon ${module.iconClass}">${module.icon}</div>
            <h3>${module.title}</h3>
            <p>${module.description}</p>
        </a>
    `).join('');
}

// Función de logout
function logout() {
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    // Limpiar header de axios
    delete axios.defaults.headers.common['Authorization'];

    // Volver a mostrar login
    const loginContainer = document.getElementById('loginContainer');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const loginForm = document.getElementById('loginForm');
    const loadingSpinner = document.getElementById('loadingSpinner');

    dashboardContainer.style.display = 'none';
    loginContainer.style.display = 'block';
    loginForm.style.display = 'block';
    loadingSpinner.style.display = 'none';

    // Limpiar formulario
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('alertContainer').innerHTML = '';
}

// Mostrar alerta
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    
    const alertClass = type === 'danger' ? 'alert-danger' : 
                       type === 'success' ? 'alert-success' : 
                       'alert-info';

    alertContainer.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}

// Función global para cerrar sesión (llamada desde el HTML)
window.logout = logout;
