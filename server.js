const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()

const assignmentRoutes = require('./routes/assignments')
const submissionRoutes = require('./routes/submissions')
const logger = require('./middleware/logger')

const app = express()
const PORT = process.env.PORT || 8080

// Middleware
app.use(express.json())       // parse JSON request bodies
app.use(logger)               // log all incoming requests

// Routes
app.use('/assignments', assignmentRoutes)
app.use('/submissions', submissionRoutes)

// Home route
app.get('/', (req, res) => {
    res.send('Assignment Tracker API is Running!')
})

// Connect to MongoDB then start server
async function startServer() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ MongoDB Connected Successfully')

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`)
        })
    } catch (err) {
        console.log('❌ MongoDB Connection Error:', err.message)
        process.exit(1)   // stop the app if DB fails
    }
}

startServer()
