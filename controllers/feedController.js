const {validationResult} = require('express-validator/check');
const io = require('../socket');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {

    try{

        const posts = await Post.find().populate('creator').sort({createdAt: -1})
   
        res.status(200).json({
           message: 'Fetched Posts Success', posts: posts
        })

    }catch (err){
        const error = new Error('Validation Failed, entereded data was incorrect.')
        error.statusCode = 422;
        next(error)

    }
}

exports.getSinglePost = async (req, res, next) => {

    const postId = req.params.postId;

    try{
        const post = await Post.findById(postId)
   
        res.status(200).json({
            message: "Post fetched: OK",
            post: post
        })
        
    }catch(err){

        const error = new Error('Post fetched: ERROR')
        error.statusCode = 500;
        //needs to throw on next inside promisses (catch stage)
        next(error);

    }
}

exports.createPost = (req, res, next) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        const error = new Error('Validation Failed: Data input was incorrect.')
        error.statusCode = 422;
        throw error;
    }

    const title = req.body.title;
    const content = req.body.content;

    let imageUrl = 'http://localhost:8080/images/default.png'

    if(req.file){
        imageUrl = req.file.path.replace("\\" ,"/");
    }
    let creator;

    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    })

    post.save()
    .then(result => {
        return User.findById(req.userId);
    })
    .then(user => {
       user.posts.push(post);
       creator = user;
       io.getIO().emit('postsUpdate', {action: 'create', post: {...post._doc, creator: {_id: req.userId, name: user.name}}});
        user.save()
        .then(result => {
            res.status(201).json({
                message: "Post Created!",
                creator: {
                    _id: creator._id,
                    name: creator.name
                },
                post: post
            })
        }).catch(err=> {
            const error = new Error('Error storing post.')
            error.statusCode = 500;
            next(error);
        })
    })
}

exports.editPost = (req, res, next) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        const error = new Error('Validation Failed: Data input was incorrect.')
        error.statusCode = 422;
        throw error;
    }

    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.imageUrl;

    if(req.file){
        imageUrl = req.file.path.replace("\\" ,"/");
    }

    Post.findById(postId).populate('creator')
    .then(post => {
       post.title = title;
       post.content = content;
       post.imageUrl = imageUrl;

       if(post.creator._id.toString() !== req.userId){
           const error = new Error("Wrong user for this feed");
           error.statusCode = 401;
           throw error;
       }

       return post.save()
       .then(result =>{
        io.getIO().emit('postsUpdate', {action: 'edit', post: result});
            res.status(200).json({
                message: "Post updated",
                post: result
            })
        })
      
    })
    .catch(err => {
        console.log(err)
        const error = new Error('Error editing post.')
        error.statusCode = 500;
        next(error);
    })
}

exports.deletePost = (req, res, next) => {

    const postId = req.params.postId;

    Post.findById(postId)
    .then(post => {
        // Check logged user...
        if(post.creator.toString() !== req.userId){
            const error = new Error("Wrong user for this feed");
            error.statusCode = 403;
            throw error;
        }
        return Post.findOneAndDelete(postId)
    })
    .then(result => {
        return User.findById(req.userId);
    })
    .then(user => {
        user.posts.pull(postId);
   
        return user.save();
    })
    .then(result => {
        io.getIO().emit('postsUpdate', {action: 'delete', post: postId});
        res.status(200).json({message: 'Post deleted.'})
    })
    .catch(err =>{
        const error = new Error('Error deleting post.')
        error.statusCode = 500;
        next(error);
    })
}

exports.getStatus = (req, res, next) => {

    User.findById(req.userId)
    .then(user => {
        res.status(200).json({
            message: "User Status fetched",
            status: user.status
        })
    })
    .catch(err => {
        const error = new Error('Error fetching user Status');
        error.statusCode = 500;
        next(error);
    })
}

exports.setStatus = (req, res, next) => {

    const status = req.body.status;

    User.findById(req.userId)
    .then(user => {
        user.status = status;
        return user.save()
    })
    .then(result => {
        res.status(200).json({
            message: "User Status fetched",
            status: status
        })   
    })
    .catch(err => {
        const error = new Error('Error fetching user Status');
        error.statusCode = 500;
        next(error);
    })
}