export default class PrioridadExterna {
  constructor() {
    this.name = "Prioridad Externa";
  }

  getName() {
    return this.name;
  }
  
  /**
   * Elige el proceso con la prioridad más alta (valor numérico más bajo) de la cola de listos.
   * Si hay empate, se usa FCFS (el que llegó primero a la cola de listos).
   * @param {Array} readyQueue - La cola de procesos listos.
   * @returns {Proceso} El proceso seleccionado o null si la cola está vacía.
   */
  seleccionarProceso(readyQueue) {
    if (readyQueue.length === 0) {
      return null;
    }
    
    // Ordena la cola de listos por prioridad ascendente.
    // Si la prioridad es la misma, se usa el tiempo de llegada a la cola (FCFS).
    readyQueue.sort((a, b) => {
      if (a.prioridad < b.prioridad) return -1;
      if (a.prioridad > b.prioridad) return 1;
      // En caso de empate, usa FCFS
      return a.tiempoIngresoListo - b.tiempoIngresoListo;
    });

    // Elimina y devuelve el primer proceso (el de mayor prioridad)
    return readyQueue.shift();
  }
}