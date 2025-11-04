const { createApp } = Vue;

createApp({
  data() {
    return {
      nuevoDefecto: {
        fecha: new Date().toISOString().substr(0, 10),
        linea: '',
        codigo: '',
        defecto: '',
        ubicacion: '',
        area: '',
        tipo_inspeccion: 'Visual',
        etapa_deteccion: 'OQC',
        modelo: ''
      },
      defectosHoy: [],
      lineas: ['M1', 'M2', 'M3', 'M4', 'DP1', 'DP2', 'DP3', 'Harness'],
      areas: ['SMD', 'IMD', 'Ensamble', 'Mantenimiento', 'Micom'],
      defectosComunes: [
        'Rayado', 
        'Golpe', 
        'Falta de pintura', 
        'Deformación', 
        'Suciedad', 
        'Mal ensamblaje',
        'Componente faltante',
        'Soldadura defectuosa'
      ],
      filtros: {
        materialId: '',
        defectReason: '',
        status: '',
        fechaInicio: new Date().toISOString().substr(0, 10),
        fechaFin: new Date().toISOString().substr(0, 10)
      },
      mensajeModal: {
        titulo: '',
        mensaje: '',
        tipo: 'exito'
      },
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
      selectedDefecto: null
    }
  },
  mounted() {
    this.cargarDefectos();
    
    // Atajo de teclado F1 para capturar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        this.capturarDefecto();
      }
    });
    
    // Cargar defectos cada 30 segundos
    setInterval(() => {
      this.cargarDefectos();
    }, 30000);
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
      
      if (this.filtros.status) {
        defectos = defectos.filter(d => 
          d.status === this.filtros.status
        );
        console.log('🔧 Después filtro status:', defectos.length);
      }
      
      // NO aplicar filtro de fecha aquí porque ya se aplica en el servidor
      
      console.log('✅ Total defectos filtrados:', defectos.length);
      return defectos;
    }
  },
  methods: {
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
    
    async capturarDefecto() {
      try {
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

        // Preparar datos
        const defectoData = {
          linea: this.nuevoDefecto.linea,
          codigo: this.nuevoDefecto.codigo.trim().toUpperCase(),
          defecto: this.nuevoDefecto.defecto.trim(),
          ubicacion: this.nuevoDefecto.ubicacion.trim(),
          area: this.nuevoDefecto.area,
          modelo: this.nuevoDefecto.modelo || '',
          tipo_inspeccion: this.nuevoDefecto.tipo_inspeccion,
          etapa_deteccion: this.nuevoDefecto.etapa_deteccion,
          registrado_por: 'Sistema Web OQC'
        };

        // Enviar al servidor
        const response = await axios.post('/api/defectos', defectoData);
        
        if (response.data.success) {
          this.mostrarMensaje('Éxito', 'Defecto capturado correctamente', 'exito');
          this.limpiarFormulario();
          this.cargarDefectos();
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
      this.scannedCode = null;
    },
    
    formatFecha(fechaStr) {
      if (!fechaStr) return '';
      const fecha = new Date(fechaStr);
      return fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    formatFechaSolo(fechaStr) {
      if (!fechaStr) return '';
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    },
    
    formatHora(fechaStr) {
      if (!fechaStr) return '';
      const fecha = new Date(fechaStr);
      return fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
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
    
    mostrarMensaje(titulo, mensaje, tipo = 'exito') {
      this.mensajeModal.titulo = titulo;
      this.mensajeModal.mensaje = mensaje;
      this.mensajeModal.tipo = tipo;
      
      const modal = new bootstrap.Modal(document.getElementById('mensajeModal'));
      modal.show();
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
      
      // Limpiar después de 3 segundos
      setTimeout(() => {
        this.scannedCode = null;
      }, 3000);
    },
    
    async switchCamera() {
      try {
        if (this.availableCameras.length <= 1) return;
        
        if (this.html5QrCode && this.html5QrCode.isScanning) {
          await this.html5QrCode.stop();
        }
        
        const currentIndex = this.availableCameras.findIndex(c => c.id === this.currentCameraId);
        const nextIndex = (currentIndex + 1) % this.availableCameras.length;
        this.currentCameraId = this.availableCameras[nextIndex].id;
        
        await this.iniciarEscaneo();
      } catch (error) {
        console.error('Error al cambiar cámara:', error);
      }
    }
  }
}).mount('#app');
