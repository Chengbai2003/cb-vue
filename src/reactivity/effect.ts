import { extend } from "../shared"

class ReactiveEffect {
    private _fn: any
    deps = []
    onStop?: () => void
    active = true
    public scheduler: Function | undefined
    //  加上public 外面才能获取到 也就是 effct.scheduler
    constructor(fn, scheduler?: Function) {
        this._fn = fn
        this.scheduler = scheduler
    }
    run() {
        activeEffect = this
        return this._fn()
    }
    stop() {
        // 性能问题 频繁调用清空 但是第一次已经清空
        if(this.active){
            cleanupEffect(this)
            if(this.onStop) {
                this.onStop()
            }
            this.active = false
        }
    }
}

function cleanupEffect(effct) {
    effct.deps.forEach((dep: any) => dep.delete(effct))
}

const targetMap = new Map()
export function track(target, key) {
    // target -> key -> dep
    let depsMap = targetMap.get(target)
    if(!depsMap) {
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }
    let dep = depsMap.get(key)
    if(!dep){
        dep = new Set()
        depsMap.set(key, dep)
    }

    if(!activeEffect) return

    dep.add(activeEffect)
    activeEffect.deps.push(dep)
}
export function trigger(target, key){
    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)

    for(const effect of dep){
        if(effect.scheduler) {
            effect.scheduler()
        }else {
            effect.run()
        }
    }
}

let activeEffect
export function effect(fn, options: any = {}) {
    // fn
    const _effect = new ReactiveEffect(fn,options.scheduler)
    // 后续可能更多 options 
    // _effect.onStop = options.onStop
    extend(_effect, options)

    _effect.run()

    const runner: any = _effect.run.bind(_effect)
    runner.effect = _effect

    return runner
}

export function stop(runner){
    runner.effect.stop()
}