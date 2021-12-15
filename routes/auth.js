const express = require('express');
const {MongoClient} = require('mongodb');
const generateAccessToken = require('../helpers/jwt');

const router = express.Router();
const dbName = process.env.DATABASE_NAME;
const url = process.env.MONGODB_URI;


async function register(userData) {
    return new Promise(async (resolve, reject) => {
        const client = new MongoClient(url);

        try {
            await client.connect();
            const db = client.db(dbName);

            const user = await db.collection('users').findOne({
                username: userData.username,
                email: userData.email
            });

            if (!!user) {
                return reject({
                    code: 409,
                    reason: 'username or email already exists'
                })
            }

            const addedUserData = await db.collection('users').insertOne({
                username: userData.username,
                email: userData.email,
                age: userData.age,
                gender: userData.gender
            });

            await db.collection('users-credentials').insertOne({
                userId: addedUserData.insertedId,
                password: userData.password
            });

            resolve({accessToken: generateAccessToken(addedUserData)});
        } catch (error) {
            return reject({code: error.code || 500, reason: error.message})
        }
    })
}

async function login(userCredentials) {
    return new Promise(async (resolve, reject) => {
        const client = new MongoClient(url);

        try {
            await client.connect();
            const db = client.db(dbName);

            const user = await db.collection('users').findOne({
                $or: [
                    {username: userCredentials.username},
                    {email: userCredentials.username}
                ]
            });

            if (!user) {
                return reject({
                    code: 401,
                    reason: 'username or email not found'
                })
            }

            const userSavedCredentials = await db.collection('users-credentials').findOne({
                userId: user._id,
            });

            if (userSavedCredentials.password === userCredentials.password) {
                resolve({accessToken: generateAccessToken(userSavedCredentials)});
            } else {
                reject({
                    code: 401,
                    reason: 'wrong password'
                })
            }
        } catch (error) {
            return reject({code: error.code || 500, reason: error.message})
        }
    })
}

router.route('/register').post(async (req, res) => {
    try {
        const result = await register(req.body);

        if (result.error) {
            res.status(result.error.code).send(result.error.reason);
        }

        res.send(result);
    } catch (error) {
        res.status(error.code).send(error.reason);
    }
});

router.route('/login').post(async (req, res) => {
    try {
        const result = await login(req.body);

        if (result.error) {
            res.status(result.error.code).send(result.error.reason);
        }

        res.send(result);
    } catch (error) {
        res.status(error.code).send(error.reason);
    }

});

module.exports = router;
