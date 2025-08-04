const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { requireAuth, requireAuthJson } = require('../middlewares/auth');

// 게시글 목록 (로그인 불필요)
router.get('/', postController.getPosts);

// 게시글 작성 폼 (로그인 필요)
router.get('/create', requireAuth, postController.getCreatePost);

// 게시글 작성 (로그인 필요)
router.post('/create', requireAuth, postController.upload, postController.createPost);

// 게시글 상세 조회 (로그인 불필요)
router.get('/:id', postController.getPost);

// 게시글 수정 폼
router.get('/:id/edit', requireAuth, postController.getEditPost);

// 게시글 수정
router.put('/:id', requireAuth, postController.upload, postController.updatePost);
router.post('/:id/edit', requireAuth, postController.upload, postController.updatePost);

// 게시글 삭제
router.delete('/:id', requireAuth, postController.deletePost);
router.post('/:id/delete', requireAuth, postController.deletePost);

// 댓글 작성
router.post('/:id/comments', requireAuthJson, postController.createComment);

// 댓글 삭제
router.delete('/:id/comments/:commentId', requireAuthJson, postController.deleteComment);

// 좋아요 토글
router.post('/:id/like', requireAuthJson, postController.toggleLike);

module.exports = router; 