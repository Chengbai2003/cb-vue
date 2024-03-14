import { hasChanged, isObject } from '../shared'
import { trackEffects,triggerEffects,isTracking } from './effect'
import { reactive } from './reactive'

// 单值的话并不能通过proxy代理，因此另开一个逻辑，给它挂载到value属性下

class RefImpl {
    private _value: any
    public dep
    private _rawValue: any
    private _v_isRef = true
    constructor(value){
        // 以防对比时 存储值是已转化为proxy代理对象
        this._rawValue = value
        this._value = convert(value)
        
        this.dep = new Set()
    }
    get value() {
        trackRefValue(this)
        return this._value
    }

    set value(newVal) {
        if(hasChanged(this._rawValue,newVal)) {
            this._rawValue = newVal
            this._value = convert(newVal)
            triggerEffects(this.dep)
        }
    }
}

function convert(val) {
    return isObject(val) ? reactive(val) : val
}

function trackRefValue(ref: RefImpl) {
    if(isTracking()) {
        trackEffects(ref.dep)
    }
}

export function ref(value){
    return new RefImpl(value)
}

// isRef and unRef

export function isRef(ref) {
    return !!ref._v_isRef
}

export function unRef(ref){
    return isRef(ref) ? ref.value : ref
}

export function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs,{
      get(target,key){
        return unRef(Reflect.get(target,key))
      },

      set(target,key,value){
        if(isRef(target[key]) && !isRef(value)){
            return (target[key].value = value)
        }else {
            return Reflect.set(target,key,value)
        }
      }
    })
}