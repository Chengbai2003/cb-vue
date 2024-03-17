import { isObject } from "../shared/index"
import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers"

export const enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive",
    IS_READONLY = "__v_isReadonly",
}

export function reactive(raw){
    return createReactiveObject(raw,mutableHandlers)
}

export function readonly(raw) {
    return createReactiveObject(raw,readonlyHandlers)
}

export function shallowReadonly(raw) {
    return createReactiveObject(raw,shallowReadonlyHandlers)
}

function createReactiveObject(target: any,baseHandlers) {
    if(!isObject(target)){
        console.warn(`target ${target} 必须是一个对象`)
        return target
    }
    return new Proxy(target, baseHandlers)
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
