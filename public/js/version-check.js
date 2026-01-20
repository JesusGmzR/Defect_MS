/**
 * Version Check System
 * Verifica la versión de la aplicación y cierra sesión automáticamente
 * si hay una nueva versión disponible.
 */

(function () {
    const VERSION_KEY = 'dms_app_version';
    const CHECK_INTERVAL = 60000; // Verificar cada 60 segundos

    /**
     * Verifica la versión de la aplicación
     */
    async function checkVersion() {
        try {
            const response = await fetch('/api/version');
            if (!response.ok) return;

            const data = await response.json();
            const serverVersion = data.version;
            const localVersion = localStorage.getItem(VERSION_KEY);

            console.log(`📦 Versión del servidor: ${serverVersion}`);
            console.log(`📦 Versión local: ${localVersion || 'ninguna'}`);

            if (!localVersion) {
                // Primera vez, guardar la versión
                localStorage.setItem(VERSION_KEY, serverVersion);
                console.log('📦 Primera carga, versión guardada');
                return;
            }

            if (localVersion !== serverVersion) {
                console.log('🔄 Nueva versión detectada, cerrando sesión...');

                // Limpiar localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                localStorage.removeItem('dms_token');
                localStorage.removeItem('dms_user');

                // Actualizar versión
                localStorage.setItem(VERSION_KEY, serverVersion);

                // Mostrar mensaje y redirigir
                alert('Se ha actualizado la aplicación. Por favor, inicia sesión nuevamente.');

                // Redirigir al login
                window.location.href = '/index.html';
            }
        } catch (error) {
            console.warn('⚠️ No se pudo verificar la versión:', error);
        }
    }

    // Verificar al cargar la página
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkVersion);
    } else {
        checkVersion();
    }

    // Verificar periódicamente (solo si hay sesión activa)
    setInterval(() => {
        const token = localStorage.getItem('token') || localStorage.getItem('dms_token');
        if (token) {
            checkVersion();
        }
    }, CHECK_INTERVAL);
})();
