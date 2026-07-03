import tokenService from '../services/token/token.service.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token === 'undefined' || token === 'null') return res.status(401).json({ message: 'Access token missing' });

  try {
    const verifiedUser = tokenService.verifyAccessToken(token);
    if (!verifiedUser) {
      return res.status(401).json({ message: 'Invalid or expired access token' });
    }
    req.user = verifiedUser;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired access token' });
  }
};