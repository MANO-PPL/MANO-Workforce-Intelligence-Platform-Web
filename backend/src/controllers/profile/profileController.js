import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';
import * as profileService from '../../services/profile/profileService.js';

/**
 * POST /profile - Upload profile picture
 */
export const uploadProfilePicture = catchAsync(async (req, res) => {
    const { user_id } = req.user;
    const file = req.file;

    if (!file) {
        throw new AppError('No image file provided', 400);
    }

    const profile_image_url = await profileService.uploadProfilePicture(user_id, file.buffer);

    res.json({
        ok: true,
        message: 'Profile picture updated successfully',
        profile_image_url
    });
});

/**
 * DELETE /profile - Remove profile picture
 */
export const deleteProfilePicture = catchAsync(async (req, res) => {
    const { user_id } = req.user;

    const deleted = await profileService.deleteProfilePicture(user_id);

    if (!deleted) {
        throw new AppError('User not found', 404);
    }

    res.json({
        ok: true,
        message: 'Profile picture removed successfully'
    });
});

/**
 * GET /profile/me - Get current user profile
 */
export const getMyProfile = catchAsync(async (req, res) => {
    const { user_id } = req.user;

    const user = await profileService.getMyProfile(user_id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.json({
        ok: true,
        user: {
            ...user,
            profile_image_url: user.profile_image_url
        }
    });
});

/**
 * GET /profile/preferences - Get column preferences
 */
export const getColumnPreferences = catchAsync(async (req, res) => {
    const { user_id } = req.user;
    const preferences = await profileService.getColumnPreferences(user_id);
    res.json({
        ok: true,
        preferences
    });
});

/**
 * PUT /profile/preferences - Update column preferences
 */
export const updateColumnPreferences = catchAsync(async (req, res) => {
    const { user_id } = req.user;
    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
        throw new AppError('Invalid preferences data', 400);
    }
    
    const updated = await profileService.updateColumnPreferences(user_id, preferences);
    res.json({
        ok: true,
        message: 'Column preferences updated successfully',
        preferences: updated
    });
});
