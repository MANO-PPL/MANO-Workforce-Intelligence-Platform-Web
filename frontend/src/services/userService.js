import api from './api';

/**
 * Get all users eligible for geofence assignment
 */
export const fetchWorkLocationUsers = async () => {
  try {
    const res = await api.get('/admin/users?workLocation=true');
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch users");
  }
};

/* ============================
   LOCATIONS (GEOFENCE)
   ============================ */

/**
 * Get all active work locations
 */
export const fetchLocations = async () => {
  try {
    const res = await api.get('/locations');
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch locations");
  }
};

/**
 * Create new geofence location
 */
export const createLocation = async (payload) => {
  try {
    const res = await api.post('/locations', payload);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to create location");
  }
};

/**
 * Update geofence location
 */
export const updateLocation = async (locationId, payload) => {
  try {
    const res = await api.put(`/locations/${locationId}`, payload);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update location");
  }
};

/**
 * Assign / Remove users from locations (bulk)
 */
export const updateLocationAssignments = async (assignments) => {
  try {
    const res = await api.post('/locations/assignments', { assignments });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update assignments");
  }
};

/**
 * Get user column preferences
 */
export const getColumnPreferences = async () => {
  try {
    const res = await api.get('/profile/preferences');
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch column preferences");
  }
};

/**
 * Update user column preferences
 */
export const updateColumnPreferences = async (preferences) => {
  try {
    const res = await api.put('/profile/preferences', { preferences });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update column preferences");
  }
};
