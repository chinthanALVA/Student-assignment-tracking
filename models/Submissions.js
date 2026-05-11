const mongoose = require('mongoose')

const submissionSchema = new mongoose.Schema(
    {
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Assignment',           // links to Assignment model
            required: [true, 'Assignment ID is required']
        },
        studentName: {
            type: String,
            required: [true, 'Student name is required']
        },
        content: {
            type: String,
            required: [true, 'Submission content is required']
        },
        status: {
            type: String,
            enum: ['pending', 'active'],
            default: 'pending'   // starts as pending before submitting
        },
        submittedAt: {
            type: Date,
            default: Date.now   // auto timestamp when submitted
        }
    },
    { timestamps: true }
)

module.exports = mongoose.model('Submission', submissionSchema)
