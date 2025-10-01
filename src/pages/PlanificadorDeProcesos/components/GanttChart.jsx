import React from 'react';
import './GanttChart.css';

const GanttBlock = ({ process, type, start, end, processes, scale }) => {
  const processIndex = processes.findIndex(p => p.nombre === process);
  const backgroundColor = `hsl(${(processIndex * 50) % 360}, 70%, 70%)`;

  // Lógica para determinar el texto del bloque y la clase CSS
  let blockText = '';
  let blockClass = type;

  switch (type) {
    case 'cpu':
      blockText = process;
      blockClass = 'cpu';
      break;
    case 'io':
      blockText = `${process} I/O`;
      blockClass = 'io';
      break;
    case 'tcp':
      blockText = 'TCP';
      blockClass = 'tcp';
      break;
    case 'tip':
      blockText = 'TIP';
      blockClass = 'tip';
      break;
    case 'tfp':
      blockText = 'TFP';
      blockClass = 'tfp';
      break;
    default:
      blockText = process;
      blockClass = type;
      break;
  }

  // Posición y tamaño en píxeles
  const leftPosition = start * scale;
  const topPosition = processIndex * 40;

  const blockWidth = (end - start) * scale;
  return (
    <div
      className={`block ${blockClass}-block`}
      style={{
        position: 'absolute',
        left: `${leftPosition}px`,
        top: `${topPosition}px`,
        width: `${blockWidth}px`,
        backgroundColor: type === 'cpu' ? backgroundColor : ''
      }}
    >
      {blockText}
    </div>
  );
};

function GanttChart({ schedule, processes, totalTime }) {
  const scale = 40; // 40px por unidad de tiempo

  return (
    <div className="gantt-chart__wrapper">
      <div className="gantt-chart__process-labels">
        <div style={{ height: '40px' }}></div>
        {processes.map((p) => (
          <div key={p.nombre} className="gantt-chart__process-label">
            {p.nombre}
          </div>
        ))}
      </div>

      <div className="gantt-chart__scroll-container">
        <div
          className="gantt-chart__time-labels"
          style={{ width: `${totalTime * scale}px` }}
        >
          {Array.from({ length: totalTime + 1 }).map((_, i) => (
            <div
              key={i}
              className="gantt-chart__time-label"
              style={{ left: `${i * scale + 6}px` }}
            >
              {i}
            </div>
          ))}
        </div>

        <div
          className="gantt-chart__grid"
          style={{
            height: `${processes.length * 40}px`,
            width: `${totalTime * scale}px`,
          }}
        >
          {schedule.map((block, idx) => (
            <GanttBlock key={idx} {...block} processes={processes} scale={scale} />
          ))}
        </div>
      </div>
    </div>
  );
}


export default GanttChart;