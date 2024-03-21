import { extend } from "../shared/index"

let shouldTrack
let activeEffect

export class ReactiveEffect {
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
        // 避免重复收集
        if(!this.active){
            return this._fn()
        }

        // 执行fn 并 收集依赖
        activeEffect = this
        shouldTrack = true
        const result = this._fn()
        activeEffect = undefined
        shouldTrack = false
        return result
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
    effct.deps.length = 0
}

const targetMap = new Map()
export function track(target, key) {
    if(!isTracking()){
        return
    }
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
    trackEffects(dep)
}

export function trackEffects(dep) {
    if(dep.has(activeEffect)) return
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
}


export function isTracking() {
    return shouldTrack && activeEffect !== undefined
}

export function trigger(target, key){
    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)

    triggerEffects(dep)
}

export function triggerEffects(dep) {
    for(const effect of dep){
        if(effect.scheduler) {
            effect.scheduler()
        }else {
            effect.run()
        }
    }
}

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