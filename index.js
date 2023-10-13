const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

console.log(process.env.DB_PASS);

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fgokub5.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const allToyCollection = client.db('carToy').collection('allToy');


    app.post('/allToy', async (req, res) => {
      const body = req.body;
      const result = await allToyCollection.insertOne(body);
      res.send(result)
    });


    app.get('/allToy', async (req, res) => {
      const limit = parseInt(req.query.limit) || 20;
      const cursor =  allToyCollection.find();
      const result = await cursor.limit(limit).toArray();
      res.send(result)
    })


    
    app.get('/searchText', async (req, res) => {
      const searchText = req?.query?.search;
      const result = await allToyCollection.find({
        name:{$regex:searchText, $options:"i"}
      }).toArray()
      res.send(result)
    })


    app.get(`/categoryTab/:text`, async (req, res) => {
      const text = req.params.text;
      const query = { subcategory: text };
      const result = await allToyCollection.find(query)
        .limit(3).toArray();
      res.send(result)
    })


    app.get(`/myToy/:email`, async (req, res) => {
      try {
        const email = req.params.email;
        const result = await allToyCollection
          .find({ sellerEmail: email })
          .toArray();
        res.send(result)
      } catch (error) {
        console.error('Error retrieving toys:', error);
        res.status(500).send('Internal Server Error')
      }
    })


    app.put('/update/:id', async (req, res) => {
      const id = req.params.id;
      const updateToy = req.body;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const updateDoc = {
        $set:{
          price:updateToy.price,
          rating: updateToy.rating,
          quantity: updateToy.quantity,
          description: updateToy.description
        }
      }
      const result = await allToyCollection.updateOne(filter, updateDoc, options)
      res.send(result)
    })


    app.delete('/toy/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await allToyCollection.deleteOne(query)
      res.send(result)
    })


    app.get(`/allToyData`, async (req, res) => {
      try {
        
        const sortBy = req.query.sortBy;

        let sortOptions = {};
        if (sortBy === 'lower') {
          sortOptions = { price: 1 };
        }

        else if (sortBy === 'higher') {
          sortOptions = { price: -1 };
        }
        const result = await allToyCollection
          .find()
          .sort(sortOptions)
          .toArray();
        res.send(result)
      } catch (error) {
        console.error('Error retrieving toys:', error);
        res.status(500).send('Internal Server Error')
      }
    })


  


    app.post('/jwt', (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1h' })
      res.send({token})
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("car toy server is running");
});

app.listen(port, (req, res) => {
  console.log(`car toy running on port : ${port}`);
});
