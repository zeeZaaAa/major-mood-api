import { ROLE_PERMISSIONS } from "../constants/role-permission.js";

export const authorize = (requiredPermission) => {
  return (req, res, next) => {
    const userRole = req.user?.role; 

    if (!userRole || !ROLE_PERMISSIONS[userRole]) {
      return res.status(403).json({ message: 'Forbidden: Access Denied' });
    }

    const userPermissions = ROLE_PERMISSIONS[userRole];

    if (!userPermissions.includes(requiredPermission)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient Permissions' });
    }

    next();
  };
};