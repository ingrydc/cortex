import React, { useState, useEffect } from 'react';
import { tasksService } from '../services/tasksService';
import Modal from '../components/Modal';
import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';

const TasksTab = () => {
    const [tasks, setTasks] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [view, setView] = useState('list'); // 'list' or 'detail'
    const [filter, setFilter] = useState({ status: 'all', priority: 'all' });

    useEffect(() => {
        loadTasks();
    }, [filter]);

    const loadTasks = async () => {
        const fetchedTasks = await tasksService.getTasks(filter);
        setTasks(fetchedTasks);
    };

    const handleOpenModal = (task) => {
        setCurrentTask(task);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setCurrentTask(null);
        setIsModalOpen(false);
    };

    const handleToggleView = () => {
        setView(view === 'list' ? 'detail' : 'list');
    };

    return (
        <div className="p-4">
            <div className="flex justify-between mb-4">
                <div>
                    <button onClick={() => handleOpenModal(null)} className="bg-blue-500 text-white px-4 py-2 rounded">Add Task</button>
                    <button onClick={handleToggleView} className="ml-2 bg-gray-200 px-4 py-2 rounded">Toggle View</button>
                </div>
                <div>
                    <select onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="border rounded p-2">
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="done">Done</option>
                    </select>
                    <select onChange={(e) => setFilter({ ...filter, priority: e.target.value })} className="border rounded p-2 ml-2">
                        <option value="all">All Priority</option>
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                    </select>
                </div>
            </div>
            <div className={`${view === 'list' ? 'block' : 'hidden'} md:block`}> {/* Mobile list view */}
                {tasks.length === 0 ? <p>No tasks available</p> : tasks.map(task => (
                    <div key={task.id} className="border p-3 mb-2">
                        <h3 className="text-lg font-semibold">{task.title}</h3>
                        <p>{task.description}</p>
                        <p>{format(new Date(task.createdAt), 'P', { locale: pt })}</p>
                        <button onClick={() => handleOpenModal(task)} className="bg-yellow-500 text-white px-2 py-1 rounded">Edit</button>
                    </div>
                ))}
            </div>
            <div className={`${view === 'detail' ? 'block' : 'hidden'} md:hidden`}> {/* Mobile detail view */}
                {/* Add detail view implementation here */}
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} task={currentTask} onTaskUpdated={loadTasks} />
        </div>
    );
};

export default TasksTab;