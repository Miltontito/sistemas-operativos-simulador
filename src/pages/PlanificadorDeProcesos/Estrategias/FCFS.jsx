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
    const schedule = [];
    let currentTime = 0;

    // Cola de listos y bloqueados
    let readyQueue = [];
    let blocked = [];

    // Clonar procesos
    const procesosSimulacion = JSON.parse(JSON.stringify(procesos)).map(p => ({
      ...p,
      rafagas_restantes: p.cantidad_rafagas_cpu,
      estado: "NUEVO"
    }));

    const procesosFinalizados = [];

    while (procesosFinalizados.length < procesosSimulacion.length) {
      // 1. Procesos que llegan
      for (const p of procesosSimulacion) {
        if (p.estado === "NUEVO" && currentTime >= p.tiempo_arribo) {
          const startTip = currentTime;
          const endTip = startTip + this.tip;

          if (this.tip > 0) {
            schedule.push({ process: p.nombre, start: startTip, end: endTip, type: "tip" });
          }

          currentTime = endTip;
          p.estado = "LISTO";
          p.tiempo_ingreso_listo = currentTime;
          readyQueue.push(p);
        }
      }

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
      const procesoActual = readyQueue.shift();

      // 4. TCP antes de ejecutar CPU
      if (this.tcp > 0) {
        schedule.push({
          process: procesoActual.nombre,
          start: currentTime,
          end: currentTime + this.tcp,
          type: "tcp"
        });
        currentTime += this.tcp;
      }

      // 5. Ejecutar ráfaga de CPU completa
      const startCpu = currentTime;
      const endCpu = startCpu + procesoActual.duracion_rafaga_cpu;
      schedule.push({
        process: procesoActual.nombre,
        start: startCpu,
        end: endCpu,
        type: "cpu"
      });
      currentTime = endCpu;

      procesoActual.rafagas_restantes--;

      if (procesoActual.rafagas_restantes === 0) {
        // 6. Proceso finaliza
        if (this.tfp > 0) {
          schedule.push({
            process: procesoActual.nombre,
            start: currentTime,
            end: currentTime + this.tfp,
            type: "tfp"
          });
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
