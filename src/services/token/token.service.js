import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshToken from '../../schemas/token/refresh-token.schema.js';


class TokenService {
  generateAccessToken(user) {
    return jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );
  }

  async generateRefreshToken(user, userAgent, ip) {
    const plainRefreshToken = crypto.randomBytes(40).toString('hex');
    const hashedToken = RefreshToken.hashToken(plainRefreshToken);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const existingSession = await RefreshToken.findOne({
      userId: user._id,
      userAgent: userAgent
    });

    if (existingSession) {
      existingSession.tokenHash = hashedToken;
      existingSession.ipAddress = ip;
      existingSession.expiresAt = expiryDate;

      await existingSession.save();
    } else {
      const activeSessions = await RefreshToken.find({ userId: user._id })
        .sort({ expiresAt: 1 });

      if (activeSessions.length >= 3) {
        const oldestSession = activeSessions[0];
        await RefreshToken.findByIdAndDelete(oldestSession._id);
      }

      await RefreshToken.create({
        userId: user._id,
        tokenHash: hashedToken,
        expiresAt: expiryDate,
        userAgent: userAgent,
        ipAddress: ip
      });
    }

    return plainRefreshToken;
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      return null;
    }
  }

  async verifyRefreshToken(refreshToken) {
    const hashedToken = RefreshToken.hashToken(refreshToken);
    const tokenDoc = await RefreshToken.findOne({ tokenHash: hashedToken });

    if (!tokenDoc || tokenDoc.isRevoked || new Date() > tokenDoc.expiresAt) {
      return null;
    }
    return tokenDoc;
  }
}

export default new TokenService();