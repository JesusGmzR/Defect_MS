const { createApp } = Vue;

// Zona horaria fija: Monterrey, México
const MX_TIMEZONE = 'America/Monterrey';

// Catálogo oficial de defectos con su código
const DEFECTOS_CATALOGO = [
  { nombre: 'AL REVES', codigo: 'AR' },
  { nombre: 'BOTON DURO', codigo: 'BD' },
  { nombre: 'COMPONENTE EXTRA', codigo: 'CE' },
  { nombre: 'CONTAMINADO', codigo: 'CT' },
  { nombre: 'CORTO', codigo: 'CO' },
  { nombre: 'DAÑADO', codigo: 'DA' },
  { nombre: 'DESALINEADO', codigo: 'DE' },
  { nombre: 'ETIQUETA EQUIVOCADA', codigo: 'EEQ' },
  { nombre: 'EQUIVOCADO', codigo: 'EQ' },
  { nombre: 'EXCESO DE COATING', codigo: 'EC' },
  { nombre: 'EXCESO SOLDADURA', codigo: 'ES' },
  { nombre: 'FALTANTE', codigo: 'FA' },
  { nombre: 'FALTANTE DE COATING', codigo: 'FC' },
  { nombre: 'FALTANTE SOLDADURA', codigo: 'FS' },
  { nombre: 'FLUX', codigo: 'FX' },
  { nombre: 'INVERTIDO', codigo: 'INV' },
  { nombre: 'LED AMARILLO', codigo: 'LA' },
  { nombre: 'LEVANTADO', codigo: 'LE' },
  { nombre: 'MAL CORTE', codigo: 'MC' },
  { nombre: 'MAL ENSAMBLE', codigo: 'ME' },
  { nombre: 'MALA FUSION', codigo: 'MF' },
  { nombre: 'MALA INSERCION', codigo: 'MI' },
  { nombre: 'MATERIAL MAL IDENTIFICADO', codigo: 'MTR' },
  { nombre: 'PANDEADA', codigo: 'PN' },
  { nombre: 'PIN CORTO', codigo: 'PC' },
  { nombre: 'PIN LARGO', codigo: 'PL' },
  { nombre: 'POSICION EQUIVOCADA', codigo: 'POE' },
  { nombre: 'PROGRAMACION EQUIVOCADA', codigo: 'PE' },
  { nombre: 'PROGRAMACION FALTANTE', codigo: 'PF' },
  { nombre: 'QUEBRADO', codigo: 'QB' },
  { nombre: 'RAYADO', codigo: 'RY' },
  { nombre: 'REBABA', codigo: 'RB' },
  { nombre: 'RESIDUO IMD', codigo: 'RIMD' },
  { nombre: 'SCRAP', codigo: 'S' },
  { nombre: 'SCRAP ANALISIS', codigo: 'SA' },
  { nombre: 'SCRAP MR', codigo: 'SMR' },
  { nombre: 'SERIGRAFIA BORROSA', codigo: 'SEB' },
  { nombre: 'SERIGRAFIA CORRIDA', codigo: 'SC' },
  { nombre: 'SERIGRAFIA FALTANTE', codigo: 'SF' },
  { nombre: 'SILICON', codigo: 'SL' },
  { nombre: 'SOLDER BALL', codigo: 'SB' }
];

// Normaliza un string de fecha a objeto Date sin saltos de día por zona horaria
const toDateSafe = (fechaStr) => {
  if (!fechaStr) return null;
  // Si viene sólo YYYY-MM-DD, lo convertimos a medio día UTC para evitar retrocesos de día
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    return new Date(`${fechaStr}T12:00:00Z`);
  }
  return new Date(fechaStr);
};

// Fecha local en formato YYYY-MM-DD usando la zona horaria de Monterrey
const getLocalISODate = (tz = MX_TIMEZONE) => {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

// Hora local HH:mm:ss en la zona horaria de Monterrey
const getLocalTimeString = (tz = MX_TIMEZONE) => {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date());
};

createApp({
  data() {
    return {
      nuevoDefecto: {
        fecha: getLocalISODate(),
        linea: '',
        codigo: '',
        defecto: '',
        ubicacion: '',
        area: '',
        tipo_inspeccion: 'Visual',
        etapa_deteccion: '', // Se establecerá según el rol del usuario
        modelo: ''
      },
      defectosHoy: [],
      lineas: ['M1', 'M2', 'M3', 'M4', 'DP1', 'DP2', 'DP3', 'Harness'],
      areas: ['SMD', 'IMD', 'Ensamble', 'Mantenimiento', 'Micom', 'Calidad', 'Area de Proveedor'],
      defectosCatalogo: DEFECTOS_CATALOGO,
      defectosComunes: DEFECTOS_CATALOGO.map(d => d.nombre),
      filtros: {
        materialId: '',
        defectReason: '',
        linea: '',
        fechaInicio: getLocalISODate(),
        fechaFin: getLocalISODate()
      },
      mensajeModal: {
        titulo: '',
        mensaje: '',
        tipo: 'exito'
      },
      // Detección de dispositivo
      // Galaxy Tab A9 viewport real: vertical ~767px, horizontal ~1200px
      // Mobile: hasta 820px (cubre Galaxy Tab A9 vertical con margen)
      // Tablet: 821px - 1200px
      esTablet: window.innerWidth > 820 && window.innerWidth <= 1200,
      esMobile: window.innerWidth <= 820,
      showManualCodigo: false,
      // Escáner QR
      html5QrCode: null,
      availableCameras: [],
      currentCameraId: null,
      scannedCode: null,
      lastScannedCode: null,
      lastScanTime: 0,
      cameraReady: false,
      cameraInitializing: false,
      cameraStatus: 'Presiona el botón para activar la cámara',
      selectedDefecto: null,
      // Usuario dropdown
      showUserDropdown: false,
      nombreUsuario: '',
      rolUsuario: '',
      puedeCapturar: false, // Solo Inspector_LQC e Inspector_OQC pueden capturar
      // Toggle lista de defectos
      mostrarListaDefectos: false,
      // Móvil
      mostrarSidebarMobile: false,
      mostrarModalCapturaMobile: false,
      // Zoom control
      zoomLevel: 1,
      minZoom: 1,
      maxZoom: 3,
      videoTrack: null
    }
  },
  mounted() {
    this.cargarDefectos();
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    // Detectar cambio de orientación en dispositivos móviles/tablet
    window.addEventListener('orientationchange', () => {
      // Pequeño delay para que las dimensiones se actualicen
      setTimeout(() => this.handleResize(), 100);
    });

    // Inicializar estado de lista según el tamaño de pantalla
    // Desktop y Tablet (>820px): visible, Móvil (<=820px): oculta
    this.mostrarListaDefectos = window.innerWidth > 820;

    // Cargar información del usuario desde localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      this.nombreUsuario = user.nombre_completo || user.username;
      this.rolUsuario = user.rol;

      // Solo Inspector_LQC e Inspector_OQC pueden capturar defectos
      const rolesCaptura = ['Inspector_LQC', 'Inspector_OQC'];
      this.puedeCapturar = rolesCaptura.includes(user.rol);

      // Establecer etapa_deteccion según el rol del inspector
      if (user.rol === 'Inspector_LQC') {
        this.nuevoDefecto.etapa_deteccion = 'LQC';
      } else if (user.rol === 'Inspector_OQC') {
        this.nuevoDefecto.etapa_deteccion = 'OQC';
      }
      // Para otros roles (Supervisor_Calidad, Admin, etc.) no se establece - solo pueden consultar
    }

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', () => {
      if (this.showUserDropdown) {
        this.showUserDropdown = false;
      }
    });

    // Atajo de teclado F1 para capturar (solo si el usuario puede capturar)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F1' && this.puedeCapturar) {
        e.preventDefault();
        this.capturarDefecto();
      }
    });

    // Cargar defectos cada 30 segundos
    setInterval(() => {
      this.cargarDefectos();
    }, 30000);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleResize);
  },
  computed: {
    defectosFiltrados() {
      let defectos = [...this.defectosHoy];
      console.log('🔧 Filtrando defectos. Total inicial:', defectos.length);
      console.log('🔧 Filtros activos:', this.filtros);

      if (this.filtros.materialId) {
        defectos = defectos.filter(d =>
          d.codigo && d.codigo.toLowerCase().includes(this.filtros.materialId.toLowerCase())
        );
        console.log('🔧 Después filtro materialId:', defectos.length);
      }

      if (this.filtros.defectReason) {
        defectos = defectos.filter(d =>
          d.defecto && d.defecto.includes(this.filtros.defectReason)
        );
        console.log('🔧 Después filtro defectReason:', defectos.length);
      }

      if (this.filtros.linea) {
        defectos = defectos.filter(d =>
          d.linea === this.filtros.linea
        );
        console.log('🔧 Después filtro linea:', defectos.length);
      }

      // NO aplicar filtro de fecha aquí porque ya se aplica en el servidor

      console.log('✅ Total defectos filtrados:', defectos.length);
      return defectos;
    },
    topPartCodes() {
      const conteos = {};
      this.defectosHoy.forEach(def => {
        if (def.codigo) {
          const prefix = def.codigo.slice(0, 11);
          if (prefix.trim()) {
            conteos[prefix] = (conteos[prefix] || 0) + 1;
          }
        }
      });
      return Object.entries(conteos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([prefix, count]) => ({ prefix, count }));
    }
  },
  methods: {
    // User dropdown methods
    toggleUserDropdown() {
      console.log('🔄 Toggle dropdown:', !this.showUserDropdown);
      this.showUserDropdown = !this.showUserDropdown;
    },
    closeUserDropdown() {
      console.log('❌ Cerrando dropdown');
      this.showUserDropdown = false;
    },
    cerrarSesion() {
      console.log('🚪 Cerrando sesión');
      // Limpiar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      // Redirigir al login
      window.location.href = 'index.html';
    },
    toggleListaDefectos() {
      console.log('📋 Toggle lista defectos:', !this.mostrarListaDefectos);
      this.mostrarListaDefectos = !this.mostrarListaDefectos;
    },
    handleResize() {
      // Breakpoints basados en viewport real
      // Mobile: hasta 820px (Galaxy Tab A9 vertical ~767px + margen)
      // Tablet: 821px - 1200px (Galaxy Tab A9 horizontal ~1200px)
      // Desktop: > 1200px
      const w = window.innerWidth;

      this.esTablet = w > 820 && w <= 1200;
      this.esMobile = w <= 820;

      console.log(`📱 Resize: ${w}px | Mobile: ${this.esMobile} | Tablet: ${this.esTablet}`);
    },
    async cargarDefectos() {
      try {
        const params = {};

        if (this.filtros.fechaInicio && this.filtros.fechaFin) {
          params.fechaInicio = this.filtros.fechaInicio;
          params.fechaFin = this.filtros.fechaFin;
        }

        console.log('🔍 Cargando defectos con params:', params);
        const response = await axios.get('/api/defectos', { params });
        console.log('📦 Respuesta del servidor:', response.data);
        console.log('📊 Total defectos recibidos:', response.data.length);
        this.defectosHoy = response.data;
        console.log('✅ defectosHoy actualizado:', this.defectosHoy.length);
      } catch (error) {
        console.error('❌ Error al cargar defectos:', error);
      }
    },
    seleccionarLinea(linea) {
      this.nuevoDefecto.linea = linea;
    },
    seleccionarArea(area) {
      this.nuevoDefecto.area = area;
    },
    seleccionarCodigoPrefix(prefix) {
      this.nuevoDefecto.codigo = prefix;
      this.showManualCodigo = false;
    },
    toggleManualCodigo() {
      this.showManualCodigo = !this.showManualCodigo;
    },
    seleccionarDefectoRapido(defecto) {
      this.nuevoDefecto.defecto = defecto;
    },

    async capturarDefecto() {
      try {
        // Verificar que el usuario tiene permisos para capturar
        if (!this.puedeCapturar) {
          this.mostrarMensaje('Acceso Denegado', 'Solo los inspectores pueden capturar defectos', 'error');
          return;
        }

        // Validar campos
        if (!this.nuevoDefecto.fecha ||
          !this.nuevoDefecto.linea ||
          !this.nuevoDefecto.codigo ||
          !this.nuevoDefecto.defecto ||
          !this.nuevoDefecto.ubicacion ||
          !this.nuevoDefecto.area) {
          this.mostrarMensaje('Error', 'Todos los campos son requeridos', 'error');
          return;
        }

        // Combinar fecha seleccionada con hora actual en zona Monterrey
        const fechaSeleccionada = this.nuevoDefecto.fecha; // Fecha del formulario (YYYY-MM-DD)
        const horaActual = getLocalTimeString();

        const fechaHoraLocal = `${fechaSeleccionada} ${horaActual}`;
        console.log('🕐 Fecha seleccionada:', fechaSeleccionada);
        console.log('🕐 Hora actual:', horaActual);
        console.log('🕐 Fecha/Hora a registrar:', fechaHoraLocal);

        // Preparar datos
        const defectoData = {
          fecha: fechaHoraLocal, // Enviar fecha seleccionada + hora actual en formato MySQL
          linea: this.nuevoDefecto.linea,
          codigo: this.nuevoDefecto.codigo.trim().toUpperCase(),
          defecto: this.nuevoDefecto.defecto.trim(),
          ubicacion: this.nuevoDefecto.ubicacion.trim(),
          area: this.nuevoDefecto.area,
          modelo: this.nuevoDefecto.modelo || '',
          tipo_inspeccion: this.nuevoDefecto.tipo_inspeccion,
          etapa_deteccion: this.nuevoDefecto.etapa_deteccion,
          registrado_por: this.nombreUsuario || 'Sistema'
        };

        console.log('📤 Datos enviados al servidor:', defectoData);

        // Enviar al servidor
        const response = await axios.post('/api/defectos', defectoData);

        if (response.data.success) {
          this.mostrarMensaje('Éxito', 'Defecto capturado correctamente', 'exito');
          this.limpiarFormulario();
          this.cargarDefectos();

          // Cerrar modal móvil después de capturar
          if (this.esMobile) {
            this.mostrarModalCapturaMobile = false;
          }
        }
      } catch (error) {
        console.error('Error al capturar defecto:', error);
        const mensaje = error.response?.data?.error || 'Error al capturar el defecto';
        this.mostrarMensaje('Error', mensaje, 'error');
      }
    },

    limpiarFormulario() {
      this.nuevoDefecto.linea = '';
      this.nuevoDefecto.codigo = '';
      this.nuevoDefecto.defecto = '';
      this.nuevoDefecto.ubicacion = '';
      this.nuevoDefecto.area = '';
      this.nuevoDefecto.modelo = '';
      this.nuevoDefecto.fecha = getLocalISODate();
      this.scannedCode = null;
      this.showManualCodigo = false;

      // Cerrar modal móvil al limpiar
      if (this.esMobile) {
        this.mostrarModalCapturaMobile = false;
      }
    },

    formatFecha(fechaStr) {
      if (!fechaStr) return '';
      const fecha = toDateSafe(fechaStr);
      if (!fecha) return '';
      return fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: MX_TIMEZONE
      });
    },

    formatFechaSolo(fechaStr) {
      if (!fechaStr) return '';
      const fecha = toDateSafe(fechaStr);
      if (!fecha) return '';
      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: MX_TIMEZONE
      });
    },

    formatHora(fechaStr) {
      if (!fechaStr) return '';
      const fecha = toDateSafe(fechaStr);
      if (!fecha) return '';
      return fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: MX_TIMEZONE
      });
    },

    translateStatus(status) {
      const translations = {
        'Pendiente_Reparacion': 'New',
        'En_Reparacion': 'In Progress',
        'Reparado': 'Repaired',
        'Rechazado': 'Rejected',
        'Aprobado': 'Approved'
      };
      return translations[status] || status;
    },

    getStatusClass(status) {
      const classes = {
        'Pendiente_Reparacion': 'status-new',
        'En_Reparacion': 'status-pending',
        'Reparado': 'status-pending',
        'Rechazado': 'status-new',
        'Aprobado': 'status-new'
      };
      return classes[status] || 'status-new';
    },

    selectDefecto(defecto) {
      this.selectedDefecto = defecto;
      console.log('Defecto seleccionado:', defecto);
    },

    descargarExcel() {
      try {
        // Crear workbook y worksheet
        const wb = XLSX.utils.book_new();

        // Preparar datos para Excel
        const datos = this.defectosFiltrados.map(defecto => ({
          'Fecha': this.formatFechaSolo(defecto.fecha),
          'Hora': this.formatHora(defecto.fecha),
          'Línea': defecto.linea,
          'Código de Parte': defecto.codigo,
          'Modelo': defecto.modelo || 'N/A',
          'Defecto': defecto.defecto,
          'Ubicación': defecto.ubicacion,
          'Área': defecto.area,
          'Tipo Inspección': defecto.tipo_inspeccion || 'N/A',
          'Etapa Detección': defecto.etapa_deteccion || 'N/A',
          'Status': this.translateStatus(defecto.status),
          'Capturista': defecto.registrado_por || 'Sistema'
        }));

        // Crear worksheet
        const ws = XLSX.utils.json_to_sheet(datos);

        // Ajustar anchos de columna
        const colWidths = [
          { wch: 12 }, // Fecha
          { wch: 10 }, // Hora
          { wch: 10 }, // Línea
          { wch: 20 }, // Código
          { wch: 15 }, // Modelo
          { wch: 25 }, // Defecto
          { wch: 20 }, // Ubicación
          { wch: 15 }, // Área
          { wch: 15 }, // Tipo Inspección
          { wch: 15 }, // Etapa Detección
          { wch: 15 }, // Status
          { wch: 20 }  // Capturista
        ];
        ws['!cols'] = colWidths;

        // Agregar worksheet al workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Defectos');

        // Generar nombre de archivo con fecha
        const fecha = new Date().toISOString().slice(0, 10);
        const nombreArchivo = `Defectos_${fecha}.xlsx`;

        // Descargar archivo
        XLSX.writeFile(wb, nombreArchivo);

        this.mostrarMensaje('Éxito', `Archivo ${nombreArchivo} descargado correctamente`, 'exito');
      } catch (error) {
        console.error('Error al descargar Excel:', error);
        this.mostrarMensaje('Error', 'Error al generar archivo Excel', 'error');
      }
    },

    mostrarMensaje(titulo, mensaje, tipo = 'exito') {
      this.mensajeModal.titulo = titulo;
      this.mensajeModal.mensaje = mensaje;
      this.mensajeModal.tipo = tipo;

      const modalElement = document.getElementById('mensajeModal');
      const modal = new bootstrap.Modal(modalElement);
      modal.show();

      if (tipo === 'exito') {
        setTimeout(() => {
          modal.hide();
        }, 2000);
      }
    },

    // ===== SISTEMA DE ESCANEO QR =====
    async inicializarEscanerQR() {
      if (this.cameraInitializing) return;

      this.cameraInitializing = true;
      this.cameraStatus = 'Solicitando acceso a la cámara...';
      this.cameraReady = false;

      try {
        if (typeof Html5Qrcode === 'undefined') {
          throw new Error('Librería de escaneo no cargada');
        }

        this.cameraStatus = 'Detectando cámaras disponibles...';
        const cameras = await Html5Qrcode.getCameras();
        this.availableCameras = cameras;

        if (cameras && cameras.length > 0) {
          console.log(`✓ Encontradas ${cameras.length} cámaras`);

          const rearCamera = cameras.find(c =>
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment')
          );

          this.currentCameraId = rearCamera ? rearCamera.id : cameras[0].id;

          this.cameraReady = true;
          this.cameraInitializing = false;

          await this.$nextTick();
          await new Promise(resolve => setTimeout(resolve, 100));

          const elemento = document.getElementById('qr-reader');
          if (!elemento) {
            throw new Error('Elemento qr-reader no encontrado');
          }

          this.html5QrCode = new Html5Qrcode("qr-reader");
          await this.iniciarEscaneo();

          this.cameraStatus = '✓ Cámara activada';
        } else {
          this.cameraStatus = '❌ No se encontraron cámaras';
          this.cameraInitializing = false;
        }
      } catch (error) {
        console.error('Error al inicializar escáner:', error);
        this.cameraReady = false;
        this.cameraInitializing = false;
        this.cameraStatus = '❌ Error al acceder a la cámara';
      }
    },

    async iniciarEscaneo() {
      try {
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E
          ]
        };

        await this.html5QrCode.start(
          this.currentCameraId,
          config,
          (decodedText) => {
            this.onCodigoDetectado(decodedText);
          },
          () => {
            // Error de escaneo continuo (normal)
          }
        );

        // Capturar el videoTrack después de iniciar el stream
        await this.$nextTick();
        setTimeout(() => {
          try {
            const videoElement = document.querySelector('#qr-reader video');
            if (videoElement && videoElement.srcObject) {
              const stream = videoElement.srcObject;
              const tracks = stream.getVideoTracks();
              if (tracks.length > 0) {
                this.videoTrack = tracks[0];
                console.log('✓ VideoTrack capturado para zoom');
              }
            }
          } catch (err) {
            console.warn('No se pudo capturar videoTrack:', err);
          }
        }, 500);

      } catch (error) {
        console.error('Error al iniciar escaneo:', error);
        throw error;
      }
    },

    onCodigoDetectado(codigoText) {
      const ahora = Date.now();

      if (codigoText === this.lastScannedCode && (ahora - this.lastScanTime) < 3000) {
        return;
      }

      console.log('Código detectado:', codigoText);

      this.lastScannedCode = codigoText;
      this.lastScanTime = ahora;
      this.scannedCode = codigoText.toUpperCase().trim();

      // Aplicar automáticamente al campo código
      this.nuevoDefecto.codigo = this.scannedCode;

      // En móvil, abrir modal de captura automáticamente
      if (this.esMobile) {
        this.mostrarModalCapturaMobile = true;
      }

      // Limpiar después de 3 segundos
      setTimeout(() => {
        this.scannedCode = null;
      }, 3000);
    },

    // ===== FUNCIONES MÓVILES =====
    toggleSidebarMobile() {
      this.mostrarSidebarMobile = !this.mostrarSidebarMobile;
    },

    closeSidebarMobile() {
      this.mostrarSidebarMobile = false;
    },

    cerrarModalCapturaMobile() {
      this.mostrarModalCapturaMobile = false;
    },

    async switchCamera() {
      try {
        if (this.availableCameras.length <= 1) return;

        if (this.html5QrCode && this.html5QrCode.isScanning) {
          await this.html5QrCode.stop();
          this.videoTrack = null; // Limpiar track al cambiar cámara
        }

        const currentIndex = this.availableCameras.findIndex(c => c.id === this.currentCameraId);
        const nextIndex = (currentIndex + 1) % this.availableCameras.length;
        this.currentCameraId = this.availableCameras[nextIndex].id;

        await this.iniciarEscaneo();
      } catch (error) {
        console.error('Error al cambiar cámara:', error);
      }
    },

    // Métodos de zoom
    async applyZoom() {
      try {
        if (!this.videoTrack) {
          const videoElement = document.querySelector('#qr-reader video');
          if (videoElement && videoElement.srcObject) {
            const stream = videoElement.srcObject;
            this.videoTrack = stream.getVideoTracks()[0];
          }
        }

        if (this.videoTrack) {
          const capabilities = this.videoTrack.getCapabilities();
          if (capabilities.zoom) {
            await this.videoTrack.applyConstraints({
              advanced: [{ zoom: this.zoomLevel }]
            });
          }
        }
      } catch (error) {
        console.error('Error aplicando zoom:', error);
      }
    },

    increaseZoom() {
      if (this.zoomLevel < this.maxZoom) {
        this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + 0.5);
        this.applyZoom();
      }
    },

    decreaseZoom() {
      if (this.zoomLevel > this.minZoom) {
        this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - 0.5);
        this.applyZoom();
      }
    }
  }
}).mount('#app');
