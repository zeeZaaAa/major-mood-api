export const ROLE_PERMISSIONS = {
  admin: ['users:read', 'users:write', 'posts:read', 'posts:write', 'posts:ban'],
  user: ['posts:read', 'posts:write'],
  bannedUser: ['posts:read'],
};