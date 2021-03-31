
import util from 'util';

export interface EventHandlerTarget {
    on(type: string, listener: (...params: any[]) => any): void
    off(type: string, listener: (...params: any[]) => any): void
}

export default class EventHandlerBlock {
    public listeners = new Map<string, (() => void)[]>();
    public target: EventHandlerTarget

    constructor() {

    }

    bind(event: string, handler: (event: Event) => void) {
        if(this.listeners.has(event)) {
            this.unbind(event)
        }
        const self = this
        let listener = null

        if(util.types.isAsyncFunction(handler)) {
            listener = async function () {
                await handler.apply(self, arguments)
            }
        } else {
            listener = function () {
                handler.apply(self, arguments)
            }
        }

        if(this.listeners.has(event)) {
            this.listeners.get(event).push(listener)
        } else {
            this.listeners.set(event, [listener])
        }

        if(this.target) this.target.on(event, listener)
    }

    unbind(event: string) {
        if(!this.target) return

        if(this.target) {
            for(let listener of this.listeners.get(event)) {
                this.target.off(event, listener)
            }
        }
        this.listeners.delete(event)
    }

    private unbindTarget(target: EventHandlerTarget) {
        for(let [key, listeners] of this.listeners.entries()) {
            for(let listener of listeners) {
                target.off(key, listener)
            }
        }
    }

    private bindTarget(target: EventHandlerTarget) {
        for(let [key, listeners] of this.listeners.entries()) {
            for(let listener of listeners) {
                target.on(key, listener)
            }
        }
    }

    setTarget(target: EventHandlerTarget) {
        if(this.target) this.unbindTarget(this.target)
        if(target) this.bindTarget(target)
    }
}