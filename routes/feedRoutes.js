const express = require('express');
const {body} = require('express-validator/check');

const isAuth = require('../middlewares/is-auth');

const router = express.Router();

const feedController = require('../controllers/feedController')

router.get('/posts', isAuth, feedController.getPosts);
router.get('/get-status', isAuth, feedController.getStatus);
router.put('/set-status', isAuth, feedController.setStatus)

router.get('/:postId', isAuth, feedController.getSinglePost);

router.post('/post', isAuth, [body('title').trim().isLength({min: 5}), body('content').trim().isLength({min: 5})], feedController.createPost);
router.put('/post/:postId' , isAuth, [body('title').trim().isLength({min: 5}), body('content').trim().isLength({min: 5})], feedController.editPost);

router.delete('/post/:postId', isAuth, feedController.deletePost);


module.exports = router;