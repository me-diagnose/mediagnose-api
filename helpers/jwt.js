const jwt = require("jsonwebtoken");

generateAccessToken = (userCredentials)  =>
    jwt.sign({
        username: userCredentials.username,
        id: userCredentials.userId,
        orderDate: userCredentials.orderDate
    }, process.env.TOKEN_SECRET, {expiresIn: '1800s'});

module.exports = generateAccessToken;
