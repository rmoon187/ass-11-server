require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { MongoClient, ServerApiVersion, ObjectId, } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: ["http://localhost:5173", "https://fir-first-p.web.app", "https://fir-first-p.firebaseapp.com"], credentials: true }));

const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).send({ message: "Unauthorized access" });
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden access" });
        }
        req.user = decoded;
        next();
    });
};


// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_User}:${encodeURIComponent(process.env.DB_Pass)}@cluster0.isok8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


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
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const database = client.db("recomHubDb");
        const addedQueries = database.collection("addedQueries");
        const recommendations = database.collection("recommendations");

        // Test Route
        app.get("/", (req, res) => {
            res.send(" mango Server is running!");
        });

        // generate jwt
        app.post("/jwt", async (req, res) => {
            const userEmail = req.body;
            // create token
            const token = jwt.sign(userEmail, process.env.SECRET_KEY, { expiresIn: '365d' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
            })
                .send({ success: true })
        });
        app.post("/logout", async (req, res) => {

            res.clearCookie('token', {
                maxAge: 0,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
            })
                .send({ success: true })
        });

        app.post("/my-queries", async (req, res) => {
            const newQuery = req.body;
            const result = await addedQueries.insertOne(newQuery);
            res.send(result);
        });

        app.get("/my-queries", async (req, res) => {
            const userEmail = req.query.userEmail;
            const limit = parseInt(req.query.limit) || 0;

            let query = {};
            if (userEmail) {
                query.userEmail = userEmail;
            }

            const queries = await addedQueries
                .find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .toArray();

            res.send(queries);
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

        app.get("/recommendations", verifyToken, async (req, res) => {
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
