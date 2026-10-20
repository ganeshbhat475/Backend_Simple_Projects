const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('#message-input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')
const $connectionStatus = document.querySelector('#connection-status')
const $chatError = document.querySelector('#chat-error')

const query = new URLSearchParams(window.location.search)
const username = query.get('username')
const room = query.get('room')
let hasJoinedRoom = false

const showError = (message, includeJoinLink = false) => {
    $chatError.replaceChildren(document.createTextNode(message))
    if (includeJoinLink) {
        $chatError.append(' ')
        const link = document.createElement('a')
        link.href = '/'
        link.textContent = 'Return to the join page.'
        $chatError.append(link)
    }
    $chatError.hidden = false
}

const clearError = () => {
    $chatError.hidden = true
    $chatError.replaceChildren()
}

const updateControls = () => {
    const disabled = !socket.connected || !hasJoinedRoom
    $messageFormButton.disabled = disabled
    $messageFormInput.disabled = disabled
    $sendLocationButton.disabled = disabled
}

const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit'
    }).format(date)
}

const createMessage = (username, timestamp) => {
    const date = new Date(timestamp)
    const message = document.createElement('article')
    message.className = 'message'

    const header = document.createElement('p')
    const name = document.createElement('span')
    name.className = 'message__name'
    name.textContent = username || 'Unknown user'

    const time = document.createElement('time')
    time.className = 'message__meta'
    if (!Number.isNaN(date.getTime())) time.dateTime = date.toISOString()
    time.textContent = formatTime(timestamp)

    header.append(name, time)
    message.append(header)
    return message
}

const appendMessage = (data) => {
    if (
        !data ||
        typeof data.username !== 'string' ||
        !Number.isFinite(data.createdAt) ||
        Number.isNaN(new Date(data.createdAt).getTime())
    ) return

    const shouldScroll = $messages.scrollHeight - $messages.scrollTop - $messages.clientHeight < 80
    const message = createMessage(data.username, data.createdAt)
    const text = document.createElement('p')
    text.textContent = typeof data.text === 'string' ? data.text : ''
    message.append(text)
    $messages.append(message)

    if (shouldScroll) $messages.scrollTop = $messages.scrollHeight
}

const appendLocationMessage = (data) => {
    if (
        !data ||
        typeof data.username !== 'string' ||
        !Number.isFinite(data.createdAt) ||
        Number.isNaN(new Date(data.createdAt).getTime())
    ) return

    const shouldScroll = $messages.scrollHeight - $messages.scrollTop - $messages.clientHeight < 80
    const message = createMessage(data.username, data.createdAt)
    const text = document.createElement('p')
    let link
    try {
        const url = new URL(data.url)
        if (url.protocol === 'https:' && url.hostname === 'www.google.com' && url.pathname === '/maps') {
            link = document.createElement('a')
            link.href = url.href
            link.target = '_blank'
            link.rel = 'noopener noreferrer'
            link.textContent = 'View shared location'
        }
    } catch {
        link = null
    }

    text.textContent = link ? '' : 'A location was shared.'
    if (link) text.append(link)
    message.append(text)
    $messages.append(message)

    if (shouldScroll) $messages.scrollTop = $messages.scrollHeight
}

// Render dynamic values as text so names and messages are never treated as HTML.
const renderRoomData = (data) => {
    if (!data || typeof data.room !== 'string' || !Array.isArray(data.users)) return

    const title = document.createElement('h2')
    title.className = 'room-title'
    title.textContent = data.room

    const heading = document.createElement('h3')
    heading.className = 'list-title'
    heading.textContent = 'People here'

    const list = document.createElement('ul')
    list.className = 'users'
    data.users.forEach((user) => {
        if (!user || typeof user.username !== 'string') return
        const item = document.createElement('li')
        item.textContent = user.username
        list.append(item)
    })

    $sidebar.replaceChildren(title, heading, list)
}

// Keep text as text, rather than inserting user content as HTML.
socket.on('message', appendMessage)
socket.on('locationMessage', appendLocationMessage)
socket.on('roomData', renderRoomData)

socket.on('connect', () => {
    $connectionStatus.textContent = 'Connected. Joining room…'
    clearError()
    hasJoinedRoom = false
    updateControls()

    // Socket.IO gives a reconnected socket a new room membership, so join again.
    socket.timeout(5000).emit('join', { username, room }, (timeoutError, serverError) => {
        if (timeoutError || serverError) {
            $connectionStatus.textContent = 'Could not join the room.'
            showError(timeoutError ? 'The server did not respond while joining.' : serverError, true)
            updateControls()
            return
        }

        hasJoinedRoom = true
        $connectionStatus.textContent = `Connected to ${room}.`
        updateControls()
        $messageFormInput.focus()
    })
})

socket.on('disconnect', () => {
    hasJoinedRoom = false
    $connectionStatus.textContent = 'Connection lost. Reconnecting…'
    updateControls()
})

socket.on('connect_error', (error) => {
    $connectionStatus.textContent = 'Unable to connect. Retrying…'
    showError(`Connection problem: ${error.message}`)
})

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault()
    const message = $messageFormInput.value.trim()
    if (!message || !hasJoinedRoom) return

    $messageFormButton.disabled = true
    socket.timeout(5000).emit('sendMessage', message, (timeoutError, serverError) => {
        updateControls()
        if (timeoutError || serverError) {
            showError(timeoutError ? 'The message could not be sent. Please try again.' : serverError)
            return
        }

        clearError()
        $messageFormInput.value = ''
        $messageFormInput.focus()
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        showError('Location sharing is not supported by this browser.')
        return
    }
    if (!hasJoinedRoom) return

    $sendLocationButton.disabled = true
    navigator.geolocation.getCurrentPosition((position) => {
        socket.timeout(5000).emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (timeoutError, serverError) => {
            updateControls()
            if (timeoutError || serverError) {
                showError(timeoutError ? 'The location could not be shared. Please try again.' : serverError)
                return
            }
            clearError()
        })
    }, (error) => {
        updateControls()
        showError(`Could not get your location: ${error.message}`)
    }, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
    })
})

updateControls()
