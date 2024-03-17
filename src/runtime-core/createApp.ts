import { render } from "./render"
import { createVNode } from "./vnode"

export function createApp(rootComponent){

    return {
        mount(rootContainer){
            // 先创建虚拟节点
            // 后续操作基于虚拟节点处理
            const vnode = createVNode(rootComponent)

            render(vnode,rootContainer)
        }
    }
}

