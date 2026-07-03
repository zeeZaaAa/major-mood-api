import mongoose from "mongoose";
import Post from "../../schemas/post/post.schema.js";
import { postStatus } from "../../schemas/post/enums/status.enum.js";

class PostService {
    async getPosts(filters = {}, pagination = {}) {
        const faculty = filters.faculty || null;
        const mood = filters.mood || null;
        const year = filters.year && filters.year.trim() !== "" ? filters.year : null;
        const month = filters.month && filters.month.trim() !== "" ? filters.month : null;
        const day = filters.day && filters.day.trim() !== "" ? filters.day : null;
        const onlyUser = filters.onlyUser;
        const currentUserId = filters.currentUserId;
        const before = filters.before || null;
        const since = filters.since || null;

        const { limit = 20 } = pagination;
        const parsedLimit = parseInt(limit);
        const targetUserObjectId = currentUserId ? new mongoose.Types.ObjectId(currentUserId) : null;

        const matchStage = { status: postStatus.ACTIVE };

        if (currentUserId) {
            matchStage["reporters.user"] = { $ne: new mongoose.Types.ObjectId(currentUserId) };
        }

        if (faculty && faculty !== "All Faculties") {
            matchStage.faculty_name = faculty;
        }
        if (mood) {
            matchStage.moodType = mood;
        }
        if (onlyUser && currentUserId) {
            matchStage.user = new mongoose.Types.ObjectId(currentUserId);
        }

        const projectionStage = {
            $project: {
                user: 1,
                moodType: 1,
                caption: 1,
                faculty_name: 1,
                curriculum_name: 1,
                createdAt: 1,
                reactionsCount: { $size: { $ifNull: ["$reactions", []] } },
                isLiked: targetUserObjectId
                    ? { $in: [targetUserObjectId, { $ifNull: ["$reactions.user", []] }] }
                    : { $literal: false }
            }
        };

        let posts = [];

        if (since && before) {
            const newPostsPipeline = [
                { $match: { ...matchStage, createdAt: { $gt: new Date(since) } } },
                { $sort: { createdAt: -1, _id: -1 } },
                { $limit: parsedLimit + 1 },
                projectionStage
            ];
            posts = await Post.aggregate(newPostsPipeline);

            if (posts.length <= parsedLimit) {
                const remainingLimit = (parsedLimit + 1) - posts.length;
                const oldPostsPipeline = [
                    { $match: { ...matchStage, createdAt: { $lt: new Date(before) } } },
                    { $sort: { createdAt: -1, _id: -1 } },
                    { $limit: remainingLimit },
                    projectionStage
                ];
                const oldPosts = await Post.aggregate(oldPostsPipeline);
                posts = [...posts, ...oldPosts];
            }
        } else {
            if (before) {
                matchStage.createdAt = { $lt: new Date(before) };
            } else if (since) {
                matchStage.createdAt = { $gt: new Date(since) };
            } else if (year) {
                const parsedYear = parseInt(year);
                let start, end;
                if (month) {
                    const parsedMonth = parseInt(month) - 1;
                    if (day) {
                        const parsedDay = parseInt(day);
                        start = new Date(Date.UTC(parsedYear, parsedMonth, parsedDay, 0, 0, 0));
                        end = new Date(Date.UTC(parsedYear, parsedMonth, parsedDay, 23, 59, 59, 999));
                    } else {
                        start = new Date(Date.UTC(parsedYear, parsedMonth, 1));
                        end = new Date(Date.UTC(parsedYear, parsedMonth + 1, 0, 23, 59, 59, 999));
                    }
                } else {
                    start = new Date(Date.UTC(parsedYear, 0, 1));
                    end = new Date(Date.UTC(parsedYear, 11, 31, 23, 59, 59, 999));
                }
                matchStage.createdAt = { $gte: start, $lte: end };
            }

            const pipeline = [
                { $match: matchStage },
                { $sort: { createdAt: -1, _id: -1 } },
                { $limit: parsedLimit + 1 },
                projectionStage
            ];
            posts = await Post.aggregate(pipeline);
        }

        const hasMore = posts.length > parsedLimit;
        if (hasMore) {
            posts.pop();
        }

        const finalNextCursor = posts.length > 0 ? new Date(posts[posts.length - 1].createdAt).toISOString() : null;

        return {
            posts,
            meta: {
                hasMore,
                nextCursor: finalNextCursor,
                limit: parsedLimit
            }
        };
    }

    async updatePost(postId, userId, updateData) {
        const post = await Post.findOne({ _id: postId, user: userId });
        if (!post) {
            throw new Error("Post not found or unauthorized to edit");
        }

        if (post.status === postStatus.BANNED) {
            throw new Error("Cannot modify a banned entry");
        }

        if (updateData.moodType) post.moodType = updateData.moodType;
        if (updateData.caption !== undefined) post.caption = updateData.caption;

        const updatedPost = await post.save();

        return {
            _id: updatedPost._id,
            user: updatedPost.user,
            moodType: updatedPost.moodType,
            caption: updatedPost.caption,
            faculty_name: updatedPost.faculty_name,
            curriculum_name: updatedPost.curriculum_name,
            createdAt: updatedPost.createdAt,
            updatedAt: updatedPost.updatedAt,
            reactionsCount: updatedPost.reactions ? updatedPost.reactions.length : 0,
            isLiked: updatedPost.reactions ? updatedPost.reactions.some(r => r.user.toString() === userId.toString()) : false
        };
    }

    async toggleReaction(postId, userId) {
        const post = await Post.findById(postId);
        if (!post) throw new Error("Post item not found");

        const existingReactionIndex = post.reactions.findIndex(
            (r) => r.user.toString() === userId.toString()
        );

        let isLiked = false;
        if (existingReactionIndex > -1) {
            post.reactions.splice(existingReactionIndex, 1);
            isLiked = false;
        } else {
            post.reactions.push({ user: userId });
            isLiked = true;
        }

        await post.save();

        return {
            reactionsCount: post.reactions.length,
            isLiked
        };
    }

    async createPost(postData) {
        const newPost = new Post({
            ...postData,
            status: postStatus.ACTIVE
        });
        const savedPost = await newPost.save();

        return {
            ...savedPost.toObject(),
            reactionsCount: 0,
            isLiked: false
        };
    }

    async deletePost(postId, userId) {
        const post = await Post.findOneAndUpdate(
            {
                _id: postId,
                user: userId,
                status: { $ne: postStatus.DELETED }
            },
            {
                $set: {
                    status: postStatus.DELETED,
                }
            },
            { returnDocument: 'after' }
        );

        if (!post) {
            throw new Error("Post not found or unauthorized");
        }
        return post;
    }

    async reportPost(postId, userId, reason) {
        if (!reason || reason.trim().length < 10) {
            throw new Error("A valid reason of at least 10 characters is required");
        }

        const post = await Post.findById(postId);
        if (!post) {
            throw new Error("Post not found");
        }
        if (post.status !== postStatus.ACTIVE) {
            throw new Error("Cannot report an inactive or already moderated post");
        }

        if (post.user.toString() === userId.toString()) {
            throw new Error("You cannot report your own post");
        }

        const alreadyReported = post.reporters.some(
            (r) => r.user.toString() === userId.toString()
        );
        if (alreadyReported) {
            throw new Error("You have already reported this post");
        }

        post.reporters.push({
            user: userId,
            reason: reason.trim()
        });

        await post.save();

        return {
            success: true,
            message: "Post reported successfully",
            reportsCount: post.reporters.length
        };
    }

    async getReportedPostsAdmin({ page = 1, limit = 10 }) {
        const parsedPage = parseInt(page, 10) || 1;
        const parsedLimit = parseInt(limit, 10) || 10;
        const skip = (parsedPage - 1) * parsedLimit;

        const matchStage = {
            status: postStatus.ACTIVE,
            "reporters.0": { $exists: true }
        };

        const pipeline = [
            { $match: matchStage },
            { $sort: { updatedAt: -1 } },
            { $skip: skip },
            { $limit: parsedLimit },

            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "ownerDetails"
                }
            },
            {
                $unwind: {
                    path: "$ownerDetails",
                    preserveNullAndEmptyArrays: true
                }
            },

            { $unwind: "$reporters" },
            {
                $lookup: {
                    from: "users",
                    localField: "reporters.user",
                    foreignField: "_id",
                    as: "reporters.userDetails"
                }
            },
            {
                $unwind: {
                    path: "$reporters.userDetails",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $group: {
                    _id: "$_id",
                    moodType: { $first: "$moodType" },
                    caption: { $first: "$caption" },
                    faculty_name: { $first: "$faculty_name" },
                    curriculum_name: { $first: "$curriculum_name" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                    reactions: { $first: "$reactions" },
                    postOwner: {
                        $first: {
                            _id: "$ownerDetails._id",
                            name: "$ownerDetails.name",
                            email: "$ownerDetails.email",
                            faculty_name: "$ownerDetails.faculty_name"
                        }
                    },
                    reportersList: {
                        $push: {
                            _id: "$reporters._id",
                            reportedAt: "$reporters.reportedAt",
                            reason: "$reporters.reason",
                            user: {
                                _id: "$reporters.userDetails._id",
                                name: "$reporters.userDetails.name",
                                email: "$reporters.userDetails.email"
                            }
                        }
                    }
                }
            },

            {
                $project: {
                    _id: 1,
                    user: "$postOwner._id",
                    postOwner: 1,
                    moodType: 1,
                    caption: 1,
                    faculty_name: 1,
                    curriculum_name: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    reactionsCount: { $size: { $ifNull: ["$reactions", []] } },
                    isLiked: { $literal: false },
                    reportersCount: { $size: "$reportersList" },
                    reporters: "$reportersList"
                }
            },
            { $sort: { updatedAt: -1 } }
        ];

        const [posts, totalCount] = await Promise.all([
            Post.aggregate(pipeline),
            Post.countDocuments(matchStage)
        ]);

        return {
            posts,
            totalPages: Math.ceil(totalCount / parsedLimit),
            currentPage: parsedPage,
            totalItems: totalCount
        };
    }

    async banPostAdmin(postId) {
        const post = await Post.findByIdAndUpdate(
            postId,
            { $set: { status: postStatus.BANNED } },
            { returnDocument: 'after' }
        );

        if (!post) {
            throw new Error("Target post object not found");
        }
        return post;
    }
}

export default new PostService();