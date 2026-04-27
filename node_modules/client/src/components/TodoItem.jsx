import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { Trash2, Edit2, X, Check, AlertCircle } from 'lucide-react';

const TodoItem = ({ todo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDesc, setEditDesc] = useState(todo.description);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const queryClient = useQueryClient();

  // Optimistic Toggle Status
  const toggleMutation = useMutation({
    mutationFn: (done) => api.patch(`/todos/${todo._id}/done`, { done }),
    onMutate: async (done) => {
      await queryClient.cancelQueries(['todos']);
      const previousTodos = queryClient.getQueryData(['todos']);
      queryClient.setQueryData(['todos'], (old) => 
        old.map(t => t._id === todo._id ? { ...t, done } : t)
      );
      return { previousTodos };
    },
    onError: (err, variables, context) => {
      if (context?.previousTodos) queryClient.setQueryData(['todos'], context.previousTodos);
    },
    onSettled: () => queryClient.invalidateQueries(['todos'])
  });

  // Optimistic Edit
  const editMutation = useMutation({
    mutationFn: (data) => api.put(`/todos/${todo._id}`, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries(['todos']);
      const previousTodos = queryClient.getQueryData(['todos']);
      queryClient.setQueryData(['todos'], (old) => 
        old.map(t => t._id === todo._id ? { ...t, ...data } : t)
      );
      return { previousTodos };
    },
    onError: (err, variables, context) => {
      if (context?.previousTodos) queryClient.setQueryData(['todos'], context.previousTodos);
      setErrorMsg(err.response?.data?.message || 'Failed to update TODO');
    },
    onSettled: () => queryClient.invalidateQueries(['todos']),
    onSuccess: () => {
      setIsEditing(false);
      setErrorMsg(null);
    }
  });

  // Optimistic Delete
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/todos/${todo._id}`),
    onMutate: async () => {
      await queryClient.cancelQueries(['todos']);
      const previousTodos = queryClient.getQueryData(['todos']);
      queryClient.setQueryData(['todos'], (old) => 
        old.filter(t => t._id !== todo._id)
      );
      return { previousTodos };
    },
    onError: (err, variables, context) => {
      if (context?.previousTodos) queryClient.setQueryData(['todos'], context.previousTodos);
    },
    onSettled: () => queryClient.invalidateQueries(['todos'])
  });

  const handleSave = () => {
    if (!editTitle.trim()) {
      setErrorMsg('Title cannot be empty');
      return;
    }
    editMutation.mutate({ title: editTitle, description: editDesc });
  };

  const handleToggle = (e) => {
    toggleMutation.mutate(e.target.checked);
  };

  if (isEditing) {
    return (
      <div className="todo-item" style={{ flexDirection: 'column' }}>
        <input 
          type="text" 
          className="input-field" 
          value={editTitle} 
          onChange={e => setEditTitle(e.target.value)} 
          placeholder="Task title"
          style={{ marginBottom: '0.5rem' }}
        />
        <textarea 
          className="input-field" 
          value={editDesc} 
          onChange={e => setEditDesc(e.target.value)} 
          rows={2}
          placeholder="Description"
          style={{ marginBottom: '0.5rem' }}
        />
        {errorMsg && (
          <div className="error-message" style={{ marginBottom: '0.5rem' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
          <button className="btn-icon" onClick={() => { setIsEditing(false); setErrorMsg(null); }}>
            <X size={18} />
          </button>
          <button className="btn-icon" style={{ color: 'var(--success-color)' }} onClick={handleSave}>
            <Check size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`todo-item ${todo.done ? 'done' : ''}`}>
      <div className="checkbox-wrapper">
        <input 
          type="checkbox" 
          className="custom-checkbox" 
          checked={todo.done || false} 
          onChange={handleToggle} 
        />
      </div>
      
      <div className="todo-content">
        <div className="todo-title">{todo.title}</div>
        {todo.description && <div className="todo-desc">{todo.description}</div>}
      </div>

      <div className="todo-actions">
        <button 
          className="btn-icon" 
          onClick={() => setIsEditing(true)}
          title="Edit"
        >
          <Edit2 size={16} />
        </button>
        <button 
          className="btn-icon danger" 
          onClick={() => deleteMutation.mutate()}
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default TodoItem;
