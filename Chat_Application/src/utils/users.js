const users = []

const addUser = ({ id, username, room }) => {
    username = typeof username === 'string' ? username.trim().toLowerCase() : ''
    room = typeof room === 'string' ? room.trim().toLowerCase() : ''

    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }

    if (username.length > 30 || room.length > 50) {
        return {
            error: 'Username must be 30 characters or fewer and room must be 50 characters or fewer.'
        }
    }

    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    if (existingUser) {
        return {
            error: 'Username is in use!'
        }
    }

    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)

    if (index !== -1) {
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
    if (typeof room !== 'string') return []
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}