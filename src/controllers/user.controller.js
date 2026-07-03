import userService from "../services/user/user.service.js";

class UserController {
    async getMe(req, res) {
        try {
            const user = await userService.getUserById(req.user.id);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
            } else {
                res.status(200).json({
                    _id: user._id,
                    email: user.email,
                    name: user.name,
                    curriculum_name: user.curriculum_name,
                    faculty_name: user.faculty_name,
                    role: user.role
                })
            }

        } catch (error) {
            console.error("GetMe Error:", error.message);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    async getBannedUsers(req, res) {
        try {
            const { search, page, limit } = req.query;
            const data = await userService.getBannedUsers({ search, page, limit });
            return res.status(200).json(data);
        } catch (error) {
            console.error("Get Banned Users Error:", error.message);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async banUser(req, res) {
        try {
            const { id: userId } = req.params;

            if (req.user.id === userId) {
                return res.status(400).json({ message: "You cannot place a restriction lock on your own account status." });
            }

            await userService.banUser(userId);
            return res.status(200).json({ message: "User account status updated to banned successfully." });
        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({ message: error.message });
            }
            console.error("Ban User Error:", error.message);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async unbanUser(req, res) {
        try {
            const { id: userId } = req.params;
            await userService.unbanUser(userId);
            return res.status(200).json({ message: "Account access restrictions revoked." });
        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({ message: error.message });
            }
            console.error("Unban User Error:", error.message);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

export default new UserController();