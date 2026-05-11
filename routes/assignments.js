const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Assignment = require('../models/Assignments')

// ─────────────────────────────────────────────
// POST /assignments — Create a new assignment
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { title, subject, description, dueDate } = req.body

        // Basic validation
        if (!title || !subject || !description || !dueDate) {
            return res.status(400).json({ message: 'All fields are required: title, subject, description, dueDate' })
        }

        const assignment = new Assignment({
            title,
            subject,
            description,
            dueDate,
            status: 'active'   // always starts as active
        })

        const saved = await assignment.save()
        res.status(201).json({ message: 'Assignment created successfully', assignment: saved })

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message })
    }
})

// ─────────────────────────────────────────────
// GET /assignments — Get all assignments
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        // Auto-close assignments past due date before returning
        const now = new Date()
        await Assignment.updateMany(
            { dueDate: { $lt: now }, status: 'active' },
            { status: 'closed' }
        )

        const assignments = await Assignment.find().sort({ createdAt: -1 })
        res.status(200).json({ count: assignments.length, assignments })

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message })
    }
})

// ─────────────────────────────────────────────
// GET /assignments/:id — Get one assignment
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const rawId = req.params.id
        if (!rawId) return res.status(400).json({ message: 'Missing id parameter' })

        const normalizeId = (val) => {
            if (mongoose.Types.ObjectId.isValid(val)) return val
            const m = String(val).match(/[0-9a-fA-F]{24}/)
            return m ? m[0] : null
        }

        const id = normalizeId(rawId)
        if (!id) return res.status(400).json({ message: 'Invalid id format' })

        const assignment = await Assignment.findById(id)

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' })
        }

        // Auto-close if past due date
        if (new Date() > assignment.dueDate && assignment.status === 'active') {
            assignment.status = 'closed'
            await assignment.save()
        }

        res.status(200).json(assignment)

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message })
    }
})

// ─────────────────────────────────────────────
// PUT /assignments/:id — Update an assignment
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
    try {
        const rawId = req.params.id
        const normalizeId = (val) => {
            if (mongoose.Types.ObjectId.isValid(val)) return val
            const m = String(val).match(/[0-9a-fA-F]{24}/)
            return m ? m[0] : null
        }

        const id = normalizeId(rawId)
        if (!id) return res.status(400).json({ message: 'Invalid id format' })

        const updated = await Assignment.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }  
            // new:true → returns updated doc
            // runValidators → applies schema rules on update too
        )

        if (!updated) {
            return res.status(404).json({ message: 'Assignment not found' })
        }

        res.status(200).json({ message: 'Assignment updated', assignment: updated })

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message })
    }
})

// ─────────────────────────────────────────────
// DELETE /assignments/:id — Delete an assignment
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const rawId = req.params.id
        const normalizeId = (val) => {
            if (mongoose.Types.ObjectId.isValid(val)) return val
            const m = String(val).match(/[0-9a-fA-F]{24}/)
            return m ? m[0] : null
        }

        const id = normalizeId(rawId)
        if (!id) return res.status(400).json({ message: 'Invalid id format' })

        const deleted = await Assignment.findByIdAndDelete(id)

        if (!deleted) {
            return res.status(404).json({ message: 'Assignment not found' })
        }

        res.status(200).json({ message: 'Assignment deleted successfully' })

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message })
    }
})

module.exports = router
