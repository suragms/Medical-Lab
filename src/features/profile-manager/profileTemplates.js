// Profile Templates Helper
import { getProfileById } from '../shared/dataService';

export const getProfileTemplate = (profileId) => {
  return getProfileById(profileId);
};

export default {
  getProfileTemplate
};
