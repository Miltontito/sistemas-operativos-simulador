// src/Estrategias/FCFS.js
export default class FCFS {
  constructor(tip = 0, tfp = 0, tcp = 0) {
    this.tip = Number(tip);
    this.tfp = Number(tfp);
    this.tcp = Number(tcp);
  }

  getName() {
    return "FCFS";
  }

  simular(procesos) {

    // El schedule es la salida.
    // Arreglo de:
    // { process: nombre, start: inicio, end: fin, type: ENUM("tip", "tcp", "cpu", "tfp", "I/O") }
    const schedule = [];

    // Tiempo actual.
    let currentTime = 0;

    // Cola de listos y bloqueados
    let readyQueue = [];
    let blocked = [];

    // Clonar procesos
    const procesosSimulacion = JSON.parse(JSON.stringify(procesos)).map(p => ({
      ...p,
      rafagas_restantes: p.cantidad_rafagas_cpu, // Agregamos las rafagas restantes antes de terminar
      estado: "NUEVO" // Estado actual del proceso
    }));

    // Lista de procesos Finalizados
    const procesosFinalizados = [];

    procesosSimulacion.sort((a, b) => a.tiempo_arribo - b.tiempo_arribo);

    // Mientas los "procesos terminados" sea menor a "la cantidad de procesos totales" 
    while (procesosFinalizados.length < procesosSimulacion.length) {
      
      // 1. Procesos que llegan
      for (const p of procesosSimulacion) { // Por cada "proceso" en "ProcesosSimulacion"

        // Si el proceso esta en la cola de "NUEVO" y si el tiempo actual es mayor o igual que el "tiempo de arribo del proceso"
        // La cola de "LISTOS" debe estar vacía ya que se prioriza esta 
        if (p.estado === "NUEVO" && currentTime >= p.tiempo_arribo && (readyQueue.length < 1)) {
          
          // Inicio de del TIP = tiempo actual
          const startTip = currentTime;

          // Fin del TIP = inicio de TIP + tiempoDeTIP
          const endTip = startTip + this.tip;

          // Si el tiempoDeTIP es mayor a 0 lo agregamos al schedule.
          if (this.tip > 0) {
            schedule.push({ process: p.nombre, start: startTip, end: endTip, type: "tip" });
          }

          // Seteamos el currentTime al final del TIP
          currentTime = endTip;

          // Seteamos el estado del proceso a "LISTO"
          p.estado = "LISTO";

          // seteamos el tiempo desde que está listo
          p.tiempo_ingreso_listo = currentTime;

          // Movemos el proceso a la cola de "LISTOS"
          readyQueue.push(p);
        }
      }

      // ????????????????????????
      // que chota es filter y que mierda hace esto
      // 2. Procesos que terminan I/O
      blocked = blocked.filter(p => {
        if (currentTime >= p.fin_io) {
          p.estado = "LISTO";
          p.tiempo_ingreso_listo = currentTime;
          readyQueue.push(p);
          return false;
        }
        return true;
      });
      

      // ????????????
      if (readyQueue.length === 0) {
        // Si no hay nada listo, adelantamos al siguiente evento (arribo o fin de I/O)
        const proxArribo = procesosSimulacion
          .filter(p => p.estado === "NUEVO")
          .map(p => p.tiempo_arribo)[0];

        const proxIo = blocked.map(p => p.fin_io)[0];
        const nextEvent = Math.min(
          proxArribo !== undefined ? proxArribo : Infinity,
          proxIo !== undefined ? proxIo : Infinity
        );

        currentTime = nextEvent !== Infinity ? nextEvent : currentTime + 1;
        continue;
      }

      // 3. Seleccionamos el primer proceso (FIFO)
      // redyQueue.pop(); 
      const procesoActual = readyQueue.shift();


      // 4. TCP antes de ejecutar CPU
      if (this.tcp > 0) {
        schedule.push({process: procesoActual.nombre, start: currentTime, end: currentTime + this.tcp, type: "tcp"});
        currentTime += this.tcp;
      }

      // 5. Ejecutar ráfaga de CPU completa
      const startCpu = currentTime;
      const endCpu = startCpu + procesoActual.duracion_rafaga_cpu;
      schedule.push({process: procesoActual.nombre, start: startCpu, end: endCpu, type: "cpu"});
      currentTime = endCpu;

      procesoActual.rafagas_restantes--;

      if (procesoActual.rafagas_restantes === 0) {

        // 6. Proceso finaliza
        if (this.tfp > 0) {
          schedule.push({process: procesoActual.nombre, start: currentTime, end: currentTime + this.tfp, type: "tfp"});
          currentTime += this.tfp;
        }
        procesoActual.estado = "TERMINADO";
        procesosFinalizados.push(procesoActual);
      } else {
        // 7. Proceso bloqueado en I/O
        const startIo = currentTime;
        const endIo = startIo + procesoActual.duracion_rafaga_es;
        schedule.push({
          process: procesoActual.nombre,
          start: startIo,
          end: endIo,
          type: "io"
        });

        procesoActual.estado = "BLOQUEADO";
        procesoActual.fin_io = endIo;
        blocked.push(procesoActual);
      }
    }

    return {
      schedule,
      totalTime: currentTime
    };
  }
}
