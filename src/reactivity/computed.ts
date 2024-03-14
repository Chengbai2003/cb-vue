import { ReactiveEffect } from "./effect"

class ComputedRefImpl {
    private _getter: any
    private _dirty: boolean = true  // 当执行时只执行一次函数(也就是具有缓存),下一次重新设值才解开
    private _value: any
    private _effect: ReactiveEffect
    constructor(getter) {
        this._getter = getter
        // 利用 shecduler 改变的时候不去更新，读取的时候再更新
        this._effect = new ReactiveEffect(getter,() => {
            if(!this._dirty){
                this._dirty = true
            }
        })
    }
    get value(){
        if(this._dirty){
            this._dirty = false
            this._value = this._effect.run()
        }
        return this._value
    }
}

export function computed(getter) {
    return new ComputedRefImpl(getter)
}