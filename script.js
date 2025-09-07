document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* ====== Claves de storage ====== */
  var STORAGE_KEY = 'thesisProgress';
  var STUDENT_KEY = 'thesisStudent';

  /* ====== Data por defecto (6 fases) ====== */
  var defaultThesisData = {
  // NUEVO OBJETO AÑADIDO AQUÍ
  projectInfo: {
    title: '',
    studentName: '',
    studentId: '',
    studentGroup: ''
  },
  stages: [
      {
        title: 'Fase 1: Elección y Delimitación del Tema',
        deadline: null,
        tasks: [
          { description: 'Realizar lluvia de ideas sobre posibles temas.', completed: false },
          { description: 'Investigar antecedentes de los temas seleccionados.', completed: false },
          { description: 'Definir el tema final y delimitar su alcance.', completed: false }
        ]
      },
      {
        title: 'Fase 2: Planteamiento del Problema',
        deadline: null,
        tasks: [
          { description: 'Redactar la descripción del problema.', completed: false },
          { description: 'Formular la pregunta de investigación principal.', completed: false },
          { description: 'Formular preguntas de investigación secundarias.', completed: false },
          { description: 'Escribir la justificación e importancia del estudio.', completed: false }
        ]
      },
      {
        title: 'Fase 3: Construcción del Marco Teórico',
        deadline: null,
        tasks: [
          { description: 'Identificar las bases teóricas clave.', completed: false },
          { description: 'Buscar y recopilar literatura relevante (artículos, libros).', completed: false },
          { description: 'Redactar los antecedentes de la investigación.', completed: false },
          { description: 'Desarrollar los conceptos y teorías centrales.', completed: false }
        ]
      },
      {
        title: 'Fase 4: Diseño Metodológico',
        deadline: null,
        tasks: [
          { description: 'Definir el enfoque de la investigación (cualitativo, cuantitativo, mixto).', completed: false },
          { description: 'Seleccionar y describir la población y muestra.', completed: false },
          { description: 'Diseñar los instrumentos de recolección de datos.', completed: false },
          { description: 'Describir el procedimiento para el análisis de datos.', completed: false }
        ]
      },
      {
        title: 'Fase 5: Resultados y Discusión',
        deadline: null,
        tasks: [
          { description: 'Preparar y depurar los datos / transcripciones.', completed: false },
          { description: 'Realizar el análisis (estadístico o temático).', completed: false },
          { description: 'Generar tablas, figuras y visualizaciones clave.', completed: false },
          { description: 'Redactar resultados y discutirlos con el marco teórico.', completed: false }
        ]
      },
      {
        title: 'Fase 6: Conclusiones y Recomendaciones',
        deadline: null,
        tasks: [
          { description: 'Sintetizar hallazgos y responder a la pregunta de investigación.', completed: false },
          { description: 'Redactar conclusiones alineadas con los objetivos.', completed: false },
          { description: 'Formular recomendaciones aplicables (defensa y seguridad).', completed: false },
          { description: 'Presentación y resumen ejecutivo de cierre.', completed: false }
        ]
      }
    ]
  };

  /* ====== Utilidades ====== */
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : clone(defaultThesisData);
    } catch (e) {
      return clone(defaultThesisData);
    }
  }
  function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(thesisData)); }

  var thesisData = loadData();

  /* ====== Migración: garantiza Fase 5 y 6 si el usuario tenía datos viejos ====== */
  (function ensureStages() {
    function have(t) {
      return (thesisData.stages || []).some(function (s) { return s.title === t; });
    }
    if (!have('Fase 5: Resultados y Discusión')) {
      thesisData.stages.push(clone(defaultThesisData.stages[4]));
    }
    if (!have('Fase 6: Conclusiones y Recomendaciones')) {
      thesisData.stages.push(clone(defaultThesisData.stages[5]));
    }
    saveData();
  })();

  /* ====== Cache de nodos ====== */
  var roadmapContainer = document.getElementById('thesis-roadmap');
  var ganttChartContainer = document.getElementById('gantt-chart');
  var progressBar = document.getElementById('progress-bar');
  var progressText = document.getElementById('progress-text');
  
  // --- NUEVO: Lógica para la información del proyecto ---
var projectTitleInput = document.getElementById('project-title');
var studentNameInput = document.getElementById('student-name');
var studentIdInput = document.getElementById('student-id');
var studentGroupInput = document.getElementById('student-group');

function renderProjectInfo() {
    if(projectTitleInput) projectTitleInput.value = thesisData.projectInfo.title || '';
    if(studentNameInput) studentNameInput.value = thesisData.projectInfo.studentName || '';
    if(studentIdInput) studentIdInput.value = thesisData.projectInfo.studentId || '';
    if(studentGroupInput) studentGroupInput.value = thesisData.projectInfo.studentGroup || '';
}

function setupInfoListeners() {
    function handleInput(event) {
        var keyMap = {
            'project-title': 'title',
            'student-name': 'studentName',
            'student-id': 'studentId',
            'student-group': 'studentGroup'
        };
        var key = keyMap[event.target.id];
        if (key) {
            thesisData.projectInfo[key] = event.target.value;
            saveData();
        }
    }
    if(projectTitleInput) projectTitleInput.addEventListener('input', handleInput);
    if(studentNameInput) studentNameInput.addEventListener('input', handleInput);
    if(studentIdInput) studentIdInput.addEventListener('input', handleInput);
    if(studentGroupInput) studentGroupInput.addEventListener('input', handleInput);
}
  /* ====== Progreso general ====== */
  function updateOverallProgress() {
    var total = 0, done = 0;
    (thesisData.stages || []).forEach(function (s) {
      (s.tasks || []).forEach(function (t) { total += 1; if (t.completed) done += 1; });
    });
    var pct = total ? Math.round((done / total) * 100) : 0;
    if (progressBar) {
      progressBar.style.width = pct + '%';
      progressBar.style.background = (pct >= 80) ? '#28a745' : (pct >= 40 ? '#ffc107' : '#dc3545');
    }
    if (progressText) progressText.textContent = 'Progreso general: ' + pct + '%';
  }

  /* ====== Acciones de tareas ====== */
  function toggleTask(si, ti) {
    var t = thesisData.stages[si].tasks[ti];
    t.completed = !t.completed;
    saveData(); renderAll();
  }
  function addTask(si, txt) {
    var d = (txt || '').trim(); if (!d) return;
    thesisData.stages[si].tasks.push({ description: d, completed: false });
    saveData(); renderAll();
  }
  function editTask(si, ti) {
    var cur = thesisData.stages[si].tasks[ti].description;
    var n = prompt('Edita tu tarea:', cur);
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

  /* ====== Render del roadmap ====== */
  function renderRoadmap() {
    if (!roadmapContainer) return;
    roadmapContainer.innerHTML = '';

    var prevCompleted = true;
    var today = new Date(); today.setHours(0,0,0,0);

    (thesisData.stages || []).forEach(function (stage, si) {
      var isCompleted = (stage.tasks && stage.tasks.length > 0) &&
                        stage.tasks.every(function (t) { return t.completed; });
      var isLocked  = !prevCompleted;
      var isActive  = !isLocked && !isCompleted;
      var isOverdue = isActive && stage.deadline && (new Date(stage.deadline) < today);

      var stageEl = document.createElement('div');
      stageEl.className = 'stage';
      if (isLocked)    stageEl.classList.add('locked');
      if (isCompleted) stageEl.classList.add('completed');
      if (isOverdue)   stageEl.classList.add('overdue');
      if (!isActive)   stageEl.classList.add('collapsed');

      // Header
      var header = document.createElement('div');
      header.className = 'stage-header';

      var titleBox = document.createElement('div');
      titleBox.className = 'stage-title-container';
      var h2 = document.createElement('h2'); h2.textContent = stage.title;
      var dl = document.createElement('span'); dl.className = 'deadline-text';
      dl.textContent = stage.deadline
        ? (isOverdue ? '¡Atrasado! Límite: ' + stage.deadline : 'Fecha Límite: ' + stage.deadline)
        : 'Sin fecha límite';
      titleBox.appendChild(h2); titleBox.appendChild(dl);

      var status = isCompleted ? 'Completada' : (isActive ? 'Activa' : 'Bloqueada');
      var badge = document.createElement('span');
      badge.className = 'status-badge ' + status.toLowerCase();
      badge.textContent = status;

      header.appendChild(titleBox);
      header.appendChild(badge);
      header.addEventListener('click', function () { if (!isLocked) stageEl.classList.toggle('collapsed'); });
      stageEl.appendChild(header);

      // Contenido
      var content = document.createElement('div');
      content.className = 'stage-tasks';

      if (isActive || isCompleted) {
        var dDiv = document.createElement('div');
        dDiv.className = 'deadline-management';
        var lbl = document.createElement('label');
        lbl.setAttribute('for', 'deadline-' + si);
        lbl.textContent = 'Establecer Fecha Límite:';
        var inp = document.createElement('input');
        inp.type = 'date'; inp.id = 'deadline-' + si; inp.value = stage.deadline || '';
        inp.addEventListener('change', function (e) {
          thesisData.stages[si].deadline = e.target.value;
          saveData(); renderAll();
        });
        dDiv.appendChild(lbl); dDiv.appendChild(inp);
        content.appendChild(dDiv);
      }

      (stage.tasks || []).forEach(function (task, ti) {
        var row = document.createElement('div'); row.className = 'task';
        var cb = document.createElement('input'); cb.type = 'checkbox';
        cb.checked = !!task.completed; cb.disabled = isLocked;
        cb.addEventListener('change', function () { toggleTask(si, ti); });
        var lab = document.createElement('label'); lab.textContent = task.description;
        row.appendChild(cb); row.appendChild(lab);

        if (!isLocked) {
          var actions = document.createElement('div'); actions.className = 'task-actions';
          var editB = document.createElement('button'); editB.className = 'task-action-btn'; editB.title = 'Editar tarea'; editB.textContent = '✏️';
          editB.addEventListener('click', function () { editTask(si, ti); });
          var delB = document.createElement('button'); delB.className = 'task-action-btn'; delB.title = 'Eliminar tarea'; delB.textContent = '🗑️';
          delB.addEventListener('click', function () { deleteTask(si, ti); });
          actions.appendChild(editB); actions.appendChild(delB);
          row.appendChild(actions);
        }
        content.appendChild(row);
      });

      if (!isLocked) {
        var addDiv = document.createElement('div'); addDiv.className = 'add-task-form';
        var ninp = document.createElement('input'); ninp.type = 'text'; ninp.placeholder = 'Añadir nueva tarea...';
        var nbtn = document.createElement('button'); nbtn.type = 'button'; nbtn.textContent = 'Añadir';
        function doAdd() { addTask(si, ninp.value); ninp.value=''; ninp.focus(); }
        nbtn.addEventListener('click', doAdd);
        ninp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } });
        addDiv.appendChild(ninp); addDiv.appendChild(nbtn);
        content.appendChild(addDiv);
      }

      stageEl.appendChild(content);
      roadmapContainer.appendChild(stageEl);
      prevCompleted = isCompleted;
    });
  }

  /* ====== Gantt ====== */
  function renderGanttChart() {
    if (!ganttChartContainer) return;
    ganttChartContainer.innerHTML = '';

    var withDates = (thesisData.stages || []).filter(function (s) { return !!s.deadline; });
    if (withDates.length === 0) {
      var p = document.createElement('p');
      p.style.gridColumn = '1 / -1';
      p.style.textAlign = 'center';
      p.textContent = 'Establece fechas límite para ver el cronograma.';
      ganttChartContainer.appendChild(p);
      return;
    }

    var day = 86400000;
    var projectStart = new Date(); projectStart.setHours(0,0,0,0);
    var projectEnd = new Date(Math.max.apply(null, withDates.map(function (s) { return new Date(s.deadline); })));
    var totalDays = Math.max(1, Math.ceil((projectEnd - projectStart) / day) + 1);
    var last = projectStart;

    (thesisData.stages || []).forEach(function (stage) {
      if (!stage.deadline) return;
      var start = new Date(last);
      var end = new Date(stage.deadline);
      var startOffset = Math.max(0, Math.ceil((start - projectStart) / day));
      var duration = Math.max(1, Math.ceil((end - start) / day));

      var label = document.createElement('div'); label.className = 'gantt-label';
      var titleParts = stage.title.split(':'); label.textContent = (titleParts[1] ? titleParts[1] : stage.title).trim();
      var row = document.createElement('div'); row.className = 'gantt-row';
      var bar = document.createElement('div'); bar.className = 'gantt-bar';
      bar.style.left = (startOffset / totalDays * 100) + '%';
      bar.style.width = (duration / totalDays * 100) + '%';

      var isCompleted = (stage.tasks || []).every(function (t) { return t.completed; });
      var isOverdue = !isCompleted && (new Date(stage.deadline) < new Date());
      if (isCompleted) bar.classList.add('completed');
      if (isOverdue)   bar.classList.add('overdue');

      row.appendChild(bar);
      ganttChartContainer.appendChild(label);
      ganttChartContainer.appendChild(row);
      last = stage.deadline;
    });
  }

  /* ====== Orquesta ====== */
function renderAll() { 
    renderRoadmap(); 
    renderGanttChart(); 
    updateOverallProgress(); 
    renderProjectInfo(); 
  
renderAll();
setupInfoListeners(); 

/* ====== Exportar/Importar/Reset (opcionales) ====== */
var resetBtn = document.getElementById('reset-btn');
var exportBtn = document.getElementById('export-json');
var importFileInput = document.getElementById('import-json'); // Corregido para apuntar al input de archivo

if (resetBtn) {
    resetBtn.addEventListener('click', function () {
        if (confirm('¿Borrar todo el progreso y reiniciar la aplicación?')) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STUDENT_KEY);
            location.reload();
        }
    });
}

if (exportBtn) {
    exportBtn.addEventListener('click', function () {
        var payload = {
            meta: { app: 'Asesor-Tesis', exportedAt: new Date().toISOString() },
            student: JSON.parse(localStorage.getItem(STUDENT_KEY) || '{}'),
            data: thesisData
        };
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'asesor-tesis-avance.json';
        a.click();
        URL.revokeObjectURL(a.href);
    });
}

if (importFileInput) {
    importFileInput.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function (event) {
            try {
                var obj = JSON.parse(event.target.result);
                if (obj && obj.data && obj.data.stages) {
                    thesisData = obj.data;
                    saveData();
                    renderAll();
                    alert('¡Progreso importado con éxito!');
                }
                if (obj && obj.student) {
                    localStorage.setItem(STUDENT_KEY, JSON.stringify(obj.student));
                    renderAll(); // Para actualizar los campos del estudiante
                }
            } catch (error) {
                alert('Error: El archivo no es válido o está corrupto.');
            }
        };
        reader.readAsText(file);
    });
}

}); // Fin del DOMContentLoaded






