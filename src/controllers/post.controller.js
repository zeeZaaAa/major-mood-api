import postService from "../services/post/post.service.js";

class PostController {
    async getFeed(req, res) {
        try {
            const { faculty, mood, year, month, day, onlyUser, page, limit, before, since } = req.query;

            const currentUserId = req.user?.id;

            const data = await postService.getPosts(
                {
                    faculty,
                    mood,
                    year,
                    month,
                    day,
                    onlyUser: onlyUser === "true",
                    currentUserId,
                    before,
                    since
                },
                { page, limit }
            );

            return res.status(200).json(data);
        } catch (error) {
            console.log('get feed error:', error.message);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async create(req, res) {
        try {
            const { moodType, caption, faculty_name, curriculum_name } = req.body;
            const userId = req.user.id;

            if (!moodType || !faculty_name || !curriculum_name) {
                return res.status(400).json({ message: "Required fields missing" });
            }

            const post = await postService.createPost({
                user: userId,
                moodType,
                caption,
                faculty_name,
                curriculum_name
            });

            return res.status(201).json({ message: "Mood posted successfully", post });
        } catch (error) {
            console.log('create post error:', error.message);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async toggleReaction(req, res) {
        try {
            const { id: postId } = req.params;
            const userId = req.user.id;

            const { reactionsCount, isLiked } = await postService.toggleReaction(postId, userId);
            return res.status(200).json({ reactionsCount, isLiked });
        } catch (error) {
            console.log('reaction error:', error.message);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async update(req, res) {
        try {
            const { id: postId } = req.params;
            const userId = req.user.id;
            const { moodType, caption } = req.body;

            if (caption && caption.length > 280) {
                return res.status(400).json({ message: "Keep it short and sweet! Max 280 characters." });
            }

            const updatedPost = await postService.updatePost(postId, userId, {
                moodType,
                caption
            });

            return res.status(200).json({
                message: "Mood updated successfully",
                post: updatedPost
            });
        } catch (error) {
            if (error.message.includes("not found or unauthorized")) {
                return res.status(403).json({ message: error.message });
            }
            console.log('update post error:', error.message);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async delete(req, res) {
        try {
            const { id: postId } = req.params;
            const userId = req.user.id;

            await postService.deletePost(postId, userId);
            return res.status(200).json({ message: "Post removed successfully" });
        } catch (error) {
            if (error.message.includes("not found or unauthorized")) {
                return res.status(403).json({ message: error.message });
            }
            console.log('delete post error:', error.message);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async report(req, res) {
        try {
            const { id: postId } = req.params;
            const userId = req.user.id;
            const { reason } = req.body;

            if (!reason || reason.trim().length < 10) {
                return res.status(400).json({ message: "Please provide a description of at least 10 characters." });
            }

            const result = await postService.reportPost(postId, userId, reason);
            return res.status(200).json(result);
        } catch (error) {
            if (
                error.message.includes("cannot report your own") ||
                error.message.includes("already reported") ||
                error.message.includes("Cannot report an inactive")
            ) {
                return res.status(400).json({ message: error.message });
            }

            if (error.message === "Post not found") {
                return res.status(404).json({ message: error.message });
            }

            console.log('report post error:', error.message);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getReportedPosts(req, res) {
        try {
            const { page, limit } = req.query;

            const dashboardData = await postService.getReportedPostsAdmin({
                page,
                limit
            });

            return res.status(200).json(dashboardData);
        } catch (error) {
            console.error("Admin GetReportedPosts Error:", error.message);
            return res.status(500).json({ message: "Internal server error reading report records" });
        }
    }

    async banPost(req, res) {
        try {
            const { id: postId } = req.params;

            await postService.banPostAdmin(postId);

            return res.status(200).json({
                success: true,
                message: "Post successfully moderated and banned from the feed"
            });
        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({ message: error.message });
            }
            console.error("Admin BanPost Error:", error.message);
            return res.status(500).json({ message: "Internal server error executing ban order" });
        }
    }
}

export default new PostController();