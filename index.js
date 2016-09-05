var app = require('express')();
var moment = require('moment');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
usernames = [];
moment().format();

mongoose.connect('mongodb://localhost/chat', function(err){
    if(err){
        console.log(err);
    }
    else{
        console.log("database connected!")
    }
});

var chatschema = mongoose.Schema({
    name: String,
    msg: String,
    created: {type: Date, default: Date.now}   
});

var Chat = mongoose.model('Message', chatschema);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

http.listen(process.env.PORT || 3000);
console.log('Server running on 3000!!');


io.on('connection', function(socket){
    Chat.find({},function(err, docs){
         if(err) throw err;
         socket.emit('load old msgs', docs);
    });

socket.on('new user', function(data, callback){
        if(usernames.indexOf(data) != -1)
        	callback(false);
        else
        {
        	callback(true);
        	socket.name = data;
        	usernames.push(socket.name);

        }
	});

socket.on('chat message', function(data){
        var newMsg = new Chat({msg: data.trim(), name: socket.name});
        newMsg.save(function(err){
              if(err) throw err;
              io.emit('chat message', { msg: data, name: socket.name });
    
        });
    }); 

socket.on('disconnect', function(data){
       if(!socket.name)
           return;
       console.log( 'user  disconnected');
       usernames.splice(usernames.indexOf(socket.name), 1); 
       io.emit('userleft', socket.name);

    });
});


