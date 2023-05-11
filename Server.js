//create a server using express? 
const express = require('express')
const cors=require('cors');
const fetchAllMatches = require('./API/fetchData');
const run = require('./Model/Model');

const app = express();
const PORT=8080;
app.use(cors('*'));
app.use(express.json({limit:'200mb'}))
app.use(express.urlencoded({limit:'200mb', extended:true}))


app.get('/fetchData',fetchAllMatches);
app.get('/teachModel',run);
app.get('/', function (req, res) {
  res.send('bet like a pro ::::;powered by glennin technology')
})
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });