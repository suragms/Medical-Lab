/**
 * Asset Path Helper
 * Handles proper asset paths for both development and production (Netlify)
 */

// PERFORMANCE: Cache base64 images to avoid re-encoding
const imageCache = new Map();

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
 * PERFORMANCE OPTIMIZED: Uses cache to avoid re-encoding same images
 * This works in both dev and production (Netlify)
 */
export const imageToBase64 = async (imagePath) => {
  // Check cache first (MASSIVE PERFORMANCE BOOST!)
  if (imageCache.has(imagePath)) {
    console.log('⚡ Using cached image:', imagePath);
    return imageCache.get(imagePath);
  }
  
  console.log('🔄 Encoding image to base64:', imagePath);
  
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
        
        // CACHE IT!
        imageCache.set(imagePath, dataURL);
        console.log('✅ Image cached:', imagePath);
        
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
  rakhi: getImagePath('images/signatures/rakhi-signature.png'),
  aparna: getImagePath('images/signatures/aparna-signature.png')
};

/**
 * Preload critical images
 * Call this on app initialization to cache images for FAST PDF generation
 * PERFORMANCE: Pre-caches all images so PDFs generate INSTANTLY!
 */
export const preloadCriticalImages = async () => {
  console.log('🚀 Preloading critical images for fast PDF generation...');
  
  const imagesToPreload = [
    LOGO_PATHS.healit,
    LOGO_PATHS.partner,
    SIGNATURE_PATHS.rakhi,
    SIGNATURE_PATHS.aparna
  ];

  const promises = imagesToPreload.map(src => 
    imageToBase64(src).catch(err => {
      console.warn(`⚠️ Failed to preload ${src}:`, err);
      return null;
    })
  );
  
  await Promise.all(promises);
  console.log('✅ All critical images preloaded and cached!');
};

export default {
  getImagePath,
  imageToBase64,
  LOGO_PATHS,
  SIGNATURE_PATHS,
  preloadCriticalImages
};
