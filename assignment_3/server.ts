const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cookieParser = require('cookie-parser');
const uuidv4 = require('uuid/v4');
const compadre = require('compadre');

const port = 8000;

const MAX_STACK_SIZE = 200;
const messageStack = [];
const users = {};

app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.get('/init', (req, res) => {
  const existingUser = users[req.cookies.userId];
  if (existingUser) {
    users[existingUser.userId].active = true;
    res.send(JSON.stringify(existingUser));
  } else {
    const nameGenerator = new compadre();
    let nickname = nameGenerator.generate();
    while (Object.values(users).find((user) => user.nickname === nickname)) {
      nickname = nameGenerator.generate();
    }

    const newUser = {
      nickname,
      userId: uuidv4(),
      nameColour: Math.round(0xffffff * Math.random()).toString(16).padStart(6, '0'),
      active: true
    };

    users[newUser.userId] = newUser;

    res.cookie('userId', newUser.userId, { maxAge: 60 * 60 * 1000 });
    res.send(JSON.stringify(newUser));
  }
});


io.on('connection', (socket) => {
  io.emit('sync_state', messageStack, users);

  socket.on('init', (userId) => {
    users[userId]['socketId'] = socket.id;
  });

  socket.on('update_user', (usr) => {
    usr.active = true;
    users[usr.userId] = usr;
    io.emit('sync_state', messageStack, users);
  });

  socket.on('sync_state', () => {
    io.emit('sync_state', messageStack, users);
  });

  socket.on('message', (msg) => {
    const nicknameUpdatePattern = /^(\/nick )/
    const nicknameColourUpdatePattern = /^(\/nickcolor )/

    const parsedMsg = msg;
    parsedMsg.timestamp = new Date().getTime();

    if (nicknameUpdatePattern.test(msg.message)) {
      const newNickname = msg.message.substring(msg.message.indexOf(' ') + 1);
      const nicknameExists = Object.values(users).some((user) => user.nickname === newNickname);

      if (nicknameExists) {
        socket.emit('bad_value', `A user with the nickname '${newNickname}' already exists.`);
      } else {
        users[msg.userId].nickname = newNickname;
        io.emit('sync_state', messageStack, users);
      }
    } else if (nicknameColourUpdatePattern.test(msg.message)) {
      const newNickColour = parseInt(msg.message.substring(msg.message.indexOf(' ') + 1), 16);
      if (isNaN(newNickColour)) {
        socket.emit('bad_value', "Nickname color must be a hex number.");
      } else {
        users[msg.userId].nameColour = newNickColour.toString(16).padStart(6, '0');
        io.emit('sync_state', messageStack, users);
      }
    }else {
      if (messageStack.length === MAX_STACK_SIZE) {
        messageStack.shift();
      }
      messageStack.push(parsedMsg);
      const user = users[parsedMsg.userId];
      if (user) {
        users[user.userId] = user;
      }
      io.emit('sync_state', messageStack, users);
    }
  });

  socket.on('disconnect', (reason) => {
    const disconnectedUser = Object.values(users).find((user) => user.socketId === socket.id);
    if (disconnectedUser) {
      users[disconnectedUser.userId].active = false;
    }
    io.emit('sync_state', messageStack, users);
  });
});

server.listen(port);
console.log('listenting on port ', port);
