const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const uri = process.env.DB_CONNECTION_LINK;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const categoriCollection = client.db('reselProducts').collection('categories')
        const productsCollection = client.db('reselProducts').collection('products')
        const usersCollection = client.db('reselProducts').collection('users')
        const bookingsCollection = client.db('reselProducts').collection('customerBookings')

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
            // console.log(user.role)
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
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })

        // booking by user
        app.post('/bookings', async (req, res) => {
            const bookingData = req.body
            const result = await bookingsCollection.insertOne(bookingData)
            res.send(result)
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
         app.get('/allseller', async (req, res) => {
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


        // verify seller
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

// echo "# b612-used-products-resale-server-side-jayed-phero" >> README.md
// git init
// git add README.md
// git commit -m "first commit"
// git branch -M main
// git remote add origin https://github.com/programming-hero-web-course-4/b612-used-products-resale-server-side-jayed-phero.git
// git push -u origin main


