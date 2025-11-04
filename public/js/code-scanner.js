// Utilidad para escaneo automático de códigos QR y códigos de barras
class CodeScanner {
  constructor() {
    this.qrScanner = null;
    this.quaggaInitialized = false;
    this.isScanning = false;
    this.onCodeDetected = null;
    this.scanInterval = null;
    this.lastDetectedCode = null;
    this.lastDetectionTime = 0;
    this.cooldownTime = 2000; // 2 segundos entre detecciones del mismo código
  }

  // Inicializar escaneo automático de códigos QR
  async initQRScanner(videoElement, onCodeFound) {
    try {
      this.stopAllScanners();
      this.onCodeDetected = onCodeFound;

      // Verificar si QrScanner está disponible
      if (typeof QrScanner === 'undefined') {
        console.error('QrScanner no está disponible');
        throw new Error('Librería QrScanner no cargada');
      }

      // Configurar QrScanner con escaneo continuo y configuración optimizada
      this.qrScanner = new QrScanner(
        videoElement,
        (result) => {
          try {
            const code = result.data || result;
            console.log('QR Code detectado:', code);
            this.handleCodeDetection('QR', code);
          } catch (error) {
            console.error('Error al procesar QR detectado:', error);
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: false,
          highlightCodeOutline: false,
          preferredCamera: 'environment',
          // Configuración optimizada para mejor detección
          maxScansPerSecond: 5,
          calculateScanRegion: (video) => {
            // Optimizar región de escaneo
            const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
            const scanRegionSize = Math.round(0.75 * smallestDimension);
            return {
              x: Math.round((video.videoWidth - scanRegionSize) / 2),
              y: Math.round((video.videoHeight - scanRegionSize) / 2),
              width: scanRegionSize,
              height: scanRegionSize,
            };
          }
        }
      );

      // Iniciar escaneo continuo
      await this.qrScanner.start();
      this.isScanning = true;
      console.log('Scanner QR iniciado correctamente - modo continuo optimizado');
      return true;
    } catch (error) {
      console.error('Error al iniciar scanner QR:', error);
      throw error;
    }
  }

  // Inicializar escaneo automático de códigos de barras
  async initBarcodeScanner(videoElement, onCodeFound) {
    try {
      this.stopAllScanners();
      this.onCodeDetected = onCodeFound;

      // Verificar si Quagga está disponible
      if (typeof Quagga === 'undefined') {
        console.error('Quagga no está disponible');
        return false;
      }

      return new Promise((resolve, reject) => {
        // Configuración optimizada de Quagga
        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoElement,
            constraints: {
              width: { min: 480, ideal: 800 },
              height: { min: 320, ideal: 600 },
              facingMode: "environment"
            }
          },
          locator: {
            patchSize: "medium",
            halfSample: true
          },
          numOfWorkers: navigator.hardwareConcurrency || 2,
          frequency: 15, // Aumentar frecuencia de escaneo
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader",
              "ean_8_reader", 
              "code_39_reader",
              "upc_reader",
              "upc_e_reader",
              "i2of5_reader"
            ],
            debug: {
              drawBoundingBox: false,
              showFrequency: false,
              drawScanline: false,
              showPattern: false
            }
          },
          locate: true
        }, (err) => {
          if (err) {
            console.error('Error al inicializar Quagga:', err);
            reject(err);
            return;
          }

          try {
            Quagga.start();
            this.quaggaInitialized = true;
            this.isScanning = true;
            
            // Configurar detector de códigos con filtrado
            Quagga.onDetected((data) => {
              if (data && data.codeResult && data.codeResult.code) {
                const code = data.codeResult.code;
                console.log('Código de barras detectado:', code);
                this.handleCodeDetection('Barcode', code);
              }
            });

            console.log('Scanner de códigos de barras iniciado - modo continuo');
            resolve(true);
          } catch (startError) {
            console.error('Error al iniciar Quagga:', startError);
            reject(startError);
          }
        });
      });
    } catch (error) {
      console.error('Error al iniciar scanner de códigos de barras:', error);
      return false;
    }
  }

  // Manejar detección de código con filtrado de duplicados
  handleCodeDetection(type, code) {
    if (!this.onCodeDetected || typeof this.onCodeDetected !== 'function') {
      return;
    }

    // Validar que el código no esté vacío y tenga un formato razonable
    if (!code || !code.trim() || code.trim().length < 3) {
      return;
    }

    const cleanCode = code.trim();
    const currentTime = Date.now();

    // Evitar múltiples detecciones del mismo código en poco tiempo
    if (this.lastDetectedCode === cleanCode && 
        (currentTime - this.lastDetectionTime) < this.cooldownTime) {
      return;
    }

    // Validar formato básico del código
    if (!this.validateCodeFormat(cleanCode)) {
      console.log('Código con formato inválido:', cleanCode);
      return;
    }

    this.lastDetectedCode = cleanCode;
    this.lastDetectionTime = currentTime;

    console.log(`${type} válido detectado:`, cleanCode);
    
    // Llamar al callback
    this.onCodeDetected({
      type: type,
      code: cleanCode,
      timestamp: new Date().toISOString()
    });
  }

  // Validar formato básico del código
  validateCodeFormat(code) {
    // Aceptar códigos que parecen Material IDs reales
    // Ejemplo: EBR874637, MAT12345, PART-ABC123, etc.
    
    // Rechazar códigos extremadamente largos (probables falsos positivos)
    if (code.length > 100) {
      return false;
    }
    
    // Rechazar códigos muy cortos
    if (code.length < 3) {
      return false;
    }
    
    // Aceptar códigos alfanuméricos con caracteres comunes
    if (/^[A-Za-z0-9\-_\.\/ ]{3,100}$/.test(code)) {
      return true;
    }
    
    return false;
  }

  // Detener escaneo de QR
  stopQRScanner() {
    try {
      if (this.qrScanner) {
        this.qrScanner.stop();
        this.qrScanner.destroy();
        this.qrScanner = null;
      }
    } catch (error) {
      console.error('Error al detener QR scanner:', error);
    }
    this.isScanning = false;
  }

  // Detener escaneo de códigos de barras  
  stopBarcodeScanner() {
    try {
      if (this.quaggaInitialized && typeof Quagga !== 'undefined') {
        Quagga.offDetected();
        Quagga.stop();
        this.quaggaInitialized = false;
      }
    } catch (error) {
      console.error('Error al detener Barcode scanner:', error);
    }
    this.isScanning = false;
  }

  // Detener todos los scanners
  stopAllScanners() {
    this.stopQRScanner();
    this.stopBarcodeScanner();
    
    // Limpiar intervalos si existen
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    
    this.isScanning = false;
    this.lastDetectedCode = null;
    this.lastDetectionTime = 0;
  }

  // Verificar si está escaneando
  getStatus() {
    return {
      isScanning: this.isScanning,
      qrActive: !!this.qrScanner,
      barcodeActive: this.quaggaInitialized
    };
  }

  // Validar formato de Material ID
  static validateMaterialId(code) {
    // Agregar validaciones específicas según los formatos esperados
    if (!code || code.length < 3) return false;
    
    // Ejemplos de validaciones (ajustar según necesidades):
    // - Códigos alfanuméricos
    // - Longitud mínima/máxima
    // - Patrones específicos
    
    return /^[A-Za-z0-9\-_]+$/.test(code);
  }

  // Formatear código detectado
  static formatMaterialId(code) {
    return code.toUpperCase().trim();
  }
}

// Exportar para uso global
window.CodeScanner = CodeScanner;