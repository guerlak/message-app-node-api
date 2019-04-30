const jwt = require('jsonwebtoken');

module.exports = (req, res, next)=> {

    const authHeader = req.headers.authorization;

    if(!authHeader){
        const error = new Error("Not authHeader");
        error.statusCode = 401;
        throw error;
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;

    try{
        decodedToken = jwt.verify(token, 'guerlaksupersecret');
    }catch(err){
        err.statusCode = 500;
        throw err;
    }
    if(!decodedToken){
        const error = new Error("Not auth");
        error.statusCode = 401;
        throw error;
    }

    req.userId = decodedToken.userId;
    next()
}