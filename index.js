require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId, } = require("mongodb");

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
        const recommendations = database.collection("recommendations");

        // Test Route
        app.get("/", (req, res) => {
            res.send(" mango Server is running!");
        });

        app.post("/my-queries", async (req, res) => {
            const newQuery = req.body;
            const result = await addedQueries.insertOne(newQuery);
            res.send(result);
        });

        app.get("/my-queries", async (req, res) => {

            const userEmail = req.query.userEmail;
            if (userEmail) {
                const products = await addedQueries.find({ userEmail }).toArray();
                return res.send(products);
            }

            const products = await addedQueries.find().toArray();
            res.send(products);

        });

        app.delete("/my-queries/:id", async (req, res) => {
            const id = req.params.id;
            const result = await addedQueries.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        app.patch("/my-queries/:id/increment", async (req, res) => {
            const id = req.params.id;
            const fieldName = "recommendationCount";
            const result = await addedQueries.updateOne(
                { _id: new ObjectId(id) },
                { $inc: { [fieldName]: 1 } }
            );
            res.send(result);
        });

        app.patch("/my-queries/:id/decrement", async (req, res) => {
            const id = req.params.id;
            const fieldName = "recommendationCount";
            const result = await addedQueries.updateOne(
                { _id: new ObjectId(id) },
                { $inc: { [fieldName]: -1 } }
            );
            res.send(result);
        });

        app.get("/my-queries/:id", async (req, res) => {
            const id = req.params.id;
            const q = await addedQueries.findOne({ _id: new ObjectId(id) });
            q._id = q._id.toString();
            res.send(q);
        });

        app.put("/my-queries/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const updatedQuery = req.body;
            const updateDoc = {
                $set: {
                    productName: updatedQuery.productName,
                    productBrand: updatedQuery.productBrand,
                    productImage: updatedQuery.productImage,
                    queryTitle: updatedQuery.queryTitle,
                    reasonDetails: updatedQuery.reasonDetails,

                },
            }
            const result = await addedQueries.updateOne(query, updateDoc);
            res.send(result);

        })

        // recommendations apis

        app.post("/recommendations", async (req, res) => {
            const newRec = req.body;
            const result = await recommendations.insertOne(newRec);
            res.send(result);
        });

        app.get("/recommendations", async (req, res) => {
            const recommenderEmail = req.query.userEmail;
            const userEmail = req.query.queryUserEmail
            if (recommenderEmail) {
                const rec = await recommendations.find({ recommenderEmail }).toArray();
                return res.send(rec);
            }
            if (userEmail) {
                const rec = await recommendations.find({ userEmail }).toArray();
                return res.send(rec);
            }
        });

        app.get("/recommendations/:queryId", async (req, res) => {
            const id = req.params.queryId;
            const rec = await recommendations.find({ queryId: id }).toArray();
            res.send(rec);
        });

        app.delete("/recommendations/:id", async (req, res) => {
            const id = req.params.id;
            const result = await recommendations.deleteOne({ _id: new ObjectId(id) });
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
