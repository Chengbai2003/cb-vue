import { emit } from "./componentEmit"
import { shallowReadonly } from "../reactivity/reactive"
import { initProps } from "./componentProps"
import { PublicInstanceProxyHandlers } from "./componentPubliceInstance"
import { initSlots } from "./componentSlots"
import { proxyRefs } from "../reactivity"

export function createComponentInstance(vnode,parent) {
    // console.log("createComponentInstance",parent)
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => {},
    }
    component.emit = emit.bind(null,component) as any
    return component
}
export function setupComponent(instance) {

    initProps(instance,instance.vnode.props)
    initSlots(instance,instance.vnode.children)

    setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
    const Component = instance.type

    instance.proxy = new Proxy({_:instance},PublicInstanceProxyHandlers)

    const { setup } = Component
    if(setup){
        setCurrentInstance(instance)
        const setupResult = setup(shallowReadonly(instance.props),{
            emit: instance.emit,
        })
        setCurrentInstance(null)

        handleSetupResult(instance,setupResult)
    }
}
function handleSetupResult(instance: any, setupResult: any) {
    // setup:return function, obj
    if(typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult)
    }

    finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
    const Component = instance.type
    instance.render = Component.render
    
}

let currenInstance = null

export function getCurrentInstance() {
    return currenInstance
}

function setCurrentInstance(instance) {
    currenInstance = instance
}