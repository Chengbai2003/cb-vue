import { isObject } from "../shared/index"
import { createComponentInstance, setupComponent } from "./component"
import { ShapeFlags } from "../shared/ShapeFlags"

export function render(vnode, container) {
    // patch 
    patch(vnode,container)
}

function patch(vnode, container) {
    // shapeFlags: vnode -> flag

    // 去处理组件
    // 判断是不是 element, vnode.type 是对象就是组件节点
    const { shapeFlag } = vnode
    if(shapeFlag & ShapeFlags.ELEMENT){
        processElement(vnode,container)
    }else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT){
        processComponent(vnode, container)
    }
}


function processElement(vnode: any, container: any) {
    mountElement(vnode,container)
}

function processComponent(vnode, container) {
    // 挂载
    mountComponent(vnode,container)
}

function mountElement(vnode: any, container: any) {
    const el = (vnode.el = document.createElement(vnode.type))
    
    const { children, props, shapeFlag } = vnode
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
        el.textContent = children
    } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
        mountChildren(children,el)
    }
    
    for (const key in props) {
       const val = props[key]
       const isOn = (key) => /^on[A-Z]/.test(key)
       if(isOn(key)){
        const event = key.slice(2).toLowerCase()
        el.addEventListener(event,val)
       }else {
        el.setAttribute(key,val)
       }
    }
    container.append(el)
}
// 抽离出来
function mountChildren(vnode: any,container: any) {
    vnode.forEach(v => {
        patch(v,container)
    })
}

function mountComponent(initialVnode: any,container: any) {
    const instance = createComponentInstance(initialVnode)

    setupComponent(instance)
    setupRenderEffect(instance,initialVnode,container)
}



function setupRenderEffect(instance: any, initialVnode,container: any) {
    const { proxy } = instance
    const subTree = instance.render.call(proxy)

    // vnode tree
    patch(subTree,container)

    // 所有 element 初始化之后
    initialVnode.el = subTree.el
}

