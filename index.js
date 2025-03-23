require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://ass-11-user:${encodeURIComponent(process.env.DB_Pass)}@cluster0.isok8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


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
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const database = client.db("recomHubDb");
        const addedQueries = database.collection("addedQueries");

        // Test Route
        app.get("/", (req, res) => {
            res.send(" mango Server is running!");
        });

        app.post("/my-queries", async (req, res) => {
            const newQuery = req.body;
            const result = await addedQueries.insertOne(newQuery);
            res.send(result);
        });


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
