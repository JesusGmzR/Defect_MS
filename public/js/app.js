const { createApp } = Vue;

const getLocalISODate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

createApp({
  data() {
    return {
      nuevoDefecto: {
        fecha: getLocalISODate(),
        linea: '',
        codigo: '',
        defecto: '',
        otroDefecto: '',
        ubicacion: '',
        area: '',
        modelo: ''
      },
      defectosHoy: [],
      lineas: ['M1', 'M2', 'M3', 'M4', 'DP1', 'DP2', 'DP3', 'Harness'],
      defectosComunes: [
        'Rayado', 'Golpe', 'Falta de pintura', 
        'Deformación', 'Suciedad', 'Mal ensamblaje'
      ],
      areas: ['SMD', 'IMD', 'Ensamble', 'Mantenimiento', 'Micom'],
      filtros: {
        fechaInicio: (() => {
          const date = new Date();
          date.setDate(date.getDate() - 7);
          date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
          return date.toISOString().slice(0, 10);
        })(),
        fechaFin: getLocalISODate(),
        materialId: '',
        defectReason: '',
        status: '',
        linea: '',
        codigo: '',
        defecto: '',
        ubicacion: '',
        area: ''
      },
      resultadosConsulta: [],
      estadisticas: {
        visible: false,
        total: 0,
        defectosComunes: {}
      },
      mensajeModal: {
        titulo: '',
        mensaje: '',
        tipo: 'exito'
      },
      // Nuevas propiedades para la interfaz moderna
      selectedDefect: null,
      selectedDefectInfo: null,
      // Propiedades para escaneo QR con html5-qrcode
      html5QrCode: null,
      availableCameras: [],
      currentCameraId: null,
      scannedCode: null,
      lastScannedCode: null,
      lastScanTime: 0,
      cameraReady: false,
      cameraInitializing: false,
      cameraStatus: 'Presiona el botón para activar la cámara y comenzar a escanear códigos QR y Barcode'
    }
  },
  mounted() {
    this.actualizarFecha();
    setInterval(this.actualizarFecha, 60000);
    this.cargarDefectosHoy();
    this.inicializarDatosMock();
    
    // NO auto-inicializar - esperar a que el usuario lo active manualmente
    console.log('Aplicación lista. Presiona "Activar Cámara" para comenzar a escanear.');
  },
  computed: {
    // Filtrar defectos en tiempo real
    defectosFiltrados() {
      let defectos = [...this.defectosHoy];
      
      // Aplicar filtros
      if (this.filtros.materialId) {
        defectos = defectos.filter(d => 
          d.materialId && d.materialId.toLowerCase().includes(this.filtros.materialId.toLowerCase())
        );
      }
      
      if (this.filtros.defectReason) {
        defectos = defectos.filter(d => 
          d.defecto === this.filtros.defectReason
        );
      }
      
      if (this.filtros.status) {
        defectos = defectos.filter(d => 
          d.status === this.filtros.status
        );
      }
      
      if (this.filtros.fechaInicio && this.filtros.fechaFin) {
        defectos = defectos.filter(d => {
          const fecha = new Date(d.fecha);
          const inicio = new Date(this.filtros.fechaInicio);
          const fin = new Date(this.filtros.fechaFin);
          return fecha >= inicio && fecha <= fin;
        });
      }
      
      return defectos;
    }
  },
  methods: {
    actualizarFecha() {
      const ahora = new Date();
      const elemento = document.getElementById('fecha-actual');
      if (elemento) {
        elemento.textContent = `Actualizado: ${ahora.toLocaleDateString()} ${ahora.toLocaleTimeString()}`;
      }
    },
    formatFecha(fechaStr) {
      if (!fechaStr) return '';
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-ES');
    },
    async buscarModelo() {
      try {
        if (!this.nuevoDefecto.codigo || this.nuevoDefecto.codigo.length < 9) {
          this.nuevoDefecto.modelo = '';
          return;
        }
        
        const response = await axios.get('/api/modelo', {
          params: { codigo: this.nuevoDefecto.codigo.substring(0, 9) }
        });
        
        this.nuevoDefecto.modelo = response.data.modelo || '';
      } catch (error) {
        console.error('Error al buscar modelo:', error);
        this.nuevoDefecto.modelo = '';
      }
    },
    async cargarDefectosHoy() {
      try {
        const hoy = new Date().toISOString().substr(0, 10);
        const response = await axios.get('/api/defectos', { params: { fecha: hoy } });
        this.defectosHoy = response.data;
      } catch (error) {
        this.mostrarMensaje('Error', 'No se pudieron cargar los defectos de hoy', 'error');
        console.error('Error al cargar defectos:', error);
      }
    },
    async guardarDefecto() {
      try {
        // Validar campos
        if (!this.validarCampos()) return;

        // Preparar datos
        const defectoData = {
          fecha: this.nuevoDefecto.fecha,
          linea: this.nuevoDefecto.linea,
          codigo: this.nuevoDefecto.codigo.trim(),
          defecto: this.nuevoDefecto.defecto === 'OTRO' 
            ? this.nuevoDefecto.otroDefecto.trim() 
            : this.nuevoDefecto.defecto,
          ubicacion: this.nuevoDefecto.ubicacion.trim(),
          area: this.nuevoDefecto.area,
          modelo: this.nuevoDefecto.modelo || await this.buscarModelo(this.nuevoDefecto.codigo)
        };

        // Enviar al servidor
        const response = await axios.post('/api/defectos', defectoData);
        
        if (response.data.success) {
          this.mostrarMensaje('Éxito', 'Defecto registrado correctamente', 'exito');
          this.cargarDefectosHoy();
          this.limpiarFormulario();
        }
      } catch (error) {
        this.mostrarError(error);
      }
    },
    validarCampos() {
      const camposRequeridos = [
        { campo: 'linea', mensaje: 'La línea es requerida' },
        { campo: 'codigo', mensaje: 'El código es requerido' },
        { campo: 'defecto', mensaje: 'El defecto es requerido' },
        { campo: 'ubicacion', mensaje: 'La ubicación es requerida' },
        { campo: 'area', mensaje: 'El área es requerida' }
      ];

      for (const { campo, mensaje } of camposRequeridos) {
        if (!this.nuevoDefecto[campo]) {
          this.mostrarMensaje('Validación', mensaje, 'error');
          return false;
        }
      }

      if (this.nuevoDefecto.defecto === 'OTRO' && !this.nuevoDefecto.otroDefecto.trim()) {
        this.mostrarMensaje('Validación', 'Debe especificar el defecto', 'error');
        return false;
      }

      return true;
    },
    limpiarFormulario() {
      this.nuevoDefecto.linea = '';
      this.nuevoDefecto.codigo = '';
      this.nuevoDefecto.defecto = '';
      this.nuevoDefecto.otroDefecto = '';
      this.nuevoDefecto.ubicacion = '';
      this.nuevoDefecto.area = '';
      this.nuevoDefecto.modelo = '';
      
      // Enfocar el primer campo
      document.getElementById('linea').focus();
    },
    async buscarDefectos() {
      try {
        // Validar fechas
        if (new Date(this.filtros.fechaInicio) > new Date(this.filtros.fechaFin)) {
          this.mostrarMensaje('Validación', 'La fecha de inicio no puede ser mayor a la fecha fin', 'error');
          return;
        }

        // Realizar búsqueda
        const response = await axios.get('/api/defectos', { params: this.filtros });
        this.resultadosConsulta = response.data;
        
        // Calcular estadísticas
        this.calcularEstadisticas(response.data);
      } catch (error) {
        this.mostrarError(error);
      }
    },
    calcularEstadisticas(defectos) {
      this.estadisticas.total = defectos.length;
      
      // Contar defectos comunes
      const conteoDefectos = {};
      defectos.forEach(d => {
        conteoDefectos[d.defecto] = (conteoDefectos[d.defecto] || 0) + 1;
      });
      
      // Ordenar y tomar los 3 más comunes
      const defectosOrdenados = Object.entries(conteoDefectos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .reduce((obj, [key, val]) => {
          obj[key] = val;
          return obj;
        }, {});
      
      this.estadisticas.defectosComunes = defectosOrdenados;
      this.estadisticas.visible = defectos.length > 0;
    },
    exportarExcel() {
      if (this.resultadosConsulta.length === 0) {
        this.mostrarMensaje('Advertencia', 'No hay datos para exportar', 'error');
        return;
      }
      
      // Crear CSV
      let csv = 'Fecha,Línea,Código,Defecto,Ubicación,Área,Modelo\n';
      this.resultadosConsulta.forEach(d => {
        csv += `${this.formatFecha(d.fecha)},${d.linea},${d.codigo},"${d.defecto.replace(/"/g, '""')}",${d.ubicacion},${d.area},${d.modelo}\n`;
      });
      
      // Descargar archivo
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `defectos_${new Date().toISOString().substr(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    mostrarError(error) {
      let mensaje = 'Error al procesar la solicitud';
      if (error.response) {
        mensaje = error.response.data.error || 
                 error.response.data.message || 
                 `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        mensaje = 'No se recibió respuesta del servidor';
      } else {
        mensaje = error.message;
      }
      
      this.mostrarMensaje('Error', mensaje, 'error');
      console.error('Error completo:', error);
    },

    // Métodos para la nueva interfaz
    inicializarDatosMock() {
      // Generar datos de muestra basados en los defectos existentes
      this.defectosHoy = [
        {
          id: 'BASH...',
          materialId: '12345',
          fecha: '2023-05-15 15:20:13',
          defecto: 'Reason 2',
          status: 'New',
          ubicacion: 'Lili\'s Station',
          cantidad: 3,
          reportedBy: 'Lili Tordai (Tulip)'
        },
        {
          id: 'pTtwj9...',
          materialId: '17658',
          fecha: '2023-05-08 13:45:22',
          defecto: 'Reason 1',
          status: 'Updated',
          ubicacion: 'Station A',
          cantidad: 1,
          reportedBy: 'Sistema Web'
        },
        {
          id: '62yyF...',
          materialId: '98691',
          fecha: '2023-05-08 13:30:15',
          defecto: 'Reason 3',
          status: 'Closed',
          ubicacion: 'Station B',
          cantidad: 2,
          reportedBy: 'Usuario QC'
        },
        {
          id: 'ymJdt...',
          materialId: '46376',
          fecha: '2023-05-15 10:15:45',
          defecto: 'Reason 2',
          status: 'New',
          ubicacion: 'Lili\'s Station',
          cantidad: 1,
          reportedBy: 'Lili Tordai (Tulip)'
        }
      ];
    },

    selectDefect(index, defecto) {
      this.selectedDefect = index;
      this.selectedDefectInfo = defecto;
    },

    // === SISTEMA DE ESCANEO QR ROBUSTO CON HTML5-QRCODE ===
    async inicializarEscanerQR() {
      // Evitar múltiples inicializaciones
      if (this.cameraInitializing) {
        console.log('Ya se está inicializando la cámara...');
        return;
      }

      this.cameraInitializing = true;
      this.cameraStatus = 'Solicitando acceso a la cámara...';
      this.cameraReady = false;

      try {
        // Verificar que la librería esté cargada
        if (typeof Html5Qrcode === 'undefined') {
          this.cameraStatus = 'Cargando librería de escaneo...';
          console.error('html5-qrcode no está cargado, reintentando...');
          this.cameraInitializing = false;
          setTimeout(() => this.inicializarEscanerQR(), 1000);
          return;
        }

        console.log('Inicializando escáner QR...');
        this.cameraStatus = 'Detectando cámaras disponibles...';
        
        // Primero obtener cámaras disponibles SIN crear la instancia
        const cameras = await Html5Qrcode.getCameras();
        this.availableCameras = cameras;
        
        if (cameras && cameras.length > 0) {
          console.log(`✓ Encontradas ${cameras.length} cámaras:`, cameras.map(c => c.label));
          this.cameraStatus = `Activando cámara (${cameras.length} disponible${cameras.length > 1 ? 's' : ''})...`;
          
          // Preferir cámara trasera (environment)
          const rearCamera = cameras.find(c => 
            c.label.toLowerCase().includes('back') || 
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment')
          );
          
          this.currentCameraId = rearCamera ? rearCamera.id : cameras[0].id;
          console.log('Usando cámara:', rearCamera ? rearCamera.label : cameras[0].label);
          
          // Marcar como listo para que el DOM se renderice con el div#qr-reader
          this.cameraReady = true;
          this.cameraInitializing = false;
          
          // Esperar a que Vue actualice el DOM y el elemento exista
          await this.$nextTick();
          
          // Pequeña espera adicional para asegurar que el DOM esté completamente renderizado
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verificar que el elemento existe
          const elemento = document.getElementById('qr-reader');
          if (!elemento) {
            throw new Error('El elemento qr-reader no se encontró en el DOM');
          }
          
          // AHORA sí crear la instancia del escáner
          this.html5QrCode = new Html5Qrcode("qr-reader");
          
          // Iniciar escaneo
          await this.iniciarEscaneo();
          
          this.cameraStatus = '✓ Cámara activada - Apunta al código (QR o Barcode)';
          console.log('✓ Sistema de escaneo listo (QR + Barcode)');
        } else {
          this.cameraStatus = '❌ No se encontraron cámaras en el dispositivo';
          console.error('No se encontraron cámaras');
          this.mostrarMensaje('Error', 'No se detectaron cámaras en el dispositivo', 'error');
          this.cameraInitializing = false;
        }
      } catch (error) {
        console.error('❌ Error al inicializar escáner:', error);
        
        // Resetear estados
        this.cameraReady = false;
        this.cameraInitializing = false;
        
        let mensajeError = 'Error al acceder a la cámara';
        
        if (error.name === 'NotAllowedError' || error.message.includes('Permission')) {
          mensajeError = '❌ Permisos de cámara denegados. Por favor, permite el acceso a la cámara en tu navegador.';
        } else if (error.name === 'NotFoundError') {
          mensajeError = '❌ No se encontró ninguna cámara en el dispositivo.';
        } else if (error.name === 'NotReadableError') {
          mensajeError = '❌ La cámara está siendo usada por otra aplicación.';
        } else if (error.message) {
          mensajeError = `❌ Error: ${error.message}`;
        }
        
        this.cameraStatus = mensajeError;
        this.mostrarMensaje('Error', mensajeError, 'error');
      }
    },

    async iniciarEscaneo() {
      try {
        const config = {
          fps: 10, // Cuadros por segundo
          qrbox: { width: 250, height: 250 }, // Área de escaneo
          aspectRatio: 1.0, // Relación de aspecto
          // Habilitar múltiples formatos: QR y códigos de barras
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR
          ]
        };

        await this.html5QrCode.start(
          this.currentCameraId,
          config,
          (decodedText, decodedResult) => {
            // Callback cuando se detecta un código (QR o Barcode)
            console.log('Tipo de código detectado:', decodedResult.result.format.formatName);
            this.onCodigoDetectado(decodedText, decodedResult.result.format.formatName);
          },
          (errorMessage) => {
            // Error de escaneo (normal, se ejecuta constantemente)
            // No hacer nada, es parte del funcionamiento normal
          }
        );

        console.log('✓ Escaneo iniciado (QR + Barcodes)');
      } catch (error) {
        console.error('❌ Error al iniciar escaneo:', error);
        throw error; // Propagar el error para que lo maneje inicializarEscanerQR
      }
    },

    onCodigoDetectado(codigoText, formatName) {
      const ahora = Date.now();
      
      // Evitar múltiples lecturas del mismo código
      if (codigoText === this.lastScannedCode && (ahora - this.lastScanTime) < 3000) {
        return;
      }

      console.log(`✓ ${formatName} detectado:`, codigoText);
      
      this.lastScannedCode = codigoText;
      this.lastScanTime = ahora;
      this.scannedCode = codigoText.toUpperCase().trim();
      
      // Aplicar automáticamente el Material ID
      this.useMaterialIdAutomatically(this.scannedCode);
      
      // Limpiar después de 3 segundos
      setTimeout(() => {
        this.scannedCode = null;
      }, 3000);
    },

    // Mantener compatibilidad con nombre anterior
    onQRDetectado(qrText) {
      this.onCodigoDetectado(qrText, 'QR_CODE');
    },

    async switchCamera() {
      try {
        if (this.availableCameras.length <= 1) {
          console.log('Solo hay una cámara disponible');
          return;
        }
        
        console.log('Cambiando cámara...');
        this.cameraStatus = 'Cambiando cámara...';
        
        // Detener escaneo actual
        if (this.html5QrCode && this.html5QrCode.isScanning) {
          await this.html5QrCode.stop();
        }
        
        // Cambiar a la siguiente cámara
        const currentIndex = this.availableCameras.findIndex(c => c.id === this.currentCameraId);
        const nextIndex = (currentIndex + 1) % this.availableCameras.length;
        this.currentCameraId = this.availableCameras[nextIndex].id;
        
        console.log('Nueva cámara:', this.availableCameras[nextIndex].label);
        
        // Reiniciar escaneo con nueva cámara
        await this.iniciarEscaneo();
        
        this.cameraStatus = '✓ Cámara cambiada - Apunta al código (QR o Barcode)';
        console.log('✓ Cámara cambiada');
      } catch (error) {
        console.error('❌ Error al cambiar cámara:', error);
        this.cameraStatus = '❌ Error al cambiar cámara';
        this.mostrarMensaje('Error', 'Error al cambiar cámara', 'error');
      }
    },

    // Usar automáticamente el Material ID sin necesidad de confirmación
    useMaterialIdAutomatically(materialId) {
      // Actualizar el filtro de Material ID
      this.filtros.materialId = materialId;
      
      // Buscar defecto con ese Material ID
      const defectoEncontrado = this.defectosFiltrados.find(d => 
        d.materialId === materialId
      );

      if (defectoEncontrado) {
        // Seleccionar automáticamente el defecto encontrado
        const index = this.defectosFiltrados.indexOf(defectoEncontrado);
        this.selectDefect(index, defectoEncontrado);
        console.log('✓ Defecto encontrado y seleccionado automáticamente:', materialId);
      } else {
        // Crear un nuevo registro de defecto con el Material ID escaneado
        this.crearNuevoDefectoConMaterialId(materialId);
      }
    },

    crearNuevoDefectoConMaterialId(materialId) {
      // Crear un nuevo defecto temporal
      const nuevoDefecto = {
        id: `SCAN_${Date.now()}`,
        materialId: materialId,
        fecha: new Date().toISOString(),
        defecto: 'New Scan',
        status: 'New',
        ubicacion: 'Detected by Scanner',
        cantidad: 1,
        reportedBy: 'Sistema de Escaneo QR'
      };

      // Agregar a la lista y seleccionar
      this.defectosHoy.unshift(nuevoDefecto);
      
      // Seleccionar el nuevo defecto (será el primero en la lista filtrada)
      setTimeout(() => {
        this.selectDefect(0, nuevoDefecto);
      }, 100);
      
      console.log('✓ Nuevo defecto creado:', materialId);
    },

    // Botones de acción
    logDefect() {
      if (!this.selectedDefectInfo) {
        this.mostrarMensaje('Advertencia', 'Seleccione un defecto primero', 'error');
        return;
      }
      
      // Aquí se implementaría la lógica para registrar el defecto
      this.mostrarMensaje('Éxito', `Defecto ${this.selectedDefectInfo.id} registrado correctamente`, 'exito');
    },

    viewManage() {
      // Aquí se implementaría la navegación a la vista de gestión
      this.mostrarMensaje('Info', 'Abriendo vista de gestión...', 'exito');
    }
  }
}).mount('#app');