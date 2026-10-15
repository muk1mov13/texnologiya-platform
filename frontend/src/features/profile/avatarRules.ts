/** Backend `PUT /api/me/avatar` cheklovlari bilan bir xil (`ALLOWED_IMAGE_EXT`, `MAX_AVATAR_MB`). */
export const AVATAR_TYPES: ReadonlySet<string> = new Set(['image/jpeg', 'image/png', 'image/webp'])
export const AVATAR_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
