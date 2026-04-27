const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Todo = require('../models/Todo');

// Joi schema for validation
const todoSchema = Joi.object({
  title: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Title cannot be empty',
    'any.required': 'Title is required'
  }),
  description: Joi.string().allow('', null).max(1000).messages({
    'string.max': 'Description cannot exceed 1000 characters'
  }),
  done: Joi.boolean()
});

// GET /api/todos - Get all TODO items
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 }); // Newest first
    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving TODOs', error: error.message });
  }
});

// POST /api/todos - Create a new TODO item
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = todoSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const newTodo = new Todo({
      title: value.title,
      description: value.description || '',
    });

    const savedTodo = await newTodo.save();
    res.status(201).json(savedTodo);
  } catch (error) {
    res.status(500).json({ message: 'Error creating TODO', error: error.message });
  }
});

// PUT /api/todos/:id - Update a TODO (title/description)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const { error, value } = todoSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updatedTodo = await Todo.findByIdAndUpdate(
      id,
      { $set: { title: value.title, description: value.description } },
      { new: true, runValidators: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ message: 'TODO not found' });
    }

    res.status(200).json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: 'Error updating TODO', error: error.message });
  }
});

// PATCH /api/todos/:id/done - Toggle the done status
router.patch('/:id/done', async (req, res) => {
  try {
    const { id } = req.params;
    // We only expect 'done' in the body, but it's okay to just grab it
    const { done } = req.body;

    if (typeof done !== 'boolean') {
      return res.status(400).json({ message: 'Done status must be a boolean' });
    }

    const updatedTodo = await Todo.findByIdAndUpdate(
      id,
      { $set: { done } },
      { new: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ message: 'TODO not found' });
    }

    res.status(200).json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling TODO status', error: error.message });
  }
});

// DELETE /api/todos/:id - Delete a TODO
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTodo = await Todo.findByIdAndDelete(id);

    if (!deletedTodo) {
      return res.status(404).json({ message: 'TODO not found' });
    }

    res.status(200).json({ message: 'TODO deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting TODO', error: error.message });
  }
});

module.exports = router;
