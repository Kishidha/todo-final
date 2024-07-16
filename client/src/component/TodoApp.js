import React, { useState, useEffect } from 'react';
import undraw_projections_re_ulc6 from './undraw_projections_re_ulc6.svg';
import pic2 from './pic2.jpg';
import undraw_team_up_re_84ok from './undraw_team_up_re_84ok.svg';
import './style.css';
import TaskDeleteConfirmation from './TaskDeleteConfirmation';

function TodoApp() {
  const [tasks, setTasks] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [sortSelect, setSortSelect] = useState('priority');
  const [db, setDb] = useState(null);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  function formatTime(seconds) {
    if (isNaN(seconds)) {
      return 'Not set';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const hoursDisplay = hours > 0 ? hours + 'h ' : '';
    const minutesDisplay = minutes > 0 ? minutes + 'm ' : '';
    const secondsDisplay = remainingSeconds > 0 ? remainingSeconds + 's' : '';

    return hoursDisplay + minutesDisplay + secondsDisplay;
  }

  useEffect(() => {
    const openDB = async () => {
      const request = indexedDB.open('TodoDB',2);

      request.onsuccess = (event) => {
        setDb(event.target.result);
        loadTasks();
      };

      request.onerror = (event) => {
        console.error('Database error:', event.target.errorCode);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('tasks')) {
          const objectStore = db.createObjectStore('tasks', {
            keyPath: 'id',
            autoIncrement: true,
          });

          objectStore.createIndex('done', 'done', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('category', 'category', { unique: false });
          objectStore.createIndex('priority', 'priority', { unique: false });
        }
      };
    };

    openDB();
  }, []);

  const addTask = async (taskText, category, priority, dueTime) => {
    if (taskText === '') return;
  
    // Retrieve tasks from local storage
    const tasksInLocalStorage = JSON.parse(localStorage.getItem('tasks')) || [];
  
    // Find the next available ID
    const nextId = tasksInLocalStorage.length > 0 ? Math.max(...tasksInLocalStorage.map(task => task.id)) + 1 : 1;
  
    const currentTime = Date.now();
  
    const task = {
      id: nextId,
      text: taskText,
      done: false,
      timestamp: currentTime,
      category,
      priority,
      dueTime,
    };
  
    if (dueTime && dueTime > currentTime) {
      // Calculate time left only if a valid due time is provided
      task.timeLeft = Math.floor((dueTime - currentTime) / 1000);
    }
  
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });
  
      const newTask = await response.json();
  
      // Update local storage with the new task
      localStorage.setItem('tasks', JSON.stringify([...tasksInLocalStorage, task]));
  
      loadTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  
    const transaction = db.transaction('tasks', 'readwrite');
    const objectStore = transaction.objectStore('tasks');
    objectStore.add(task).onsuccess = () => {
      loadTasks();
    };
  };
  

  const loadTasks = () => {
    const tasksArray = [];
  
    if (!db) {
      console.error('Database not available.');
      return;
    }
  
    const objectStore = db.transaction('tasks').objectStore('tasks');
    const cursorRequest = objectStore.openCursor();
  
    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const task = cursor.value;
        if (task.text.toLowerCase().includes(searchInput.toLowerCase())) {
          tasksArray.push(task);
        }
        cursor.continue();
      } else {
        // Cursor loop completed
        try {
          sortTasks(tasksArray, sortSelect);
          setTasks(tasksArray);
        } catch (error) {
          console.error('Error sorting and setting tasks:', error);
        }
      }
    };
  
    cursorRequest.onerror = (event) => {
      console.error('Cursor error:', event.target.error);
    };
  };
  

  const sortTasks = (tasks, criteria) => {
    tasks.sort((a, b) => {
      if (criteria === 'date') {
        return a.timestamp - b.timestamp;
      } else if (criteria === 'priority') {
        const priorities = { low: 3, medium: 2, high: 1 };
        return priorities[a.priority] - priorities[b.priority];
      } else if (criteria === 'category') {
        return a.category.localeCompare(b.category);
      }
    });
  };

  // const toggleDone = async (taskId) => {
  //   const transaction = db.transaction('tasks', 'readwrite');
  //   const objectStore = transaction.objectStore('tasks');
  //   objectStore.get(taskId).onsuccess = (event) => {
  //     const task = event.target.result;
  //     task.done = !task.done;
  //     objectStore.put(task).onsuccess = () => {
  //       loadTasks();
  //     };
  //   };
  // };
  const toggleDone = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      try {
        const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        const updatedTask = await response.json();
        loadTasks();
      } catch (error) {
        console.error('Error toggling task status:', error);
      }
    }
  };
  // const removeTask = (taskId) => {
  //   if (window.confirm('Are you sure to delete the task?')) {
  //     const transaction = db.transaction('tasks', 'readwrite');
  //     const objectStore = transaction.objectStore('tasks');
  //     objectStore.delete(taskId).onsuccess = () => {
  //       loadTasks();
  //     };
  //   }
  // };/
  
  const removeTask = async (taskId) => {
    console.log('Deleting task with ID:', taskId);
  
    if (window.confirm('Are you sure to delete the task?')) {
      // Remove task from the server
      const apiUrl = `http://localhost:5000/api/tasks/${taskId}`;
  
      try {
        const response = await fetch(apiUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
  
        // Retrieve tasks from local storage
        const tasksInLocalStorage = JSON.parse(localStorage.getItem('tasks')) || [];
  
        // Remove the deleted task from local storage
        const updatedTasksLocalStorage = tasksInLocalStorage.filter(task => task.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(updatedTasksLocalStorage));
  
        // Remove task from IndexedDB
        const transaction = db.transaction('tasks', 'readwrite');
        const objectStore = transaction.objectStore('tasks');
        objectStore.delete(taskId).onsuccess = () => {
          loadTasks(); // Reload tasks after deletion
        };
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };
  
  
  
  // Add a useEffect to observe changes in the tasks state
  useEffect(() => {
    console.log('Tasks after deletion:', tasks);
  }, [tasks]);
  


  const editTask = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
  
    if (task) {
      const newText = prompt('Edit task:', task.text);
  
      if (newText !== null && newText.trim() !== '') {
        // Update task text in local storage
        const transaction = db.transaction('tasks', 'readwrite');
    const objectStore = transaction.objectStore('tasks');
    objectStore.get(taskId).onsuccess = (event) => {
      const task = event.target.result;
      task.text = newText;
      objectStore.put(task).onsuccess = () => {
        loadTasks();
      };
    };
  
        // Update task text on the backend
        const apiUrl = `http://localhost:5000/api/tasks/${taskId}/text`;
        try {
          const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: newText }),
          });
  
          const updatedTask = await response.json();
          loadTasks();
        } catch (error) {
          console.error('Error updating task text on the backend:', error);
        }
      }
    }
  };
  

  const setDueTime = (taskId, input) => {
    const dueTime = new Date(input).getTime();
    if (!isNaN(dueTime)) {
      const transaction = db.transaction('tasks', 'readwrite');
      const objectStore = transaction.objectStore('tasks');
      objectStore.get(taskId).onsuccess = (event) => {
        const task = event.target.result;
        task.dueTime = dueTime;
        if (dueTime > task.timestamp) {
          task.timeLeft = Math.floor((dueTime - task.timestamp) / 1000);
        } else {
          task.timeLeft = 0;
        }
        objectStore.put(task).onsuccess = () => {
          loadTasks();
        };
      };
    }
  };

  const checkDueTasks = () => {
    const currentTime = Date.now();

    if (!db) {
      // Handle the case where db is null or not available
      return;
    }

    const objectStore = db.transaction('tasks', 'readwrite').objectStore('tasks');
    objectStore.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const task = cursor.value;
        if (task.dueTime && !task.done) {
          if (task.dueTime <= currentTime) {
            const confirmed = window.confirm(`Task "${task.text}" is due now!\nMark as done?`);
            if (confirmed) {
              task.done = true;
              task.timeLeft = 0;
              objectStore.put(task).onsuccess = () => {
                loadTasks();
              };
            }
          } else {
            task.timeLeft = Math.floor((task.dueTime - currentTime) / 1000);
            objectStore.put(task).onsuccess = () => {
              loadTasks();
            };
          }
        }
        cursor.continue();
      }
    };
  };

  useEffect(() => {
    const interval = setInterval(checkDueTasks, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);
  

  return (
    <div className="background-container" style={{
      backgroundImage: `url(${pic2})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundColor: 'transparent !important',
    }}
    // backgroundColor: 'transparent !important', // Override Tailwind CSS
>
      <div className="illustration-left"></div>
      <div className="illustration-right"></div>
      <div className="content">
        <h1 className='card' style={{ color: '#fff' }}>TRACK YOUR PLANS</h1>
        <form method="POST" action='/tasks'
          id="todoForm"
          className="addbar"
          onSubmit={(e) => {
            e.preventDefault();
            const taskInput = document.getElementById('taskInput');
            const categorySelect = document.getElementById('categorySelect');
            const prioritySelect = document.getElementById('prioritySelect');
            const dueTimeInput = document.getElementById('dueTimeInput');
            addTask(taskInput.value, categorySelect.value, prioritySelect.value, dueTimeInput.value);
            taskInput.value = '';
          }}
        >
          <div>
            <label style={{ fontWeight: 'bold' }}>Add your Task: </label>
            <input
              type="text"
              id="taskInput"
              name="taskInput"
              placeholder="Enter a task"
              required
            />
          </div>
          <div>
            <label style={{ fontWeight: 'bold' }}>Due-Date :</label>
            <input
              type="date"
              id="dueTimeInput"
            />
          </div>
          <div>
            <label style={{ fontWeight: 'bold' }}>Category </label>
            <select id="categorySelect" name="categorySelect">
              <option value="work">Work</option>
              <option value="personal" defaultValue>
                Personal
              </option>
              <option value="shopping">Shopping</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 'bold' }} >Priority </label>
            <select id="prioritySelect" name="prioritySelect">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button type="submit">Add Task</button>
        </form>
        <div className="controls">
          <div className='search'>
            <label style={{ fontWeight: 'bold' }} >Search Input : </label>
            <input
              type="text"
              id="searchInput"
              placeholder="Search tasks"
              onKeyUp={loadTasks}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontWeight: 'bold' }} >Sort by </label>
            <select
              id="sortSelect"
              onChange={(e) => {
                setSortSelect(e.target.value);
                loadTasks();
              }}
              defaultValue="priority"
            >
              <option value="priority">Priority</option>
              <option value="date">Date</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>
        <div className="table-container">
          <table id="taskTable">
            <thead>
              <tr>
                <th>Status</th>
                <th>Task</th>
                <th>Due Time</th>
                <th>Time Left</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Edit</th>
                <th>Delete</th>
                <th>Completion</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}
                className="custom-row"
                style={{
                  background: task.done
                    ? 'linear-gradient(to bottom left, transparent, #FFC39E 100%)'
                    : 'inherit',
                }}
                  >
  
                  <td>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleDone(task.id)}
                      />
                  </td>
                  <td>{task.text}</td>
                  <td>
                    <input
                      type="datetime-local"
                      onChange={(e) => setDueTime(task.id, e.target.value)}
                      value={task.dueTime ? formatDate(task.dueTime) : ''}
                    />
                  </td>
                  <td id={`time-${task.id}`}>{formatTime(task.timeLeft)}</td>
                  <td>{task.category}</td>
                  <td>{task.priority}</td>
                  <td>
                    <button onClick={() => editTask(task.id)}>Edit</button>
                  </td>
                  <td>
                    <button onClick={() => removeTask(task.id)}>Delete</button>
                  </td>
                  <td>{task.done ? 'Completed' : 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TodoApp;
