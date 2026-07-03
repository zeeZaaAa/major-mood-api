import userService from "../user/user.service.js";
import tokenService from "../token/token.service.js";
import { OAuth2Client } from 'google-auth-library';

class AuthService {
    getOAuthClient() {
        return new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_CALLBACK_URL
        );
    }

    getGoogleAuthUrl() {
        const client = this.getOAuthClient();
        return client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ],
            prompt: 'select_account'
        });
    }

    async handleGoogleCallback(code, req) {
        const client = this.getOAuthClient();

        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email_verified) {
            throw new Error('Invalid or unverified Google account');
        }

        const { email, name, sub: googleId } = payload;

        let user = await userService.getUserByEmail(email);
        if (!user) user = await userService.createUser(email, name, googleId);

        const userAgent = req.headers['user-agent'] || 'unknown';
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        const accessToken = tokenService.generateAccessToken(user);
        const refreshToken = await tokenService.generateRefreshToken(user, userAgent, ip);

        return { accessToken, refreshToken };
    }

    async refresh(refreshToken) {
        const decoded = await tokenService.verifyRefreshToken(refreshToken);
        const user = await userService.getUserById(decoded.userId);
        if (!user) return {
            status: 401,
            message: 'Unauthorized'
        }

        const newAccessToken = tokenService.generateAccessToken(user);
        return {
            status: 200,
            message: 'Successfully get new access token',
            accessToken: newAccessToken
        }

    }
}

export default new AuthService();