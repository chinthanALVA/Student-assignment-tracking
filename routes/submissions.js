const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Submission = require('../models/Submissions')
const Assignment = require('../models/Assignments')

// ─────────────────────────────────────────────
// POST /submissions — Submit an assignment
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { assignmentId, studentName, content } = req.body

        // Basic validation
        if (!assignmentId || !studentName || !content) {
            return res.status(400).json({ message: 'assignmentId, studentName, and content are required' })
        }

        // Normalize and validate assignment id
        const normalizeId = (val) => {
            if (mongoose.Types.ObjectId.isValid(val)) return val
            const m = String(val).match(/[0-9a-fA-F]{24}/)
            return m ? m[0] : null
        }

        const cleanAssignmentId = normalizeId(assignmentId)
        if (!cleanAssignmentId) return res.status(400).json({ message: 'Invalid assignmentId format' })

        // Check if assignment exists
        const assignment = await Assignment.findById(cleanAssignmentId)
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' })
        }

        // Check if assignment is still active (not past due date)
        if (new Date() > assignment.dueDate) {
            assignment.status = 'closed'
            await assignment.save()
            return res.status(400).json({ message: '❌ Deadline passed. Submissions are closed for this assignment.' })
        }

        if (assignment.status === 'closed') {
            return res.status(400).json({ message: '❌ This assignment is closed. No more submissions allowed.' })
        }

        // Create submission with status 'pending' initially
        const submission = new Submission({
            assignmentId,
            studentName,
            content,
            status: 'pending'
        })
        const saved = await submission.save()

        res.status(201).json({ message: '✅ Submission successful (pending)', submission: saved })

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message })
    }
})

// ─────────────────────────────────────────────
// GET /submissions — Get all submissions
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const submissions = await Submission.find()
            .populate('assignmentId', 'title subject dueDate')  // joins assignment details
            .sort({ submittedAt: -1 })

        res.status(200).json({ count: submissions.length, submissions })

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message })
    }
})

// ─────────────────────────────────────────────
// PUT /submissions/:id — Update a submission
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
    try {
        const normalizeId = (val) => {
            if (mongoose.Types.ObjectId.isValid(val)) return val
            const m = String(val).match(/[0-9a-fA-F]{24}/)
            return m ? m[0] : null
        }

        const id = normalizeId(req.params.id)
        if (!id) return res.status(400).json({ message: 'Invalid id format' })

        const { assignmentId, studentName, content, status } = req.body

        // Build update object only with provided fields
        const update = {}
        if (assignmentId) {
            const cleanAssignmentId = normalizeId(assignmentId)
            if (!cleanAssignmentId) return res.status(400).json({ message: 'Invalid assignmentId format' })
            const assignment = await Assignment.findById(cleanAssignmentId)
            if (!assignment) return res.status(404).json({ message: 'Assignment not found' })
            update.assignmentId = cleanAssignmentId
        }
        if (studentName) update.studentName = studentName
        if (content) update.content = content
        if (status) {
            // Only allow status to change from 'pending' to 'active'
            if (status !== 'pending' && status !== 'active') {
                return res.status(400).json({ message: 'Status must be pending or active' })
            }
            update.status = status
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided to update' })
        }

        const updated = await Submission.findByIdAndUpdate(id, update, { new: true, runValidators: true })
        if (!updated) return res.status(404).json({ message: 'Submission not found' })

        res.status(200).json({ message: 'Submission updated', submission: updated })

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message })
    }
})

// ─────────────────────────────────────────────
// GET /submissions/assignment/:assignmentId
// Get all submissions for a specific assignment
// ─────────────────────────────────────────────
router.get('/assignment/:assignmentId', async (req, res) => {
    try {
        const normalizeId = (val) => {
            if (mongoose.Types.ObjectId.isValid(val)) return val
            const m = String(val).match(/[0-9a-fA-F]{24}/)
            return m ? m[0] : null
        }

        const cleanAssignmentId = normalizeId(req.params.assignmentId)
        if (!cleanAssignmentId) return res.status(400).json({ message: 'Invalid assignmentId format' })

        const submissions = await Submission.find({ assignmentId: cleanAssignmentId })
            .populate('assignmentId', 'title subject dueDate status')

        res.status(200).json({ count: submissions.length, submissions })

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message })
    }
})

// ─────────────────────────────────────────────
// DELETE /submissions/:id — Delete a submission
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const normalizeId = (val) => {
            if (mongoose.Types.ObjectId.isValid(val)) return val
            const m = String(val).match(/[0-9a-fA-F]{24}/)
            return m ? m[0] : null
        }

        const id = normalizeId(req.params.id)
        if (!id) return res.status(400).json({ message: 'Invalid id format' })

        const deleted = await Submission.findByIdAndDelete(id)

        if (!deleted) {
            return res.status(404).json({ message: 'Submission not found' })
        }

        res.status(200).json({ message: 'Submission deleted successfully' })

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message })
    }
})

// ─────────────────────────────────────────────
// GET /submissions/:id — Get a single submission by id
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const normalizeId = (val) => {
            if (mongoose.Types.ObjectId.isValid(val)) return val
            const m = String(val).match(/[0-9a-fA-F]{24}/)
            return m ? m[0] : null
        }

        const id = normalizeId(req.params.id)
        if (!id) return res.status(400).json({ message: 'Invalid id format' })

        const submission = await Submission.findById(id)
            .populate('assignmentId', 'title subject dueDate status')

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' })
        }

        res.status(200).json(submission)

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message })
    }
})

module.exports = router
