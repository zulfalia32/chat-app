const path = require ('path')
const http = require('http')
const express = require ('express')
const socketio = require ('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage}= require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require ('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)


const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection',(socket)=>{   // connection is the name of the event
    console.log('New Websocket connection')

    // socket.emit('message', generateMessage('Welcome!')) 
    // socket.broadcast.emit('message', generateMessage('A new user has joined!'))

    socket.on('join', ({username, room},callback)=>{
        const {error, user} = addUser({ id : socket.id, username, room})

        if (error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin','Welcome!')) 
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
        //socket.emit, io.emit, socket.broadcast.emit
        //io.to.emit, socket.broadcast.to.emit
    })


    socket.on('sendMessage', (messageFromClient, callback)=>{
        const filter = new Filter()
        const user = getUser(socket.id)

        if (filter.isProfane(messageFromClient)){
            return callback('Profanity is not allowed')
        }
        
        io.to(user.room).emit('message', generateMessage(user.username,messageFromClient))  
        callback()        
    })


    socket.on('sendLocation', (coords, callback)=>{
        //io.emit('locationMessage', `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
               
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }  
    })

})

server.listen(port, ()=>{
      console.log(`Server is up on port ${port}!`)
})