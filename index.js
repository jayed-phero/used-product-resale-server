const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.msatzvk.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const categoriCollection = client.db('reselProducts').collection('categories')
        const productsCollection = client.db('reselProducts').collection('products')
        const usersCollection = client.db('reselProducts').collection('users')
        const bookingsCollection = client.db('reselProducts').collection('customerBookings')
        const paymentsCollection = client.db('reselProducts').collection('customerPayments')
        const wishlistsCollection = client.db('reselProducts').collection('wishlistedProducts')

        // user saving with jwt token
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options)

            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '11d'
            })
            console.log(token)
            res.send({ result, token })

        })


        // product  advertise 
        app.put('/allproducts/:role', async (req, res) => {
            const role = req.params.role
            const product = req.body
            const filter = { role: role }
            const options = { upsert: true }
            const updateDoc = {
                $set: product,
            }
            const result = await productsCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })


        // get a single user with role
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            res.send(user)
        })


        // Get all products
        app.get('/categories', async (req, res) => {
            const categories = await categoriCollection.find().toArray()
            res.send(categories)
        })

        app.get('/products/:categori_id', async (req, res) => {
            const id = req.params.categori_id
            const query = { categori_id: id }
            const result = await productsCollection.find(query).sort({$natural: -1}).toArray()
            res.send(result)
        })

        // booking by user
        app.post('/bookings', async (req, res) => {
            const bookingData = req.body
            const result = await bookingsCollection.insertOne(bookingData)
            res.send(result)
        })


        // wishlisted post by user
        app.post('/wishlist', async (req, res) => {
            const bookingData = req.body
            const result = await wishlistsCollection.insertOne(bookingData)
            res.send(result)
        })


        // get user wishlist product by email
        app.get('/wishlistedproducts/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const wishlistedproducts = await wishlistsCollection.find(query).toArray()
            res.send(wishlistedproducts)
        })

        // get all bookings by cusotomer 
        app.get('/allbookings', async (req, res) => {
            let query = {}
            const email = req.query.email

            if (email) {
                query = {
                    email: email
                }
            }

            const booking = await bookingsCollection.find(query).toArray()
            res.send(booking)
        })


        // add a product by seller
        app.post('/addproduct', async (req, res) => {
            const addProductData = req.body
            const result = await productsCollection.insertOne(addProductData)
            res.send(result)
        })


        // get all product for seller 
        app.get('/allproducts', async (req, res) => {
            let query = {}
            const email = req.query.email

            if (email) {
                query = {
                    email: email
                }
            }

            const products = await productsCollection.find(query).toArray()
            res.send(products)
        })


        // product delete
        app.delete('/allproducts/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(filter)
            res.send(result)
        })

         // get all seller for admin 
         app.get('/alluser', async (req, res) => {
            let query = {}
            const role = req.query.role

            if (role) {
                query = {
                    role: role
                }
            }

            const sellers = await usersCollection.find(query).toArray()
            res.send(sellers)
        })

        // get advertise product
        app.get('/advertise', async (req, res) => {
            let query = {}
            const role = req.query.role

            if (role) {
                query = {
                    role: role
                }
            }

            const advertise = await productsCollection.find(query).toArray()
            res.send(advertise)
        })


        // verify seller
        app.put('/users/:verify', async (req, res) => {
            const verify = req.params.verify
            const seller = req.body
            const filter = { verify: verify }
            const options = { upsert: true }
            const updateDoc = {
                $set: seller,
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })

        // check verify 
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email 
            const query = {email: email}
            const user  = await usersCollection.findOne(query)
            res.send({isVerify: user?.verify === 'verified'})
        })

        // seller delete
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter)
            res.send(result)
        })

        // get payment info
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id 
            const query = { _id: ObjectId(id)}
            const booking = await bookingsCollection.findOne(query)
            res.send(booking)
        })

        // get wishlist payment info
        app.get('/wishlists/:id', async (req, res) => {
            const id = req.params.id 
            const query = { _id: ObjectId(id)}
            const wishlits = await wishlistsCollection.findOne(query)
            res.send(wishlits)
        })


        // create-payment-intent
        //  STRIPE PAYMENT 
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.priceInt ;
            const amount = price * 100 ;
            
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card",
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            })
        })

        app.post('/paymentsinfo', async (req, res) => {
            const payment = req.body 
            const result = await paymentsCollection.insertOne(payment)
            const id = payment.bookingId 
            const filter = {_id:  ObjectId(id)}
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        







    }
    finally {

    }
}
run().catch(err => console.error(err))



app.get('/', (req, res) => {
    res.send('Resel product server is running')
})

app.listen(port, () => {
    console.log(`Resel product server is running ${port}`)
})




