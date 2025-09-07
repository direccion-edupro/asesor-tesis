document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ===== Constantes ===== */
  const STORAGE_KEY = 'thesisProgress';
  const STUDENT_KEY = 'thesisStudent';

  /* ===== Dataset por defecto (6 fases) ===== */
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
      },
      {
        title: "Fase 5: Resultados y Discusión",
        deadline: null,
        tasks: [
          { description: "Preparar y depurar los datos / transcripciones.", completed: false },
          { description: "Realizar el análisis (estadístico o temático).", completed: false },
          { description: "Generar tablas, figuras y visualizaciones clave.", completed: false },
          { description: "Redactar resultados y discutirlos con el marco teórico.", completed: false }
        ]
      },
      {
        title: "Fase 6: Conclusiones y Recomendaciones",
        deadline: null,
        tasks: [
          { description: "Sintetizar hallazgos y responder a la pregunta de investigación.", completed: false },
          { description: "Redactar conclusiones alineadas con los objetivos.", completed: false },
          { description: "Formular recomendaciones aplicables (defensa y seguridad).", completed: false },
          { description: "Presentación y resumen ejecutivo de cierre.", completed: false }
        ]
      }
    ]
  };

  /* ===== Carga/guardado ===== */
  const deepClone = (x) => JSON.parse(JSON.stringify(x));
  const loadData = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : deepClone(defaultThesisData);
    } catch { return deepClone(defaultThesisData); }
  };
  let thesisData = loadData();
  const saveData = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(thesisData));

  /* ===== Migración: asegura que existan Fase 5 y 6 si el usuario tenía datos viejos ===== */
  (function ensureNewStages() {
    const have = t => thesisData.stages?.some(s => s.title === t);
    if (!have("Fase 5: Resultados y Discusión")) thesisData.stages.push(deepClone(defaultThesisData.stages[4]));
    if (!have("Fase 6: Conclusiones y Recomendaciones")) thesisData.stages.push(deepClone(defaultThesisData.stages[5]));
    saveData();
  })();

  /* ===== Cache de nodos ===== */
  const roadmapContainer = document.getElementById('thesis-roadmap');
  const ganttChartContainer = document.getElementById('gantt-chart');

  /* ===== Progreso general ===== */
  function updateOverallProgress() {
    let total = 0, done = 0;
    (thesisData.stages || []).forEach(s => (s.tasks || []).forEach(t => {
      total++; if (t.completed) done++;
    }));
    const pct = total ? Math.round((done / total) * 100) : 0;
    const bar  = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    if (bar) {
      bar.style.width = pct + '%';
      bar.style.background = (pct >= 80) ? '#28a745' : (pct >= 40 ? '#ffc107' : '#dc3545');
    }
    if (text) text.textContent = `Progreso general: ${pct}%`;
  }

  /* ===== CRUD de tareas ===== */
  function toggleTask(si, ti) {
    thesisData.stages[si].tasks[ti].completed = !thesisData.stages[si].tasks[ti].completed;
    saveData(); renderAll();
  }
  function addTask(si, txt) {
    const d = (txt || '').trim(); if (!d) return;
    thesisData.stages[si].tasks.push({ description: d, completed: false });
    saveData(); renderAll();
  }
  function editTask(si, ti) {
    const cur = thesisData.stages[si].tasks[ti].description;
    const n = prompt('Edita tu tarea:', cur);
    if (n && n.trim()) {
      thesisData.stages[si].tasks[ti].description = n.trim();
      saveData(); renderAll();
    }
  }
  function deleteTask(si, ti) {
    if (!confirm('¿Eliminar tarea?')) return;
    thesisData.stages[si].tasks.splice(ti, 1);
    saveData(); renderAll();
  }

  /* ===== Render del roadmap ===== */
  function renderRoadmap() {
    if (!roadmapContainer) return;
    roadmapContainer.innerHTML = '';
    let prevCompleted = true;
    const today = new Date(); today.setHours(0,0,0,0);

    (thesisData.stages || []).forEach((stage, si) => {
      const isCompleted = stage.tasks?.length > 0 && stage.tasks.every(t => t.completed);
      const isLocked    = !prevCompleted;
      const isActive    = !isLocked && !isCompleted;
      const isOverdue   = isActive && stage.deadline && new Date(stage.deadline) < today;

      const stageEl = document.createElement('div');
      stageEl.className = 'stage';
      if (isLocked)     stageEl.classList.add('locked');
      if (isCompleted)  stageEl.classList.add('completed');
      if (isOverdue)    stageEl.classList.add('overdue');
      if (!isActive)    stageEl.classList.add('collapsed');

      const header = document.createElement('div');
      header.className = 'stage-header';
      const deadlineText = stage.deadline
        ? (isOverdue ? `¡Atrasado! Límite: ${stage.deadline}` : `Fecha Límite: ${stage.deadline}`)
        : 'Sin fecha límite';
      const status = isCompleted ? 'Completada' : (isActive ? 'Activa' : 'Bloqueada');
      header.innerHTML =
        `<div class="stage-title-container">
           <h2>${stage.title}</h2>
           <span class="deadline-text">${deadlineText}</span>
         </div>
         <span class="status-badge ${status.toLowerCase()}">${status}</span>`;
      header.addEventListener('click', () => { if (!isLocked) stageEl.classList.toggle('collapsed'); });
      stageEl.appendChild(header);

      const content = document.createElement('div');
      content.className = 'stage-tasks';

      if (isActive || isCompleted) {
        const deadlineDiv = document.createElement('div');
        deadlineDiv.className = 'deadline-management';
        deadlineDiv.innerHTML = `<label for="deadline-${si}">Establecer Fecha Límite:</label>`;
        const dateInput = document.createElement('input');
        dateInput.type  = 'date';
        dateInput.id    = `deadline-${si}`;
        dateInput.value = stage.deadline || '';
        dateInput.addEventListener('change', (e) => {
          thesisData.stages[si].deadline = e.target.value;
          saveData(); renderAll();
        });
        deadlineDiv.appendChild(dateInput);
        content.appendChild(deadlineDiv);
      }

      (stage.tasks || []).forEach((task, ti) => {
        const row = document.createElement('div');
        row.className = 'task';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked  = !!task.completed;
        cb.disabled = isLocked;
        cb.addEventListener('change', () => toggleTask(si, ti));
        const label = document.createElement('label');
        label.textContent = task.description;
        row.appendChild(cb); row.appendChild(label);

        if (!isLocked) {
          const actions = document.createElement('div');
          actions.className = 'task-actions';
          const editBtn = document.createElement('button');
          editBtn.className = 'task-action-btn';
          editBtn.title = 'Editar tarea';
          editBtn.textContent = '✏️';
          editBtn.addEventListener('click', () => editTask(si, ti));
          const delBtn = document.createElement('button');
          delBtn.className = 'task-action-btn';
          delBtn.title = 'Eliminar tarea';
          delBtn.textContent = '🗑️';
          delBtn.addEventListener('click', () => deleteTask(si, ti));
          actions.appendChild(editBtn); actions.appendChild(delBtn);
          row.appendChild(actions);
        }
        content.appendChild(row);
      });

      if (!isLocked) {
        const addDiv = document.createElement('div');
        addDiv.className = 'add-task-form';
        const inp = document.createElement('input');
        inp.type = 'text'; inp.placeholder = 'Añadir nueva tarea...';
        const btn = document.createElement('button');
        btn.type = 'button'; btn.textContent = 'Añadir';
        const doAdd = () => { addTask(si, inp.value); inp.value = ''; inp.focus(); };
        btn.addEventListener('click', doAdd);
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } });
        addDiv.appendChild(inp); addDiv.appendChild(btn);
        content.appendChild(addDiv);
      }

      stageEl.appendChild(content);
      roadmapContainer.appendChild(stageEl);
      prevCompleted = isCompleted;
    });
  }

  /* ===== Gantt ===== */
  function renderGanttChart() {
    if (!ganttChartContainer) return;
    ganttChartContainer.innerHTML = '';
    const withDates = (thesisData.stages || []).filter(s => s.deadline);
    if (withDates.length === 0) {
      ganttChartContainer.innerHTML =
        '<p style="grid-column:1/-1;text-align:center;">Establece fechas límite para ver el cronograma.</p>';
      return;
    }
    const day = 86400000;
    let projectStart = new Date(); projectStart.setHours(0,0,0,0);
    const projectEnd = new Date(Math.max(...withDates.map(s => new Date(s.deadline))));
    const totalDays = Math.max(1, Math.ceil((projectEnd - projectStart) / day) + 1);
    let last = projectStart;

    (thesisData.stages || []).forEach(stage => {
      if (!stage.deadline) return;
      const start = new Date(last);
      const end   = new Date(stage.deadline);
      const startOffset = Math.max(0, Math.ceil((start - projectStart) / day));
      const duration    = Math.max(1, Math.ceil((end - start) / day));
      const label = document.createElement('div');
      label.className = 'gantt-label';
      label.textContent = (stage.title.split(':')[1] || stage.title).trim();
      const row = document.createElement('div');
      row.className = 'gantt-row';
      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      bar.style.left  = (startOffset / totalDays * 100) + '%';
      bar.style.width = (duration    / totalDays * 100) + '%';
      const isCompleted = stage.tasks?.every(t => t.completed);
      const isOverdue   = !isCompleted && new Date(stage.deadline) < new Date();
      if (isCompleted) bar.classList.add('completed');
      if (isOverdue)   bar.classList.add('overdue');
      row.appendChild(bar);
      ganttChartContainer.appendChild(label);
      ganttChartContainer.appendChild(row);
      last = stage.deadline;
    });
  }

  /* ===== Orquesta ===== */
  function renderAll() { renderRoadmap(); renderGanttChart(); updateOverallProgress(); }
  renderAll();

  /* ===== Botones opcionales (no fallan si no existen) ===== */
  const resetBtn  = document.getElementById('reset-btn');
  const exportBtn = document.getElementById('export-json');
  const importBtn = document.getElementById('import-json');

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('¿Borrar datos locales y reiniciar?')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const payload = {
        meta: { app: 'Asesor-Tesis', exportedAt: new Date().toISOString() },
        student: JSON.parse(localStorage.getItem(STUDENT_KEY) || '{}'),
        data: thesisData
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'avance.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  if (importBtn) {
    importBtn.addEventListener('click', () => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'application/json';
      inp.onchange = async e => {
        const file = e.target.files[0]; if (!file) return;
        const txt  = await file.text();
        const obj  = JSON.parse(txt);
        if (obj.data?.stages) { thesisData = obj.data; saveData(); renderAll(); }
        if (obj.student) localStorage.setItem(STUDENT_KEY, JSON.stringify(obj.student));
      };
      inp.click();
    });
  }
});
