const path = require('path');
const fs = require('fs');
const https = require('https')

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const mongodbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')

const errorController = require('./controllers/error');
const User = require('./models/user');


const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.iwbwobe.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`
const app = express();
const store = new mongodbStore({
    uri: MONGODB_URI,
    collection: 'sessions'
}) // use mongodbStore in constructor

const csrfProtection = csrf();

const privateKey = fs.readFileSync('server.key')
const certificate = fs.readFileSync('server.cert')

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname)
    }
})
// const fileFilter = (req,file,cb)=>{

//     if(
//         file.minetype === 'image/png' || 
//         file.minetype === 'image/jpg' || 
//         file.minetype === 'image/jpeg' 
//     ){
//         cb(null,true);
//     } else{
//         cb(null,false)
//     }



// }

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {
    flags: 'a'
})

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    multer({ storage: fileStorage }).single('image')
)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store
    })
);

app.use(csrfProtection);
app.use(flash()) // now we can acess flash() 

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next()
    //local allow us to pass the value of local variable that are
    // passed into the views ,only exist view whcih are render
})

app.use((req, res, next) => { //here we dont store  session ,session manage automatically
    //throw new Error('Sync Dummy');
    if (!req.session.user) {
        return next()
    }
    User.findById(req.session.user._id) // fetch user from session
        .then(user => {
            // throw new Error('Dummy')
            if (!user) {
                return next();
            }
            req.user = user;// store user object
            next();
        })
        .catch(err => {
            next(new Error(err))
        })

})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use('/500', errorController.get500);

app.use(errorController.get404);

//error handling middleware
app.use((error, req, res, next) => {
    // res.status(error.httpStatusCode).render()
    res.status(500)
        .render('500', {
            pageTitle: 'error',
            path: '/500',
            isAuthenticated: req.session.isLoggedIn
        });
});

mongoose
    .connect(MONGODB_URI)
    .then(result => {
        // https.
        //     createServer({ key: privateKey, cert: certificate }, app)
        //     .listen(process.env.PORT || 3009)
        app.listen(process.env.PORT || 3009)
    })
    .catch(err => console.log(err)
    );

