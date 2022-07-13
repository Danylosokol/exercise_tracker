require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
let bodyParser = require("body-parser");
let mongoose = require("mongoose");
mongoose.connect(process.env['MONGO_URI'], {useNewUrlParser: true, useUnifiedTopology: true});

const Schema = mongoose.Schema;

let userSchema = new Schema({
  username: {type: String, required: true}
});
const User = mongoose.model("User", userSchema);

let exerciseSchema = new Schema({
  userId: {type: String, required: true},
  date: {type: Date, reqiured: true},
  duration: {type: Number, reqiured: true},
  description: {type: String, reqiured: true}
});
const Exercise = mongoose.model("Exercise", exerciseSchema);


app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extend:false}));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.route('/api/users').post(function(req, res){
  //console.log(req.body.username);
  let newUser = new User({
    username: req.body.username
  });

  newUser.save(function(err, data){
    if(err){
      console.log(err);
    }else{
      res.json({username: data.username, _id: data._id});
    }
  });
}).get(function(req, res){
  User.find(function(err, data){
    if(err){
      console.log(err);
    }else{
      let users = [];
      for(let i in data){
        let user = {
          username: data[i].username,
          _id: data[i]._id
        }
        users.push(user);
      }
      res.send(users);
    }
  })
})

app.post('/api/users/:_id/exercises', function(req, res){
  console.log(req.params._id);
  // console.log(req.body.description);
  // console.log(req.body.duration);
  User.findById(req.params._id, function(err, data){
    if(err){
      console.log(err);
    }else{
      // console.log(data.username);
      const username = data.username;
      let date = req.body.date;
      if (date === "" || date === undefined) {
        date = new Date();
      }

      let newExercise = new Exercise({
        userId: req.params._id,
        date: date,
        duration: req.body.duration,
        description: req.body.description
      });

      newExercise.save(function(err, data){
        if(err){
          console.log(err);
        }else{
          //console.log(data);
          res.json({
            _id: data.userId,
            username: username,
            date: data.date.toDateString(),
            duration: data.duration,
            description: data.description
          });
        }
      });
    }
  });
});

app.get('/api/users/:_id/logs', function(req, res){
  //console.log(req.params.id);
  let fromDate = req.query.from;
  if(fromDate !== undefined){
    fromDate = new Date(fromDate);
    //console.log(fromDate);
  }

  let toDate = req.query.to;
  if(toDate !== undefined){
    toDate = new Date(toDate);
    //console.log(toDate);
  }
  let limit = req.query.limit;
  //console.log(limit);
  User.findById(req.params._id, function(err, data){
    if(err){
      console.log(err);
    }else{
      const username = data.username;
      const _id = data._id;
      Exercise.find({userId: data._id}, function(err, data){
        if(err){
          console.log(err);
        }else{
          //console.log(data[0]);
          let resultObj = {
            username: username,
            count: data.length,
            _id: _id,
            log: []
          }
          for(let i in data){
            if(limit === undefined || resultObj.log.length < limit){
              if(fromDate === undefined || data[i].date > fromDate){
                if(toDate === undefined || data[i].date < toDate){
                  let exerciseObj = {
                    description: data[i].description,
                    duration: data[i].duration,
                    date: data[i].date.toDateString(),
                  };
                  resultObj.log.push(exerciseObj);
                }
              }
            }
          }
          res.json(resultObj);
        }
      });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
