const path = require('path')
// Load project-local environment settings before reading database configuration.
require('dotenv').config({ path: path.join(__dirname, '.env') })

const express = require('express')
const hbs = require('hbs')
const { MongoClient, ObjectId } = require('mongodb')

const app = express()
const port = Number(process.env.PORT) || 3000
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const databaseName = process.env.MONGODB_DATABASE || 'task_app'
const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 })
let tasks

// Use hbs to render .hbs templates from the views directory.
app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: false, limit: '10kb' }))
app.use(express.static(path.join(__dirname, 'public')))

const getTasks = async () => {
    const documents = await tasks.find({}).sort({ createdAt: -1, _id: -1 }).toArray()
    return documents.map((task) => ({
        ...task,
        id: task._id.toString(),
        createdAtLabel: task.createdAt.toLocaleString()
    }))
}

const renderHome = async (res, statusCode = 200, options = {}) => {
    const taskList = await getTasks()
    return res.status(statusCode).render('index', {
        title: 'MongoDB Task Board',
        tasks: taskList,
        ...options
    })
}

const renderError = (res, statusCode, message) => res.status(statusCode).render('error', {
    title: statusCode === 404 ? 'Not found' : 'Something went wrong',
    message
})

const getObjectId = (value) => ObjectId.isValid(value) ? new ObjectId(value) : null

app.get('/', async (req, res) => {
    try {
        await renderHome(res)
    } catch (error) {
        console.error('Could not load tasks:', error.message)
        renderError(res, 500, 'Tasks could not be loaded. Check that MongoDB is running and try again.')
    }
})

app.post('/tasks', async (req, res) => {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : ''

    if (!title || title.length > 120 || description.length > 1000) {
        const message = !title
            ? 'Enter a task title.'
            : 'Titles must be 120 characters or fewer and descriptions 1,000 characters or fewer.'
        try {
            await renderHome(res, 400, { error: message, form: { title, description } })
        } catch (error) {
            console.error('Could not load tasks after invalid task input:', error.message)
            renderError(res, 500, 'Tasks could not be loaded. Check that MongoDB is running and try again.')
        }
        return
    }

    try {
        await tasks.insertOne({
            title,
            description,
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        res.redirect(303, '/')
    } catch (error) {
        console.error('Could not create task:', error.message)
        renderError(res, 500, 'The task could not be saved. Please try again.')
    }
})

app.get('/tasks/:id/edit', async (req, res) => {
    const id = getObjectId(req.params.id)
    if (!id) {
        renderError(res, 404, 'That task could not be found.')
        return
    }

    try {
        const task = await tasks.findOne({ _id: id })
        if (!task) {
            renderError(res, 404, 'That task could not be found.')
            return
        }
        res.render('edit', {
            title: 'Edit task',
            task: { ...task, id: task._id.toString() }
        })
    } catch (error) {
        console.error('Could not load task for editing:', error.message)
        renderError(res, 500, 'The task could not be loaded. Please try again.')
    }
})

app.post('/tasks/:id/edit', async (req, res) => {
    const id = getObjectId(req.params.id)
    if (!id) {
        renderError(res, 404, 'That task could not be found.')
        return
    }

    const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : ''
    if (!title || title.length > 120 || description.length > 1000) {
        try {
            const task = await tasks.findOne({ _id: id })
            if (!task) {
                renderError(res, 404, 'That task could not be found.')
                return
            }
            res.status(400).render('edit', {
                title: 'Edit task',
                task: { ...task, id: task._id.toString(), title, description },
                error: !title
                    ? 'Enter a task title.'
                    : 'Titles must be 120 characters or fewer and descriptions 1,000 characters or fewer.'
            })
        } catch (error) {
            console.error('Could not load task after invalid edit input:', error.message)
            renderError(res, 500, 'The task could not be loaded. Please try again.')
        }
        return
    }

    try {
        const result = await tasks.updateOne(
            { _id: id },
            { $set: { title, description, updatedAt: new Date() } }
        )
        if (!result.matchedCount) {
            renderError(res, 404, 'That task could not be found.')
            return
        }
        res.redirect(303, '/')
    } catch (error) {
        console.error('Could not update task:', error.message)
        renderError(res, 500, 'The task could not be updated. Please try again.')
    }
})

app.post('/tasks/:id/toggle', async (req, res) => {
    const id = getObjectId(req.params.id)
    if (!id) {
        renderError(res, 404, 'That task could not be found.')
        return
    }

    try {
        const task = await tasks.findOne({ _id: id })
        if (!task) {
            renderError(res, 404, 'That task could not be found.')
            return
        }

        const result = await tasks.updateOne(
            { _id: id, completed: task.completed },
            { $set: { completed: !task.completed, updatedAt: new Date() } }
        )
        if (!result.modifiedCount) {
            renderError(res, 409, 'The task changed while you were updating it. Refresh and try again.')
            return
        }
        res.redirect(303, '/')
    } catch (error) {
        console.error('Could not update task status:', error.message)
        renderError(res, 500, 'The task status could not be changed. Please try again.')
    }
})

app.post('/tasks/:id/delete', async (req, res) => {
    const id = getObjectId(req.params.id)
    if (!id) {
        renderError(res, 404, 'That task could not be found.')
        return
    }

    try {
        const result = await tasks.deleteOne({ _id: id })
        if (!result.deletedCount) {
            renderError(res, 404, 'That task could not be found.')
            return
        }
        res.redirect(303, '/')
    } catch (error) {
        console.error('Could not delete task:', error.message)
        renderError(res, 500, 'The task could not be deleted. Please try again.')
    }
})

app.use((req, res) => renderError(res, 404, 'That page could not be found.'))

const start = async () => {
    try {
        await client.connect()
        const database = client.db(databaseName)
        tasks = database.collection('tasks')
        await tasks.createIndex({ createdAt: -1 })

        app.listen(port, () => {
            console.log(`Task app is running at http://localhost:${port}`)
            console.log(`Connected to MongoDB database "${databaseName}".`)
        })
    } catch (error) {
        console.error('Could not start the task app:', error.message)
        await client.close().catch((closeError) => {
            console.error('Could not close MongoDB client:', closeError.message)
        })
        process.exitCode = 1
    }
}

const shutdown = async () => {
    try {
        await client.close()
        process.exit(0)
    } catch (error) {
        console.error('Could not close MongoDB client:', error.message)
        process.exitCode = 1
    }
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)

start()
