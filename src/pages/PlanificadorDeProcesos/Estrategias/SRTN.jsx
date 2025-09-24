export default class SRTN {
  constructor() {
    this.name = "SRTN";
  }

  getName() {
    return this.name;
  }
  
  /**
   * Elige el proceso con la ráfaga de CPU restante más corta de la cola de listos.
   * @param {Array} readyQueue - La cola de procesos listos.
   * @returns {Proceso} El proceso seleccionado o null si la cola está vacía.
   */
  seleccionarProceso(readyQueue) {
    if (readyQueue.length === 0) {
      return null;
    }

    // Encuentra el proceso con el menor tiempo de ráfaga de CPU restante
    let procesoSeleccionado = readyQueue[0];
    let indiceSeleccionado = 0;
    
    for (let i = 1; i < readyQueue.length; i++) {
      if (readyQueue[i].rafagaCpuRestante < procesoSeleccionado.rafagaCpuRestante) {
        procesoSeleccionado = readyQueue[i];
        indiceSeleccionado = i;
      }
    }
    
    // Elimina el proceso de la cola y lo devuelve
    return readyQueue.splice(indiceSeleccionado, 1)[0];
  }
}