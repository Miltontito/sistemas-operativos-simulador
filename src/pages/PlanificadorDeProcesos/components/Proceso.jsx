export default class Proceso {
    constructor(data) {
        this.nombre = data.nombre;
        this.tiempoArribo = data.tiempo_arribo;
        this.duracionRafagaCpu = data.duracion_rafaga_cpu;
        this.duracionRafagaEs = data.duracion_rafaga_es;
        this.cantidadRafagasCpu = data.cantidad_rafagas_cpu;
        // Se asume que el campo de entrada es prioridad_externa
        this.prioridad = data.prioridad_externa; 

        // Propiedades de la simulación
        this.rafagasRestantes = data.cantidad_rafagas_cpu;
        this.rafagaCpuRestante = data.duracion_rafaga_cpu; 
        this.estado = 'NUEVO';
        this.tiempoIngresoListo = 0; // Marca de tiempo cuando entra a LISTO
        this.finIo = 0; // Para el manejo de la cola de bloqueados
        
        // Propiedades de las Métricas (NUEVO)
        this.tiempoFinalizacion = 0; 
        this.tiempoEnListo = 0; // Tiempo total acumulado en la cola de listos (Waiting Time)
    }
}