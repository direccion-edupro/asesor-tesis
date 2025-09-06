document.addEventListener('DOMContentLoaded', () => {
    // Definiciones iniciales (STORAGE_KEY, defaultThesisData, etc.) sin cambios
    const STORAGE_KEY = 'thesisProgress';
    const defaultThesisData = { stages: [ { title: "Fase 1: Elección y Delimitación del Tema", deadline: null, tasks: [ { description: "Realizar lluvia de ideas sobre posibles temas.", completed: false }, { description: "Investigar antecedentes de los temas seleccionados.", completed: false }, { description: "Definir el tema final y delimitar su alcance.", completed: false } ] }, { title: "Fase 2: Planteamiento del Problema", deadline: null, tasks: [ { description: "Redactar la descripción del problema.", completed: false }, { description: "Formular la pregunta de investigación principal.", completed: false }, { description: "Formular preguntas de investigación secundarias.", completed: false }, { description: "Escribir la justificación e importancia del estudio.", completed: false } ] }, { title: "Fase 3: Construcción del Marco Teórico", deadline: null, tasks: [ { description: "Identificar las bases teóricas clave.", completed: false }, { description: "Buscar y recopilar literatura relevante (artículos, libros).", completed: false }, { description: "Redactar los antecedentes de la investigación.", completed: false }, { description: "Desarrollar los conceptos y teorías centrales.", completed: false } ] }, { title: "Fase 4: Diseño Metodológico", deadline: null, tasks: [ { description: "Definir el enfoque de la investigación (cualitativo, cuantitativo, mixto).", completed: false }, { description: "Seleccionar y describir la población y muestra.", completed: false }, { description: "Diseñar los instrumentos de recolección de datos.", completed: false }, { description: "Describir el procedimiento para el análisis de datos.", completed: false } ] } ] };
    const loadThesisData = () => { const savedData = localStorage.getItem(STORAGE_KEY); return savedData ? JSON.parse(savedData) : defaultThesisData; };
    const saveThesisData = () => { localStorage.setItem(STORAGE_KEY, JSON.stringify(thesisData)); };
    let thesisData = loadThesisData();
    const roadmapContainer = document.getElementById('thesis-roadmap');
    const ganttChartContainer = document.getElementById('gantt-chart'); 

    // --- NUEVAS FUNCIONES PARA MANEJAR TAREAS ---

    function addTask(stageIndex, description) {
        if (!description.trim()) return; // No añadir tareas vacías
        thesisData.stages[stageIndex].tasks.push({
            description: description.trim(),
            completed: false
        });
        saveThesisData();
        renderAll();
    }

    function deleteTask(stageIndex, taskIndex) {
        // Pedir confirmación antes de borrar
        if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
            thesisData.stages[stageIndex].tasks.splice(taskIndex, 1);
            saveThesisData();
            renderAll();
        }
    }

    function editTask(stageIndex, taskIndex) {
        const currentDescription = thesisData.stages[stageIndex].tasks[taskIndex].description;
        const newDescription = prompt('Edita tu tarea:', currentDescription);

        // Si el usuario no cancela y el texto no está vacío
        if (newDescription !== null && newDescription.trim() !== '') {
            thesisData.stages[stageIndex].tasks[taskIndex].description = newDescription.trim();
            saveThesisData();
            renderAll();
        }
    }

    // --- FUNCIONES PRINCIPALES (MODIFICADAS) ---

    function renderRoadmap() {
        roadmapContainer.innerHTML = '';
        let previousStageCompleted = true;
        const today = new Date(); today.setHours(0, 0, 0, 0);

        thesisData.stages.forEach((stage, stageIndex) => {
            const isStageCompleted = stage.tasks.length > 0 && stage.tasks.every(task => task.completed); // MODIFICADO: una etapa sin tareas no está completa
            const isLocked = !previousStageCompleted;
            const isActive = !isLocked && !isStageCompleted;
            const isOverdue = isActive && stage.deadline && new Date(stage.deadline) < today;

            const stageElement = document.createElement('div');
            // ... (Creación de stageElement y stageHeader sin cambios)
            stageElement.className = 'stage';
            if (isLocked) stageElement.classList.add('locked');
            if (isStageCompleted) stageElement.classList.add('completed');
            if (isOverdue) stageElement.classList.add('overdue');
            if (!isActive) stageElement.classList.add('collapsed');
            const stageHeader = document.createElement('div');
            stageHeader.className = 'stage-header';
            let deadlineText = stage.deadline ? `Fecha Límite: ${stage.deadline}` : 'Sin fecha límite';
            if (isOverdue) deadlineText = `¡Atrasado! Límite: ${stage.deadline}`;
            let status = isStageCompleted ? 'Completada' : (isActive ? 'Activa' : 'Bloqueada');
            stageHeader.innerHTML = `<div class="stage-title-container"><h2>${stage.title}</h2><span class="deadline-text">${deadlineText}</span></div><span class="status-badge ${status.toLowerCase()}">${status}</span>`;
            stageHeader.addEventListener('click', () => { if (!isLocked) stageElement.classList.toggle('collapsed'); });

            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'stage-tasks';

            // ... (Gestión de fecha límite sin cambios)
            if (isActive || isStageCompleted) {
                const deadlineDiv = document.createElement('div');
                deadlineDiv.className = 'deadline-management';
                deadlineDiv.innerHTML = `<label for="deadline-${stageIndex}">Establecer Fecha Límite:</label>`;
                const dateInput = document.createElement('input');
                dateInput.type = 'date';
                dateInput.id = `deadline-${stageIndex}`;
                dateInput.value = stage.deadline || '';
                dateInput.addEventListener('change', (e) => { thesisData.stages[stageIndex].deadline = e.target.value; saveThesisData(); renderAll(); });
                deadlineDiv.appendChild(dateInput);
                contentWrapper.appendChild(deadlineDiv);
            }

            // --- RENDERIZADO DE TAREAS (MODIFICADO) ---
            stage.tasks.forEach((task, taskIndex) => {
                const taskElement = document.createElement('div');
                taskElement.className = 'task';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `task-${stageIndex}-${taskIndex}`;
                checkbox.checked = task.completed;
                checkbox.disabled = isLocked;
                checkbox.addEventListener('change', () => toggleTask(stageIndex, taskIndex));

                const label = document.createElement('label');
                label.setAttribute('for', `task-${stageIndex}-${taskIndex}`);
                label.textContent = task.description;

                taskElement.appendChild(checkbox);
                taskElement.appendChild(label);

                // NUEVO: Añadir botones de acción si la etapa no está bloqueada
                if (!isLocked) {
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'task-actions';

                    const editBtn = document.createElement('button');
                    editBtn.className = 'task-action-btn';
                    editBtn.innerHTML = '✏️'; // Emoji de lápiz
                    editBtn.title = 'Editar tarea';
                    editBtn.addEventListener('click', () => editTask(stageIndex, taskIndex));
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'task-action-btn';
                    deleteBtn.innerHTML = '🗑️'; // Emoji de papelera
                    deleteBtn.title = 'Eliminar tarea';
                    deleteBtn.addEventListener('click', () => deleteTask(stageIndex, taskIndex));
                    
                    actionsDiv.appendChild(editBtn);
                    actionsDiv.appendChild(deleteBtn);
                    taskElement.appendChild(actionsDiv);
                }

                contentWrapper.appendChild(taskElement);
            });

            // --- NUEVO: FORMULARIO PARA AÑADIR TAREA ---
            if (!isLocked) {
                const addTaskDiv = document.createElement('div');
                addTaskDiv.className = 'add-task-form';
                
                const taskInput = document.createElement('input');
                taskInput.type = 'text';
                taskInput.placeholder = 'Añadir nueva tarea...';
                taskInput.id = `add-task-input-${stageIndex}`;

                const addBtn = document.createElement('button');
                addBtn.textContent = 'Añadir';
                
                addBtn.addEventListener('click', () => {
                    const input = document.getElementById(`add-task-input-${stageIndex}`);
                    addTask(stageIndex, input.value);
                });
                // También permitir añadir con la tecla "Enter"
                taskInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        addTask(stageIndex, taskInput.value);
                    }
                });

                addTaskDiv.appendChild(taskInput);
                addTaskDiv.appendChild(addBtn);
                contentWrapper.appendChild(addTaskDiv);
            }

            stageElement.appendChild(stageHeader);
            stageElement.appendChild(contentWrapper);
            roadmapContainer.appendChild(stageElement);

            previousStageCompleted = isStageCompleted;
        });
    }

    function toggleTask(stageIndex, taskIndex) {
        thesisData.stages[stageIndex].tasks[taskIndex].completed = !thesisData.stages[stageIndex].tasks[taskIndex].completed;
        saveThesisData();
        renderAll();
    }

    function renderAll() {
        renderRoadmap();
        // renderGanttChart(); // El código de Gantt no cambia
    }
    // Omitiendo el código de Gantt por brevedad, pero debe estar aquí
    function renderGanttChart() { /* ... código sin cambios ... */ const stagesWithDeadlines = thesisData.stages.filter(stage => stage.deadline); if (stagesWithDeadlines.length === 0) { ganttChartContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Establece fechas límite para ver el cronograma.</p>'; return; } const dayInMillis = 86400000; let projectStartDate = new Date(); const projectEndDate = new Date(Math.max(...stagesWithDeadlines.map(stage => new Date(stage.deadline)))); const totalProjectDays = Math.ceil((projectEndDate - projectStartDate) / dayInMillis) + 1; let lastDeadline = projectStartDate; thesisData.stages.forEach(stage => { if (!stage.deadline) return; const stageStartDate = new Date(lastDeadline); const stageEndDate = new Date(stage.deadline); const startOffsetDays = Math.max(0, Math.ceil((stageStartDate - projectStartDate) / dayInMillis)); const stageDurationDays = Math.max(1, Math.ceil((stageEndDate - stageStartDate) / dayInMillis)); const barStartPercent = (startOffsetDays / totalProjectDays) * 100; const barWidthPercent = (stageDurationDays / totalProjectDays) * 100; const label = document.createElement('div'); label.className = 'gantt-label'; label.textContent = stage.title.split(':')[1].trim(); const row = document.createElement('div'); row.className = 'gantt-row'; const bar = document.createElement('div'); bar.className = 'gantt-bar'; bar.style.left = `${barStartPercent}%`; bar.style.width = `${barWidthPercent}%`; const isStageCompleted = stage.tasks.every(task => task.completed); const isOverdue = !isStageCompleted && new Date(stage.deadline) < new Date(); if(isStageCompleted) bar.classList.add('completed'); if(isOverdue) bar.classList.add('overdue'); row.appendChild(bar); ganttChartContainer.appendChild(label); ganttChartContainer.appendChild(row); lastDeadline = stage.deadline; }); }

    renderAll();
});