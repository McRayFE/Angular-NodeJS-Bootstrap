/**
 * Created by 佳锐 on 2017/4/22.
 */
var express = require('express'); //引入express
var app = require('express')(); //实例化express
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public')); //设置静态文件目录

app.get('/', function(req, res) {
  res.sendfile('index.html');
}); //处理根目录下的请求，响应，发送index.html文件给客户端

var connectedSockets = {}; //存放客户端连接的socket实例
var allUsers = [{
  nickname: "",
  color: "#000"
}]; //保存所有用户
io.on('connection', function(socket) { //监听客户端连接事件
  /*addUser事件由客户端输入昵称后触发，服务端收到后，进行判断*/
  socket.on('addUser', function(data) {
    if (connectedSockets[data.nickname]) {
      /*如果已经存在，通过触发客户端的userAddingResult事件，通知客户端无效*/
      socket.emit('userAddingResult', {
        result: false
      });
    } else {
      /*如果不存在，触发客户端的userAddingResult事件，设置*/
      socket.emit('userAddingResult', {
        result: true
      });
      socket.nickname = data.nickname;
      connectedSockets[socket.nickname] = socket; /*保存每一个socket实例，发私信要用到*/
      allUsers.push(data);
      socket.broadcast.emit('userAdded', data); /*通过触发客户端的userAdded事件，广播欢迎新用户，除了新用户，其他用户都可以看到*/
      socket.emit('allUser', allUsers); /*通过触发客户端的allUser事件，将所有在线用户，发给新用户*/
    }
  });
  /*监听用户发送新信息，分为群发和私聊，接受客户端传过来的数据，判断*/
  socket.on('addMessage', function(data) {
    if (data.to) {
      /*如果是私聊，只有一个实例触发客户端的messageAdded实例*/
      connectedSockets[data.to].emit('messageAdded', data);
    } else {
      /*如果是群聊，广播告诉所有用户*/
      socket.broadcast.emit('messageAdded', data);
    }
  });
  /*监听用户退出事件*/
  socket.on('disconnect', function() {
    /*通过触发客户端的userRemoved，广播所有用户*/
    socket.broadcast.emit('userRemoved', {
      nickname: socket.nickname
    });
    /*将该用户从存放全部用户的allUsers数组中删除掉*/
    for (var i = 0; i < allUsers.length; i++) {
      if (allUsers[i].nickname === socket.nickname) {
        allUsers.splice(i, 1);
      }
    }
    /*删除用户对应的socket实例*/
    delete connectedSockets[socket.nickname];
  });
});

http.listen(3002, function() {
  console.log('listening on *:3002');
});
