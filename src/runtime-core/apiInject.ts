import { getCurrentInstance } from "./component";


export function provide (key, value) {
    // 存
    const currenInstance:any = getCurrentInstance()

    if(currenInstance){
        let { provides } = currenInstance
        const parentProvides = currenInstance.parent.provides
        // init 只执行一次 利用原型链 查找
        if(parentProvides === provides){
            provides = currenInstance.provides = Object.create(parentProvides)
        }
        provides[key] = value
    }
}

export function inject (key,defaultValue?) {
    // 取
    const currenInstance:any = getCurrentInstance()
    if(currenInstance) {
        const {parent} = currenInstance
        const parentProvides = currenInstance.parent.provides
        if(key in parentProvides){
            return parentProvides[key]
        }else if(defaultValue) {
            if(typeof defaultValue === 'function'){
                return defaultValue()
            }
            return defaultValue
        }
    }
}

