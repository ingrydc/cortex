import React, { useState, useEffect } from 'react';
import { useApi, useAction } from 'your-hooks';
import { Modal } from 'components/ui';
import tasksService from 'services/tasksService';

const TasksTab = () => {
    const [tasks, setTasks] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const api = useApi();
    const action = useAction();

    useEffect(() => {
        const fetchTasks = async () => {
            const response = await tasksService.list({ filter: 'your-filter-parameter' });
            setTasks(response.data);
        };
        fetchTasks();
    }, []);

    const handleCreateTask = async (taskData) => {
        await tasksService.create(taskData);
        action.refresh();
    };

    const handleEditTask = async (taskData) => {
        await tasksService.update(taskData.id, taskData);
        action.refresh();
    };

    const handleMarkAsDone = async (taskId) => {
        await tasksService.markAsDone(taskId);
        action.refresh();
    };

    const handleDeleteTask = async (taskId) => {
        await tasksService.delete(taskId);
        action.refresh();
    };

    return (
        <div>
            <h1>Tasks</h1>
            <button onClick={() => setModalOpen(true)}>Create New Task</button>
            <ul>
                {tasks.map(task => (
                    <li key={task.id}>
                        {task.name}
                        <button onClick={() => handleEditTask(task)}>Edit</button>
                        <button onClick={() => handleMarkAsDone(task.id)}>Done</button>
                        <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
                    </li>
                ))}
            </ul>
            {isModalOpen && <Modal onClose={() => setModalOpen(false)} onSubmit={handleCreateTask} task={selectedTask} />}
        </div>
    );
};

export default TasksTab;