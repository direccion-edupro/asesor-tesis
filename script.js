document.addEventListener('DOMContentLoaded', () => {
  // ====== CONSTANTES ======
  const STORAGE_KEY = 'thesisProgress';

  // Datos por defecto (puedes añadir fases 5 y 6 luego si deseas)
  const defaultThesisData = {
    stages: [
      {
        title: "Fase 1: Elección y Delimitación del Tema",
        deadline: null,
        tasks: [
          { description: "Realizar lluvia de ideas sobre posibles temas.", completed: false },
          { description: "Investigar antecedentes de los temas seleccionados.", completed: false },
          { description: "Definir el tema final y delimitar su alcance.", completed: false }
        ]
      },
      {
        title: "Fase 2: Planteamiento del Problema",
        deadline: null,
        tasks: [
          { description: "Redactar la descripción del problema.", completed: false },
          { description: "Formular la pregunta de investigación principal.", completed: false },
          { description: "Formular preguntas de investigación secundarias.", completed: false },
          { description: "Escribir la justificación e importancia del estudio.", completed: false }
        ]
      },
      {
        title: "Fase 3: Construcción del Marco Teórico",
        deadline: null,
        tasks: [
          { description: "Identificar las bases teóricas clave.", completed: false },
          { description: "Buscar y recopilar literatura relevante (artículos, libros).", completed: false },
          { description: "Redactar los antecedentes de la investigación.", completed: false },
          { description: "Desarrollar los conceptos y teorías centrales.", completed: false }
        ]
      },
      {
        title: "Fase 4: Diseño Metodológico",
        deadline: null,
        tasks: [
          { description: "Definir el enfoque de la investigación (cualitativo, cuantitativo, mixto).", completed: false },
          { description: "Seleccionar y describir la población y muestra.", completed: false },
          { description: "Diseñar los instrumentos de recolección de datos.", completed: false },
          { description: "Describir el procedimiento para el análisis de datos.", completed: false }
        ]
      }
    ]
  };

  // ====== STORAGE ======
  const loadThesisData  = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(defaultThesisData));
  };
  const saveThesisData  = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(thesisData));

  let thesisData = loadThesisData();

  // ====== DOM ======
  const roadmapContainer     = document.getElementById('thesis-roadmap');
  const ganttChartContainer  = document.getElementById('gantt-chart');

  // ====== PROGRESO GENERAL ======
  function updateOverallProgress() {
    let total = 0, done = 0;
    (thesisData?.stages || []).forEach(s => {
      (s.tasks || []).forEach(t => {
        total++;
        if (t.completed) done++;
      });
    });

    const pct  = total ? Math.round((done / total) * 100) : 0;
    const bar  = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    if (!bar || !text) return;

    bar.style.width = pct + '%';
    bar.style.background = (pct >= 80) ? '#28a745' : (pct >= 40 ? '#ffc107' : '#dc3545');
    text.textContent = `Progreso general: ${pct}%`;
  }

  // ====== TAREAS ======
  function addTask(stageIndex, description) {
    const txt = (description || '').trim();
    if (!txt) return;
    thesisData.stages[stageIndex].tasks.push({ description: txt, completed: false });
    saveThesisData();
    renderAll();
  }

  function deleteTask(stageIndex, taskIndex) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    thesisData.stages[stageIndex].tasks.splice(taskIndex, 1);
    saveThesisData();
    renderAll();
  }

  function editTask(stageIndex, taskIndex) {
    const current = thesisData.stages[stageIndex].tasks[taskIndex].description;
    const next = prompt('Edita tu tarea:', current);
    if (next !== null && next.trim() !== '') {
      thesisData.stages[stageIndex].tasks[taskIndex].description = next.trim();
      saveThesisData();
      renderAll();
    }
  }

  function toggleTask(stageIndex, taskIndex) {
    thesisData.stages[stageIndex].tasks[taskIndex].completed =
      !thesisData.stages[stageIndex].tasks[taskIndex].completed;
    saveThesisData();
    renderAll();
  }

  // ====== RENDERIZADO ======
  function renderRoadmap() {
    roadmapContainer.innerHTML = '';
    let previousStageCompleted = true;
    const today = new Date(); today.setHours(0,0,0,0);

    thesisData.stages.forEach((stage, stageIndex) => {
      const isStageCompleted = stage.tasks.length > 0 && stage.tasks.every(t => t.completed);
      const isLocked  = !previousStageCompleted;
      const isActive  = !isLocked && !isStageCompleted;
      const isOverdue = isActive && stage.deadline && new Date(stage.deadline) < today;

      const stageElement = document.createElement('div');
      stageElement.className = 'stage';
      if (isLocked)        stageElement.classList.add('locked');
      if (isStageCompleted)stageElement.classList.add('completed');
      if (isOverdue)       stageElement.classList.add('overdue');
      if (!isActive)       stageElement.classList.add('collapsed');

      const stageHeader = document.createElement('div');
      stageHeader.className = 'stage-header';

      let deadlineText = stage.deadline ? `Fecha Límite: ${stage.deadline}` : 'Sin fecha límite';
      if (isOverdue) deadlineText = `¡Atrasado! Límite: ${stage.deadline}`;
      const status = isStageCompleted ? 'Completada' : (isActive ? 'Activa' : 'Bloqueada');

      stageHeader.innerHTML =
        `<div class="stage-title-container">
           <h2>${stage.title}</h2>
           <span class="deadline-text">${deadlineText}</span>
         </div>
         <span class="status-badge ${status.toLowerCase()}">${status}</span>`;

      stageHeader.addEventListener('click', () => { if (!isLocked) stageElement.classList.toggle('collapsed'); });

      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'stage-tasks';

      // Fecha límite
      if (isActive || isStageCompleted) {
        const deadlineDiv = document.createElement('div');
        deadlineDiv.className = 'deadline-management';
        deadlineDiv.innerHTML = `<label for="deadline-${stageIndex}">Establecer Fecha Límite:</label>`;
        const dateInput = document.createElement('input');
        dateInput.type  = 'date';
        dateInput.id    = `deadline-${stageIndex}`;
        dateInput.value = stage.deadline || '';
        dateInput.addEventListener('change', (e) => {
          thesisData.stages[stageIndex].deadline = e.target.value;
          saveThesisData();
          renderAll();
        });
        deadlineDiv.appendChild(dateInput);
        contentWrapper.appendChild(deadlineDiv);
      }

      // Lista de tareas
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

        if (!isLocked) {
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'task-actions';

          const editBtn = document.createElement('button');
          editBtn.className = 'task-action-btn';
          editBtn.innerHTML = '✏️';
          editBtn.title = 'Editar tarea';
          editBtn.addEventListener('click', () => editTask(stageIndex, taskIndex));

          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'task-action-btn';
          deleteBtn.innerHTML = '🗑️';
          deleteBtn.title = 'Eliminar tarea';
          deleteBtn.addEventListener('click', () => deleteTask(stageIndex, taskIndex));

          actionsDiv.appendChild(editBtn);
          actionsDiv.appendChild(deleteBtn);
          taskElement.appendChild(actionsDiv);
        }

        contentWrapper.appendChild(taskElement);
      });

      // Form para agregar tarea
      if (!isLocked) {
        const addTaskDiv = document.createElement('div');
        addTaskDiv.className = 'add-task-form';

        const taskInput = document.createElement('input');
        taskInput.type = 'text';
        taskInput.placeholder = 'Añadir nueva tarea...';
        taskInput.id = `add-task-input-${stageIndex}`;

        const addBtn = document.createElement('button');
        addBtn.textContent = 'Añadir';

        const doAdd = () => {
          const input = document.getElementById(`add-task-input-${stageIndex}`);
          addTask(stageIndex, input.value);
          input.value = '';
          input.focus();
        };

        addBtn.addEventListener('click', doAdd);
        taskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } });

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

  // Gantt (tu versión compacta)
  function renderGanttChart() {
    const stagesWithDeadlines = thesisData.stages.filter(s => s.deadline);
    if (stagesWithDeadlines.length === 0) {
      ganttChartContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Establece fechas límite para ver el cronograma.</p>';
      return;
    }
    ganttChartContainer.innerHTML = '';

    const dayInMillis = 86400000;
    let projectStartDate = new Date();
    const projectEndDate = new Date(Math.max(...stagesWithDeadlines.map(s => new Date(s.deadline))));
    const totalProjectDays = Math.ceil((projectEndDate - projectStartDate) / dayInMillis) + 1;

    let lastDeadline = projectStartDate;
    thesisData.stages.forEach(stage => {
      if (!stage.deadline) return;

      const stageStartDate = new Date(lastDeadline);
      const stageEndDate   = new Date(stage.deadline);

      const startOffsetDays  = Math.max(0, Math.ceil((stageStartDate - projectStartDate) / dayInMillis));
      const stageDurationDays= Math.max(1, Math.ceil((stageEndDate - stageStartDate) / dayInMillis));

      const barStartPercent  = (startOffsetDays / totalProjectDays) * 100;
      const barWidthPercent  = (stageDurationDays / totalProjectDays) * 100;

      const label = document.createElement('div');
      label.className = 'gantt-label';
      label.textContent = (stage.title.split(':')[1] || stage.title).trim();

      const row = document.createElement('div');
      row.className = 'gantt-row';

      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      bar.style.left  = `${barStartPercent}%`;
      bar.style.width = `${barWidthPercent}%`;

      const isStageCompleted = stage.tasks.every(t => t.completed);
      const isOverdue = !isStageCompleted && new Date(stage.deadline) < new Date();
      if (isStageCompleted) bar.classList.add('completed');
      if (isOverdue)       bar.classList.add('overdue');

      row.appendChild(bar);
      ganttChartContainer.appendChild(label);
      ganttChartContainer.appendChild(row);

      lastDeadline = stage.deadline;
    });
  }

  // Orquestador
  function renderAll() {
    renderRoadmap();
    renderGanttChart();
    updateOverallProgress();
  }

  // Primera pinta
  renderAll();
});
