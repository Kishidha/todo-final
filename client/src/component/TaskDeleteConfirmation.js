import React from 'react';

function TaskDeleteConfirmation({ onDelete, onCancel }) {
  return (
    <div className="confirmation-dialog">
      <h2>Confirm Task Deletion</h2>
      <p>Are you sure you want to delete this task?</p>
      <div className="confirmation-buttons">
        <button onClick={onDelete}>OK</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default TaskDeleteConfirmation;