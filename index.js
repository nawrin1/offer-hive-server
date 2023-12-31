const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;
const jwt=require('jsonwebtoken')
const cookieParser = require('cookie-parser');



app.use(cookieParser())
app.use(cors({
  origin: [
    // 'http://localhost:5173'
    'https://online-marketplace-1a3a1.web.app',
    'https://online-marketplace-1a3a1.firebaseapp.com'
  ],

  credentials: true
}));

app.use(express.json());
console.log(process.env.DB_PASS)



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vqv383i.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
      return res.status(401).send({ message: 'unauthorized access' })
  }
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
      }
      req.user = decoded;
      next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const jobsCollection = client.db('Marketplace').collection('jobs');
    const bidsCollection = client.db('Marketplace').collection('allBids');
  //   app.get('/jobs', async (req, res) => {
  //     const cursor = jobsCollection.find();
  //     const result = await cursor.toArray();
  //     res.send(result);

  // })
  app.get('/jobs/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id)
    const query = { _id: new ObjectId(id) }
    const result = await jobsCollection.findOne(query);
    res.send(result);
  })
  app.get('/allBids/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id)

    const query = { _id: new ObjectId(id) }
    const result = await bidsCollection.findOne(query);
    res.send(result);
  })
  app.post('/allBids', async (req, res) => {
    const allBids = req.body;
    console.log(allBids);
   
    const result = await bidsCollection.insertOne(allBids);
    res.send(result);
  });
  app.post('/jobs', async (req, res) => {
    const allJobs = req.body;
    console.log(allJobs);
   
    const result = await jobsCollection.insertOne(allJobs);
    res.send(result);
  });
  app.get('/allBids', async (req, res) => {
    
   




    let query={}
    const options = {
   
      sort: { "status": 1 },
     
    };
    if (req.query?.userEmail) {
        query = { userEmail: req.query.userEmail }
    }
    if (req.query?.buyerEmail) {
        query = { buyerEmail: req.query.buyerEmail }
    }
    
    const result = await bidsCollection.find(query,options).toArray();
    res.send(result);
})
  app.get('/jobs',  async (req, res) => {
    console.log(req.query.email);

   
    
    let query={}
    if (req.query?.email) {
        query = { email: req.query.email }
    }
    
    const result = await jobsCollection.find(query).toArray();
    res.send(result);
})
app.put('/jobs/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const options = { upsert: true };
 

 
    const updated= req.body;

    const job = {
        $set: {
            
            jobtitle: updated.jobtitle,
            max: updated.max,
            min: updated.min,
            description: updated.description,
            deadline: updated.deadline,
            category: updated.category,
           
        }
    }
  
    const result = await jobsCollection.updateOne(filter, job, options);
    res.send(result);




})
app.put('/allBids/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const options = { upsert: true };
  if (req.body?.status=== 'rejected' || req.body?.status === 'in progress'|| req.body?.status === 'complete'){
    console.log("ooooo")
    const jobs = {
      $set: {
          
          status: req.body.status
         
      }
  }

  const result = await bidsCollection.updateOne(filter, jobs, options);
  res.send(result);

  }
 

 




})
app.delete('/jobs/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await jobsCollection.deleteOne(query);
  console.log(result)
  res.send(result);
})
app.post('/jwt', async (req, res) => {
  const user = req.body;
  console.log(user);
  
  const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:"1h"})
  res
  .cookie('token',token,{
      httpOnly:true,
      secure:true,
      

  })
  .send({success:token})
})
app.post('/logout',async(req,res)=>{
  const user=req.body
  console.log('logging out',user)

  res.clearCookie('token', {maxAge:0}).send({success:true})
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


app.get('/', (req, res) => {
    res.send('marketplace is running')
})

app.listen(port, () => {
    console.log(`marketplace Server is running on port ${port}`)
})