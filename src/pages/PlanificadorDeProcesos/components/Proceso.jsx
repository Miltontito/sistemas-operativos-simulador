export default class Proceso {
    constructor(data) {
        this.nombre = data.nombre;
        this.tiempoArribo = data.tiempo_arribo;
        this.duracionRafagaCpu = data.duracion_rafaga_cpu;
        this.duracionRafagaEs = data.duracion_rafaga_es;
        this.cantidadRafagasCpu = data.cantidad_rafagas_cpu;
        this.prioridad = data.prioridad;

        // Propiedades de la simulación
        this.rafagasRestantes = data.cantidad_rafagas_cpu;
        this.estado = 'NUEVO';
        this.tiempoIngresoListo = 0; // Para algoritmos como FCFS
        this.finIo = 0; // Para el manejo de la cola de bloqueados
    }

    ejecutarRafaga() {
        this.rafagasRestantes--;
    }
}