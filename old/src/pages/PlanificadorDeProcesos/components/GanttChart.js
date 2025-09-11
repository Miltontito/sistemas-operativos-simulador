import React from "react";
import "./GanttChart.css";

function GanttChart({ schedule, processes, totalTime }) {
  return (
    <div className="gantt-wrapper">
      {/* Etiquetas de procesos fijas */}
      <div className="process-labels">
        {processes.map((p, i) => (
          <div key={p} className="process-label" style={{ top: i * 40 + 40 }}>
            {p}
          </div>
        ))}
      </div>

      {/* Contenedor scrollable */}
      <div className="gantt-scroll">
        {/* Etiquetas de tiempo */}
        <div
          className="time-labels"
          style={{ gridTemplateColumns: `repeat(${totalTime}, 40px)` }}
        >
          {Array.from({ length: totalTime }).map((_, i) => (
            <div key={i} className="time-label">
              {i}
            </div>
          ))}
        </div>

        <div
          className="gantt"
          style={{
            gridTemplateRows: `repeat(${processes.length}, 40px)`,
            gridTemplateColumns: `repeat(${totalTime}, 40px)`
          }}
        >
          {/* CPU Blocks */}
          {schedule
            .filter((block) => block.type === "cpu")
            .map((block, idx) => (
              <div
                key={idx}
                className="block cpu-block"
                style={{
                  gridRow: processes.indexOf(block.process) + 1,
                  gridColumn: `${block.start + 1} / ${block.end + 1}`,
                  backgroundColor: `hsl(${
                    (processes.indexOf(block.process) * 50) % 360
                  }, 70%, 70%)`
                }}
              >
                {block.process}
              </div>
            ))}

          {/* IO Blocks (superpuestos arriba de todo) */}
          {schedule
            .filter((block) => block.type === "io")
            .map((block, idx) => (
              <div
                key={`io-${idx}`}
                className="block io-block"
                style={{
                  gridRow: processes.indexOf(block.process) + 1,
                  gridColumn: `${block.start + 1} / ${block.end + 1}`
                }}
              >
                {block.process} I/O
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default GanttChart;
