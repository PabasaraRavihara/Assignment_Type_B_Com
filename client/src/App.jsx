import React from 'react';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">Tasks by Type B</h1>
        <p className="subtitle">Manage your daily goals efficiently</p>
      </header>

      <main>
        <TodoForm />
        <TodoList />
      </main>
    </div>
  );
}

export default App;
