import authService from "../services/auth/auth.service.js";

class AuthController {
    initiateGoogleAuth(req, res) {
        const url = authService.getGoogleAuthUrl();
        res.redirect(url);
    }

    async googleCallback(req, res) {
        try {
            const { code } = req.query; 
            if (!code) {
                return res.status(400).json({ message: 'Authorization code missing' });
            }

            const { accessToken, refreshToken } = await authService.handleGoogleCallback(code, req);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.redirect(`${process.env.REDIRECT_CLIENT_URL}`);

        } catch (error) {
            console.error("OAuth Error:", error.message);
            res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
        }
    }

    async refresh(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) return res.status(401).json({ message: 'Unauthorized' });

            const resp = await authService.refresh(refreshToken);
            if (resp.status === 200) {
                res.status(200).json({ accessToken: resp.accessToken, message: resp.message });
            } else {
                res.status(resp.status).json({ message: resp.message });

            }

        } catch (error) {
            return res.status(403).json({ message: 'Forbidden or expired refresh token' });
        }
    }

    async logout(req, res) {
        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out successfully' });
    }

}

export default new AuthController();