/**
 * Asset Path Helper
 * Handles proper asset paths for both development and production (Netlify)
 */

/**
 * Get proper image path
 * In dev: /images/...
 * In prod: /images/... (public folder is copied to dist root)
 */
export const getImagePath = (imagePath) => {
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  
  // Return with leading slash for proper absolute path
  return `/${cleanPath}`;
};

/**
 * Convert image to base64 data URL for PDF generation
 * This works in both dev and production (Netlify)
 */
export const imageToBase64 = async (imagePath) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      console.error('Failed to load image:', imagePath);
      reject(error);
    };
    
    img.src = imagePath;
  });
};

/**
 * Get logo paths
 */
export const LOGO_PATHS = {
  healit: getImagePath('images/healit-logo.png'),
  partner: getImagePath('images/thyrocare-logo.jpg'),
  icon: getImagePath('icon.svg')
};

/**
 * Get signature paths
 */
export const SIGNATURE_PATHS = {
  rakhi: getImagePath('images/rakhi-signature.jpg'),
  aparna: getImagePath('images/signatures/aparna-signature.png') // if exists
};

/**
 * Preload critical images
 * Call this on app initialization to cache images
 */
export const preloadCriticalImages = () => {
  const imagesToPreload = [
    LOGO_PATHS.healit,
    LOGO_PATHS.partner,
    SIGNATURE_PATHS.rakhi
  ];

  imagesToPreload.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};

export default {
  getImagePath,
  imageToBase64,
  LOGO_PATHS,
  SIGNATURE_PATHS,
  preloadCriticalImages
};
