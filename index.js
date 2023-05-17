const express = require('express')
const app = express()
const cors=require('cors')
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config()

const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())


console.log(process.env.DB_USER,'user nameeeeeeeee');


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h7ejkv0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT=(req,res,next)=>{
    console.log('hitting verify jwt');
    console.log(req.headers.authorization);
    const authorization=req.headers.authorization;
    if(!authorization){
        return res.status(401).send({error:true,message:'unauthorized user'})

    }
    const token=authorization.split(' ')[1]
    console.log(token,'check token inside ');
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRECT, (err, decoded)=> {
       if(err){
            return res.status(401).send({error:true,message:'unauthorized user'})
       }
       req.decoded=decoded;
       next()
      });
}

async function run() {
  try {

    await client.connect();

    const serviceCollection=client.db('carRevDoc').collection('services')
    const customerCollection=client.db('carRevDoc').collection('customers')


    // jwt

    app.post('/jwt',(req,res)=>{
        const user=req.body;
        console.log(user);
        const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRECT,{
            expiresIn: '10h'});
            res.send({token})
       
        
    
    })

    // jwt end

    // methods start

// get method for all data
app.get('/services',async(req,res)=>{
    const cursor=serviceCollection.find()
    const result=await cursor.toArray()
    res.send(result)

})

// get for specific data

app.get('/services/:id',async(req,res)=>{
    const id=req.params.id
    const query={_id:new ObjectId(id)}

    const options = {
       
        // Include only the `title` and `imdb` fields in the returned document
        projection: { title: 1,img:1,price:1,service_id:1},
      };
    
    const result=await serviceCollection.findOne(query,options)
    res.send(result)

})


// checkout db for post===customers
app.post('/customers',async(req,res)=>{
    const newCustomers=req.body;
    console.log(newCustomers);
   
    const result=await customerCollection.insertOne(newCustomers)
    res.send(result)

})

// some data 
app.get('/customers', verifyJWT, async(req,res)=>{
    // console.log(req.query.email)
    // console.log(req.headers.authorization)
    const decoded=req.decoded;
    console.log('came back after verify',decoded);

if(decoded.customerEmail!==req.query.customerEmail){
    return res.status(403).send({error:1,message:'not allowed'})
}

    let query={}
    if(req.query?.customerEmail){
        query={customerEmail:req.query.customerEmail}
        // console.log(query.email,'qqqq')
    }
    const result=await customerCollection.find(query).toArray()
    res.send(result)

})


app.delete('/customers/:id',async(req,res)=>{
    const id=req.params.id
    const query={_id:new ObjectId(id)}
    const result=await customerCollection.deleteOne(query)

    res.send(result)


})
app.patch('/customers/:id',async(req,res)=>{
    // console.log(updatedCustomers);
    const id=req.params.id
    const query={_id:new ObjectId(id)}
    const updatedCustomers=req.body;
    console.log(updatedCustomers);
    const updateDoc = {
        $set: {
          status: updatedCustomers.status
        },
      };
  
      const result=await customerCollection.updateOne(query,updateDoc)

      res.send(result)


})



    // methods end
   
   
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
  res.send('Hello World car doc!')
})

app.listen(port, () => {
  console.log(`car doc listening on port ${port}`)
})