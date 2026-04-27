import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { PlusCircle, AlertCircle } from 'lucide-react';

const TodoForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const queryClient = useQueryClient();

  const createTodoMutation = useMutation({
    mutationFn: (newTodo) => api.post('/todos', newTodo),
    onMutate: async (newTodo) => {
      // Optimistic Update
      await queryClient.cancelQueries(['todos']);
      const previousTodos = queryClient.getQueryData(['todos']);
      
      // Add optimistic todo
      queryClient.setQueryData(['todos'], (old) => {
        const optimisticTodo = {
          _id: Math.random().toString(), // fake ID
          ...newTodo,
          done: false,
          createdAt: new Date().toISOString()
        };
        return [optimisticTodo, ...(old || [])];
      });

      return { previousTodos };
    },
    onError: (err, newTodo, context) => {
      // Revert if error
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
      setErrorMsg(err.response?.data?.message || 'Failed to create TODO');
      setTimeout(() => setErrorMsg(null), 5000);
    },
    onSettled: () => {
      // Sync with server
      queryClient.invalidateQueries(['todos']);
    },
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setErrorMsg(null);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Title cannot be empty');
      return;
    }
    
    createTodoMutation.mutate({ title, description });
  };

  return (
    <div className="glass-panel">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            className="input-field"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            disabled={createTodoMutation.isLoading}
          />
        </div>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <textarea
            className="input-field"
            placeholder="Add a detailed description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={createTodoMutation.isLoading}
            rows={2}
          ></textarea>
        </div>
        
        {errorMsg && (
          <div className="error-message">
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={createTodoMutation.isLoading || !title.trim()}
          >
            <PlusCircle size={18} />
            Add Task
          </button>
        </div>
      </form>
    </div>
  );
};

export default TodoForm;
