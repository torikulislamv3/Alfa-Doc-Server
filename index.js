const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 9000;



// middleware
const corsOption = {
    origin : ['http://localhost:5173'],
    credentials : true,
    optionSuccessStatus : 200,
}
app.use(cors(corsOption))
app.use(cookieParser())
app.use(express.json())

// verify jwt middleware
const verifyToken = (req, res, next)=>{
  const token = req.cookies?.token
  if(!token) return res.status(401).send({message : 'you are un-authorize user'})
  if(token){
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
      if(err){
        console.log(err);
        return res.status(401).send({message : 'you are un-authorize user'})
      }
      console.log(decoded);
      req.user = decoded
      next()
    })
  }
 
 
}

app.get('/', (req, res)=>{
        res.send('assignment server is running')
})




const uri =
 `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.v40qcvb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

console.log(process.env.DB_USERNAME,process.envDB_PASSWORD);

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
   const assignmentCollection = client.db('Assignments').collection('data')
   const submitCollection = client.db('Assignments').collection('submit')


  //  jwt generate

    app.post('/jwt', async(req, res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:'7d'
      })
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production'?'none':'strict',
      })
      .send({success : true})
    })

    // clear token on logout
    app.get('/logout',(req, res)=>{
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production'?'none':'strict',
        maxAge:0,
      })
      .send({success : true})
    })


//    rest api method for get, post , delete , update
app.get('/data', async(req, res)=>{
    const result =await assignmentCollection.find().toArray()

    res.send(result)
})

// details for api
app.get('/data/:id', async(req, res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await assignmentCollection.findOne(query)
  res.send(result)
})

// api for update assignment
app.put('/data/:id', async(req, res)=>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)};
  const options = {upsert : true};
  const updatedAssignment = req.body;
  const update = {
    $set : {
      title :updatedAssignment.title,
      description :updatedAssignment.description,
      difficulty_level :updatedAssignment.difficulty_level,
      marks :updatedAssignment.marks,
      date :updatedAssignment.date,
      thumbnail_image_url :updatedAssignment.thumbnail_image_url
    }
  }
  const result = await assignmentCollection.updateOne(filter, update, options);
  res.send(result);
})

// add data for assignments
app.post('/data', async(req, res)=>{
    const newAssignment = req.body;
    console.log(newAssignment);
    const result = await assignmentCollection.insertOne(newAssignment);
    res.send(result);
})


// api for delete method
app.delete("/data/:id", async(req, res)=>{
  const id = req.params.id;
  const query = {_id : new ObjectId(id)}
  const result = await assignmentCollection.deleteOne(query)
  res.send(result)
})

// post api for submit assignment


app.post('/submit', async(req, res)=>{
  const submitAss = req.body;
  console.log(submitAss);
  const result = await submitCollection.insertOne(submitAss);
  res.send(result)
})




// get submit assignment for specific user
app.get('/submit/:email', verifyToken, async(req, res)=>{
  const token = req.cookies?.token
  if(token){
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
      if(err){
        return console.log(err);
      }
      console.log(decoded);
    })
  }
  console.log(token);
  const email = req.params.email;
  const query = {email : email }
  const result = await submitCollection.find({}).toArray()
  res.send(result);
})

    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
 
  }
}
run().catch(console.dir);






app.listen(port, ()=>{
    console.log(`assignment server is running port ${port}`);
})