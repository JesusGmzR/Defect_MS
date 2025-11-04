// Utilidades para manejo de cámara
class CameraUtils {
  static async requestCameraPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Cerrar inmediatamente para solo verificar permisos
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Error al solicitar permisos de cámara:', error);
      return false;
    }
  }

  static async getAvailableCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error al obtener cámaras:', error);
      return [];
    }
  }

  static getOptimalConstraints(deviceId = null) {
    const constraints = {
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 60 }
      }
    };

    if (deviceId) {
      constraints.video.deviceId = { exact: deviceId };
    }

    // Detectar si es móvil para ajustar configuración
    if (this.isMobile()) {
      constraints.video.facingMode = { ideal: 'environment' }; // Cámara trasera por defecto
    }

    return constraints;
  }

  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static async captureImageFromVideo(video, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        resolve({
          blob,
          dataUrl: canvas.toDataURL('image/jpeg', quality),
          width: canvas.width,
          height: canvas.height,
          timestamp: new Date().toISOString()
        });
      }, 'image/jpeg', quality);
    });
  }

  static downloadImage(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Exportar para uso en el módulo principal
window.CameraUtils = CameraUtils;