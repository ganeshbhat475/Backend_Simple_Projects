const path = require('path')
const http = require('http')
const express = require('express')
const { Server } = require('socket.io')
const { Filter } = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
// Share one HTTP server between the static site and Socket.IO.
const server = http.createServer(app)
const io = new Server(server)
// Keep one filter instance instead of rebuilding it for every message.
const profanityFilter = new Filter()

const port = Number(process.env.PORT) || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New Socket.IO connection')

    socket.on('join', async (options, callback) => {
        if (getUser(socket.id)) {
            if (typeof callback === 'function') callback('You have already joined a room.')
            return
        }

        try {
            await socket.join(user.room)
        } catch (error) {
            removeUser(socket.id)
            console.error('Could not join Socket.IO room:', error.message)
            if (typeof callback === 'function') callback('Could not join the room. Please try again.')
            return
        }

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        if (typeof callback === 'function') callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        if (!user) {
            if (typeof callback === 'function') callback('Join a room before sending messages.')
            return
        }

        if (typeof message !== 'string' || !message.trim() || message.length > 1000) {
            if (typeof callback === 'function') callback('Messages must be between 1 and 1000 characters.')
            return
        }

        if (profanityFilter.isProfane(message)) {
            if (typeof callback === 'function') callback('Profanity is not allowed!')
            return
        }

        io.to(user.room).emit('message', generateMessage(user.username, message.trim()))
        if (typeof callback === 'function') callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        if (!user) {
            if (typeof callback === 'function') callback('Join a room before sharing your location.')
            return
        }

        const { latitude, longitude } = coords || {}
        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            if (typeof callback === 'function') callback('A valid location is required.')
            return
        }

        const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, mapUrl))
        if (typeof callback === 'function') callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})