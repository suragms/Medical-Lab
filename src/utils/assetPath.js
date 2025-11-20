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
 * Get logo paths
 */
export const LOGO_PATHS = {
  healit: getImagePath('images/@heal original editable file (png).png'),
  partner: getImagePath('images/download.jpeg.jpg'),
  icon: getImagePath('icon.svg')
};

/**
 * Get signature paths
 */
export const SIGNATURE_PATHS = {
  rakhi: getImagePath('images/RakiSign.jpg'),
  aparna: getImagePath('images/signatures/aparna.png') // if exists
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
  LOGO_PATHS,
  SIGNATURE_PATHS,
  preloadCriticalImages
};
