const mongoose = require('mongoose')

const assignmentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required']
        },
        subject: {
            type: String,
            required: [true, 'Subject is required']
        },
        description: {
            type: String,
            required: [true, 'Description is required']
        },
        dueDate: {
            type: Date,
            required: [true, 'Due date is required']
        },
        status: {
            type: String,
            enum: ['active', 'closed'],
            default: 'active'   // auto set to active on creation
        }
    },
    { timestamps: true }  // adds createdAt and updatedAt automatically
)

module.exports = mongoose.model('Assignment', assignmentSchema)
