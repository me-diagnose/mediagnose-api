const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

const authRoute = require('./routes/auth');
const userRoute = require('./routes/user');

app.use(express.json());
app.use(express.urlencoded({extended: false}))

app.use('/auth', authRoute);
app.use('/user', userRoute);

app.listen(PORT);
