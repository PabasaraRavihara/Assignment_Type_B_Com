import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import TodoItem from './TodoItem';
import { Activity } from 'lucide-react';

const TodoList = () => {
  const { data: todos, isLoading, isError, error } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await api.get('/todos');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading your tasks...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-panel" style={{ borderColor: 'var(--danger-color)', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger-color)', marginBottom: '0.5rem' }}>Connection Error</h3>
        <p style={{ color: 'var(--text-secondary)' }}>{error?.message || 'Failed to connect to the server.'}</p>
      </div>
    );
  }

  if (!todos || todos.length === 0) {
    return (
      <div className="glass-panel empty-state">
        <Activity className="empty-icon" />
        <h3>All caught up!</h3>
        <p>You have no tasks to do. Add one above.</p>
      </div>
    );
  }

  return (
    <div className="todo-list">
      {todos.map(todo => (
        <TodoItem key={todo._id} todo={todo} />
      ))}
    </div>
  );
};

export default TodoList;
