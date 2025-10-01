export default class SPN {
  constructor() {
    this.name = "SPN";
  }

  getName() {
    return this.name;
  }
  
  /**
   * Elige el proceso con la ráfaga de CPU más corta de la cola de listos.
   * @param {Array} readyQueue - La cola de procesos listos.
   * @returns {Proceso} El proceso seleccionado o null si la cola está vacía.
   */
  seleccionarProceso(readyQueue) {
    if (readyQueue.length === 0) {
      return null;
    }
    
    // Elige el proceso con la menor duración de ráfaga de CPU.
    // Esto es un enfoque simplista. En un sistema real, el planificador lo sabría de antemano.
    let procesoSeleccionado = readyQueue[0];
    let indiceSeleccionado = 0;

    for (let i = 1; i < readyQueue.length; i++) {
      if (readyQueue[i].duracionRafagaCpu < procesoSeleccionado.duracionRafagaCpu) {
        procesoSeleccionado = readyQueue[i];
        indiceSeleccionado = i;
      }
    }
    
    // Elimina el proceso de la cola y lo devuelve
    return readyQueue.splice(indiceSeleccionado, 1)[0];
  }
}