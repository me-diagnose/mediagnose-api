const express = require('express')
const paypal = require('@paypal/checkout-server-sdk');
const {MongoClient, ObjectId} = require('mongodb');
const jwt = require("jsonwebtoken");

const generateAccessToken = require('../helpers/jwt');

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_SECRET;
const isDebug = process.env.DEBUG;

const router = express.Router();
const authMiddleWare = require('../middleware/auth.middleware')

const environment = isDebug ? new paypal.core.SandboxEnvironment(clientId, clientSecret) : new paypal.core.LiveEnvironment(clientId, clientSecret);
const paypalClient = new paypal.core.PayPalHttpClient(environment);

async function createOrder() {
    let request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=minimal');
    request.requestBody({
        intent: "CAPTURE",
        application_context: {
            return_url: `${process.env.FRONTEND_URL}/order-finished`,
            locale: 'en-US'
        },
        purchase_units: [
            {
                amount: {
                    currency_code: "USD",
                    value: process.env.PRICE
                }
            }
        ]
    });

    const response = await paypalClient.execute(request);
    return response.result;
}

async function captureOrder(orderId, accessToken) {
    return new Promise(async (resolve, reject) => {
        try {
            const request = new paypal.orders.OrdersCaptureRequest(orderId);
            request.requestBody({});
            const response = await paypalClient.execute(request);

            if (response.result.status === 'COMPLETED') {
                resolve(await saveOrderDate(accessToken));
            }
        } catch (error) {
            reject({code: error.code || 500, reason: error.message})
        }
    });
}

async function saveOrderDate(accessToken) {
    return new Promise(async (resolve, reject) => {
            try {
                const mongoClient = new MongoClient(process.env.MONGODB_URI);
                await mongoClient.connect();
                const db = mongoClient.db(process.env.DATABASE_NAME);
                const userDecoded = jwt.verify(accessToken, process.env.TOKEN_SECRET);

                await db.collection('users')
                    .updateOne({_id: ObjectId(userDecoded.id)},
                        {$set: {orderDate: new Date()}});

                const {username, orderDate} = await db.collection('users').findOne({
                    _id: ObjectId(userDecoded.id)
                });

                resolve({
                    accessToken: generateAccessToken({username, orderDate, id: userDecoded.id}),
                    orderDate: Date.now()
                });
            } catch (error) {
                return reject({code: error.code || 500, reason: error.message})
            }
        }
    )
}

router.route('/initiate').get(authMiddleWare, async (req, res) => {
    try {
        const result = await createOrder();
        res.send(result);
    } catch (error) {
        res.status(error.code).send(error.reason);
    }
});

router.route('/approve').get(authMiddleWare, async (req, res) => {
    try {
        const token = req.headers['x-access-token'];
        const newAuth = await captureOrder(req.query.token, token);
        res.send(newAuth);
    } catch (error) {
        res.status(error.code).send(error.reason);
    }
})

module.exports = router;
