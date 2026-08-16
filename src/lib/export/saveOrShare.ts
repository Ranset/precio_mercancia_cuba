import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Guarda o comparte un archivo generado (PDF, XLSX, ...) de la forma que
 * corresponda según la plataforma:
 *
 * - Nativo (Android): lo escribe en la caché de la app y abre la hoja de
 *   compartir del sistema, para que el usuario lo guarde donde quiera
 *   (Archivos, Drive, WhatsApp, correo, etc.). Una descarga de navegador
 *   normal no funciona de forma confiable dentro de la WebView de Capacitor.
 * - Web: dispara una descarga de archivo normal del navegador.
 */
export async function saveOrShareFile(fileName: string, blob: Blob): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob);
    const written = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });
    await Share.share({
      title: fileName,
      files: [written.uri],
      dialogTitle: 'Compartir o guardar',
    });
    return;
  }

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    // Deja un momento para que el navegador tome la URL antes de revocarla.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('No se pudo leer el archivo generado.'));
        return;
      }
      // result viene como "data:<mime>;base64,AAAA..." — solo interesa la parte base64.
      const base64 = result.slice(result.indexOf(',') + 1);
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo generado.'));
    reader.readAsDataURL(blob);
  });
}

/** Convierte el nombre de un viaje en un nombre de archivo seguro para cualquier sistema operativo. */
export function safeFileBaseName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'viaje';
}
