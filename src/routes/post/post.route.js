import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import postController from "../../controllers/post.controller.js";

const router = Router();

router.use(authenticate);

router.get("/feed", authorize('posts:read'), postController.getFeed);
router.post("/create", authorize('posts:write'), postController.create);
router.post("/:id/react", authorize('posts:write'), postController.toggleReaction);
router.post("/:id/report", authorize('posts:write'), postController.report);
router.patch("/:id", authorize('posts:write'), postController.update);
router.delete("/:id", authorize('posts:write'), postController.delete);
router.get("/reported-posts", authorize('posts:ban'), postController.getReportedPosts);
router.patch("/:id/ban", authorize('posts:ban'), postController.banPost);

export default router;