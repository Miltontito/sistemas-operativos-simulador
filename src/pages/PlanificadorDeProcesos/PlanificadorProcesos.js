import React from 'react'
import "./PlanificadorProcesos.css"
import GanttChart from './components/GanttChart';

function PlanificadorProcesos() {

  // RR quantum 2
  const processes = ["P1", "P2", "P3"];
  const schedule = [
    { process: "P1", start: 0, end: 2 },
    { process: "P2", start: 2, end: 4 },
    { process: "P3", start: 4, end: 6 },
    { process: "P1", start: 6, end: 8 },
    { process: "P2", start: 8, end: 10 },
    { process: "P3", start: 10, end: 12 },
    { process: "P1", start: 12, end: 14 },
  ];

  return (
    <div className='planificador-procesos-container'>
      <h1>Simulador CPU Scheduling</h1>
      <div className='planificador--procesos-container--gantt-chart'>
        <GanttChart schedule={schedule} processes={processes} totalTime={30} />
      </div>
    </div>
  )
}

export default PlanificadorProcesos