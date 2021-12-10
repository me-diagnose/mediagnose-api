const express = require('express');
const jwt = require("jsonwebtoken")
const {MongoClient, ObjectId} = require('mongodb');

const authMiddleWare = require('../middleware/auth.middleware')

const router = express.Router();
const dbName = process.env.DATABASE_NAME;
const url = process.env.MONGODB_URI;

async function getUser(token) {
    return new Promise(async (resolve, reject) => {
        const client = new MongoClient(url);

        try {
            await client.connect();
            const db = client.db(dbName);

            const userDecoded = jwt.verify(token, process.env.TOKEN_SECRET);

            const user = await db.collection('users').findOne({
                _id: ObjectId(userDecoded.id)
            });

            console.log(user);
            resolve(user);
        } catch(error) {
            return reject({code: error.code || 500, reason: error.message})
        }
    })
}

router.route('/').get(authMiddleWare, async (req, res) => {
    try {
        const token = req.headers['x-access-token']
        const result = await getUser(token);

        res.send(result);
    } catch(error) {
        res.status(error.code).send(error.reason);
    }
})

module.exports = router;
