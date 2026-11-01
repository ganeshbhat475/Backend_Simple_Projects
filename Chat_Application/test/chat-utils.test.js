const test = require('node:test')
const assert = require('node:assert/strict')
const { addUser, getUser, getUsersInRoom, removeUser } = require('../src/utils/users')
const { generateMessage, generateLocationMessage } = require('../src/utils/messages')

test('users are normalized and listed by room', () => {
    const first = addUser({ id: 'test-user-1', username: '  Riley ', room: ' Team ' })
    const second = addUser({ id: 'test-user-2', username: 'Morgan', room: 'team' })
    const otherRoom = addUser({ id: 'test-user-3', username: 'Casey', room: 'other' })

    assert.equal(first.user.username, 'riley')
    assert.equal(first.user.room, 'team')
    assert.equal(second.user.username, 'morgan')
    assert.deepEqual(getUsersInRoom(' TEAM ').map((user) => user.username), ['riley', 'morgan'])
    assert.deepEqual(getUsersInRoom('other').map((user) => user.username), ['casey'])

    removeUser(first.user.id)
    removeUser(second.user.id)
    removeUser(otherRoom.user.id)
})

test('invalid, overlong, and duplicate users are rejected', () => {
    assert.match(addUser({ id: 'empty', username: ' ', room: 'team' }).error, /required/)
    assert.match(addUser({ id: 'missing', username: null, room: 'team' }).error, /required/)
    assert.match(addUser({ id: 'long-name', username: 'a'.repeat(31), room: 'team' }).error, /30 characters/)
    assert.match(addUser({ id: 'long-room', username: 'riley', room: 'a'.repeat(51) }).error, /50 characters/)

    const original = addUser({ id: 'duplicate-1', username: 'Riley', room: 'team' })
    assert.match(addUser({ id: 'duplicate-2', username: ' rIlEy ', room: ' TEAM ' }).error, /in use/)
    assert.equal(getUser('duplicate-1'), original.user)
    removeUser('duplicate-1')
})

test('message helpers return the expected message shapes', () => {
    const message = generateMessage('Riley', 'Hello')
    const locationMessage = generateLocationMessage('Riley', 'https://www.google.com/maps?q=1,2')

    assert.equal(message.username, 'Riley')
    assert.equal(message.text, 'Hello')
    assert.equal(typeof message.createdAt, 'number')
    assert.equal(locationMessage.username, 'Riley')
    assert.equal(locationMessage.url, 'https://www.google.com/maps?q=1,2')
    assert.equal(typeof locationMessage.createdAt, 'number')
})
