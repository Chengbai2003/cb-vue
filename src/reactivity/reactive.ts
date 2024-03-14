import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers"

export const enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive",
    IS_READONLY = "__v_isReadonly",
}

export function reactive(raw){
    return createActiveObject(raw,mutableHandlers)
}

export function readonly(raw) {
    return createActiveObject(raw,readonlyHandlers)
}

export function shallowReadonly(raw) {
    return createActiveObject(raw,shallowReadonlyHandlers)
}

function createActiveObject(raw: any,baseHandlers) {
    return new Proxy(raw, baseHandlers)
}

export function isReactive(value: any) {
    // 因为 不是reactive 就不会触发get 那么取值就是undefined 对其强转即可
    return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(value: any) {
    return !!value[ReactiveFlags.IS_READONLY]
}


export function isProxy(value){
    return isReactive(value) || isReadonly(value)
}
