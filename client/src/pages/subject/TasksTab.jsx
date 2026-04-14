import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

const TasksTab = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const tasks = [/* Array of task objects */]; // Replace this with actual task data

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleEditTask = () => {
    // Implement edit functionality here
  };

  const handleDeleteTask = () => {
    // Implement delete functionality here
  };

  return (
    <div>
      <h2>Tasks</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id} onClick={() => handleTaskClick(task)}>
            {task.title} - {task.dueDate}
          </li>
        ))}
      </ul>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedTask?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Due Date: {selectedTask?.dueDate}</p>
          <p>Priority: {selectedTask?.priority}</p>
          <p>Created Date: {selectedTask?.createdDate}</p>
          <p>Status: {selectedTask?.done ? 'Done' : 'Not Done'}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
          <Button variant="primary" onClick={handleEditTask}>Edit</Button>
          <Button variant="danger" onClick={handleDeleteTask}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TasksTab;