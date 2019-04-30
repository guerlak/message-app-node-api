const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');

const app = express();
const authRouter = require('./routes/authRoutes');
const feedRouter = require('./routes/feedRoutes');

const fileHelper = Date.now().toISOString;

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'images');
    },
    filename: function(req, file, cb) {
        cb(null, fileHelper + file.originalname)
    }
});

const fileFilter = (req, file, cb)=> {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        cb(null, true)
    }else{
        cb(null, false)
    }
}

//CORS
app.use((req, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type , Authorization');
    next();
})

//app.use(bodyParser.urlencoded())

app.use(multer({storage: storage, fileFilter: fileFilter}).single('image'))
app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/auth', authRouter);
app.use('/feed', feedRouter);

//errors middleware handler
app.use((error, req, res, next) => {
    console.log(error);
    res.status(error.statusCode).json({message: error.message, data: error.data});
})

 mongoose.connect('mongodb+srv://guerlak:aloha99@cluster01-p5wzr.mongodb.net/blog', {useNewUrlParser: true})
.then(res => {
    const server = app.listen(8080);
    const io = require('./socket').init(server);
    io.on('connection', socket =>{
        console.log("Client conn")
    })
   
}).catch(err => console.log(err));






