const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* MongoDB Connection Start */
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0avwbtb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const uri = "mongodb://localhost:27017/jobPortal";
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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // jobs related api
    const jobsCollection = client.db('jobPortal').collection('jobs');
    const jobApplicationCollection = client.db('jobPortal').collection('job_applications');

    // Get all jobs
    app.get('/jobs', async (req, res) => {

      const email = req.query.email;
      let query = {};
      if (email) {
        query = {hr_email: email}
      }

      const cursor = jobsCollection.find(query);
      const jobs = await cursor.toArray();
      res.send(jobs);
    });

    // get a single job by id
    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const job = await jobsCollection.findOne(query);
      res.send(job);
    });

    // job application apis
    app.post('/job-applications', async (req, res) => {
      const application = req.body;
      const result = await jobApplicationCollection.insertOne(application);
      res.send(result);
    });

    // get job applications by applicant email
    app.get('/job-applications', async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };
      const result = await jobApplicationCollection.find(query).toArray();

      // aggregate to get job details
      for (const application of result) {
        console.log(application.jobId);
        const query1 = { _id: new ObjectId(application.jobId) };
        const job1 = await jobsCollection.findOne(query1);

        if (job1) {
          application.title = job1.title;
          application.company = job1.company;
          application.company_logo = job1.company_logo;
          application.location = job1.location;
          application.requirements = job1.requirements;
          application.jobType = job1.jobType;
        }
      }

      res.send(result);
    });

    // delete a job application by id
    app.delete('/job-applications/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobApplicationCollection.deleteOne(query);
      res.send(result);
    });

    // add a new job
    app.post('/jobs', async (req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close(); 
  }
}
run().catch(console.dir);
/* MongoDB Connection End */

app.get('/', (req, res) => {
  res.send('Welcome to the Job Portal API');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});