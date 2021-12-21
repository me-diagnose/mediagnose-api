const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));

const authRoute = require('./routes/auth');
const userRoute = require('./routes/user');
const paypalRoute = require('./routes/paypal');

function setupCORS(req, res, next) {
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-type,Accept,X-Access-Token,X-Key');
    res.header('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
    } else {
        next();
    }
}
app.all('/*', setupCORS);
app.use(express.static("./"))
app.use('/auth', authRoute);
app.use('/user', userRoute);
app.use('/payment', paypalRoute);
app.get('/', (req, res) => {
    res
        .status(200)
        .send('api is running')
        .end();
})

app.listen(PORT);
