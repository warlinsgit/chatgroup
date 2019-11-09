//1  https://www.youtube.com/watch?v=UymGJnv-WsE&t=8s
const express = require('express');
const app = express();

const server = require('http').Server(app)

const io = require('socket.io')(server)

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true }))

const rooms = { }

app.get('/', (req, res) => {
  res.render('index', { rooms: rooms });
})

app.post('/room', (req, res) => {
  if(rooms[req.body.room] != null){
    return res.redirect('/')
  }
  rooms[req.body.room] = { users: {} }
  res.redirect(req.body.room)

  //send message that new room was created
  io.emit('room-created', req.body.room);
})

app.get('/:room', (req, res) => {
  if(rooms[req.params.room] == null){
    return res.redirect('/');
  }
  res.render('room', {roomName: req.params.room })
})



server.listen(3000)

//const users = {}
//2
io.on('connection', socket => {
  //  console.log('new user');
  //3 socket.emit('chat-message', 'Hello warley');
  socket.on('new-user', (room, name) => {
      socket.join(room);
      rooms[room].users[socket.id] = name
      socket.to(room).broadcast.emit('user-connected', name)
  })


  //socket.emit('chat-message', 'Hello Warley')
  socket.on('send-chat-message', (room,message) => {
  //console.log(message);
  socket.to(room).broadcast.emit('chat-message',{ message: message, name:rooms[room].users[socket.id]});
  })

  socket.on('disconnect', () => {
    getUserRooms(socket).forEach(room => {
      socket.to(room).broadcast.emit('user-disconnect', rooms[room].users[socket.id]);
      delete rooms[room].users[socket.id];
    })

  })
})

function getUserRooms(socket){
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if(room.users[socket.id] != null)  names.push(name)
    return names
  }, [])
}
