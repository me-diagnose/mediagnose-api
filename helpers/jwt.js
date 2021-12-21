const jwt = require("jsonwebtoken");

generateAccessToken = (userCredentials)  =>
    jwt.sign({
        username: userCredentials.username,
        id: userCredentials.userId,
    }, process.env.TOKEN_SECRET, {expiresIn: '10h'});

module.exports = generateAccessToken;
