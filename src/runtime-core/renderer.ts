import { createComponentInstance, setupComponent } from "./component"
import { ShapeFlags } from "../shared/ShapeFlags"
import { Fragment, Text } from "./vnode"
import { createAppAPI } from "./createApp"
import { effect } from "../reactivity/effect"
import { EMPTY_OBJ } from "../shared"
import { shouldUpdateComponent } from "./componentUpdateUtils"
import { queueJobs } from "./scheduler"


export function createRenderer(options) {
    const {
        createElement: hostCreateElement,
        patchProp: hostPatchProp,
        insert: hostInsert,
        remove: hostRemove,
        setElementText: hostSetElementText
    } = options

    function render(vnode, container, parentComponent) {
        // patch 
        patch(null, vnode, container, parentComponent, null)
    }
    // n1 旧的; n2 新的
    function patch(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag, type } = n2

        // Fragment -> 只渲染children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor)
                break
            case Text:
                processText(n1, n2, container)
                break
            default:
                // 判断是不是 element, vnode.type 是对象就是组件节点
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent, anchor)
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent, anchor)
                }
                break
        }
    }

    function processText(n1, n2: any, container: any) {
        const { children } = n2
        const textNode = (n2.el = document.createTextNode(children))
        container.append(textNode)
    }


    function processFragment(n1, n2: any, container: any, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor)
    }

    function processElement(n1, n2: any, container: any, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor)
        } else {
            patchElement(n1, n2, container, parentComponent, anchor)
        }
    }

    function patchElement(n1, n2, container, parentComponent, anchor) {
        // 处理 element update -> props,children
        // console.log('patchElement')
        // console.log(n1, n2)
        const oldProps = n1.props || EMPTY_OBJ
        const newProps = n2.props || EMPTY_OBJ

        const el = (n2.el = n1.el)

        patchChildren(n1, n2, el, parentComponent, anchor)
        patchProps(el, oldProps, newProps)

    }

    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const preShapeFlag = n1.shapeFlag
        const shapeFlag = n2.shapeFlag
        const c2 = n2.children
        const c1 = n1.children
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // array to text
                unmountChildren(n1.children)
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2)
            }
        } else {
            if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                hostSetElementText(container, '')
                mountChildren(c2, container, parentComponent, anchor)
            } else {
                // array to array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor)
            }
        }
    }

    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length
        let i = 0
        let e1 = c1.length - 1
        let e2 = l2 - 1

        function isSomeVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key
        }
        // 左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i]
            const n2 = c2[i]
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor)
            } else {
                break
            }
            i++
        }
        // 右侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1]
            const n2 = c2[e2]

            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor)
            } else {
                break
            }
            e1--
            e2--
        }

        if (i > e1) {
            // 新的比老的多 创建
            if (i <= e2) {
                const nextPos = e2 + 1
                const anchor = nextPos < l2 ? c2[nextPos].el : null
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor)
                    i++
                }
            }
        } else if (i > e2) {
            // 老的比新的多 删除
            while (i <= e1) {
                hostRemove(c1[i].el)
                i++
            }
        } else {
            // 乱序部分 -> 创建、删除、移动
            // 中间对比
            let s1 = i, s2 = i
            const toBePatched = e2 - s2 + 1
            let patched = 0
            const keyToNewIndexMap = new Map()
            // 初始化映射表
            const newIndexToOldIndexMap = new Array(toBePatched).fill(0)
            let moved = false
            let maxNewIndexSoFar = 0

            // 映射表查找 O(1)
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i]
                keyToNewIndexMap.set(nextChild.key, i)
            }

            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i]
                // 当匹配的数量已经≥ 新的数量 那么后续直接删除即可
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el)
                    continue
                }
                // 可能没有设置key
                let newIndex
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key)
                } else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j
                            break
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el)
                } else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex
                    } else {
                        moved = true
                    }
                    // 表示新的一组中，该位置的元素是旧的一组中的第几个元素 避免i为0
                    newIndexToOldIndexMap[newIndex - s2] = i + 1
                    patch(prevChild, c2[newIndex], container, parentComponent, null)
                    patched++
                }
            }

            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : []
            let j = increasingNewIndexSequence.length - 1   // 执行递增子序列的开始
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2
                const nextChild = c2[nextIndex]
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null

                if (newIndexToOldIndexMap[i] === 0) {
                    // 创建
                    patch(null, nextChild, container, parentComponent, anchor)
                }

                if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // console.log('移动位置')
                        hostInsert(nextChild.el, container, anchor)
                    } else {
                        j--
                    }
                }
            }
        }
    }

    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el
            hostRemove(el)
        }
    }

    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key]
                const nextProp = newProps[key]

                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp)
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                // 新的属性 比老的属性少 -> 删除少了的
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null)
                    }
                }
            }
        }
    }

    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // 挂载
            mountComponent(n2, container, parentComponent, anchor)
        } else {
            // 更新
            updateComponent(n1, n2)
        }
    }

    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component)
        if(shouldUpdateComponent(n1, n2)){
            instance.next = n2
            instance.update()
        }else{
            // 不需要更新 但是需要 重置component
            n2.el = n1.el
            instance.vnode = n2
        }
    }

    function mountElement(vnode: any, container: any, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type))

        const { children, props, shapeFlag } = vnode
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode.children, el, parentComponent, anchor)
        }

        for (const key in props) {
            const val = props[key]
            // 初始化没有 oldVal
            hostPatchProp(el, key, null, val)
        }
        // container.append(el)
        hostInsert(el, container, anchor)
    }
    // 抽离出来
    function mountChildren(children: any, container: any, parentComponent, anchor) {
        children.forEach(v => {
            patch(null, v, container, parentComponent, anchor)
        })
    }

    function mountComponent(initialVnode: any, container: any, parentComponent, anchor) {
        const instance = (initialVnode.component = createComponentInstance(initialVnode, parentComponent))

        setupComponent(instance)
        setupRenderEffect(instance, initialVnode, container, anchor)
    }



    function setupRenderEffect(instance: any, initialVnode, container, anchor) {
        // 组件更新需要执行
        instance.update = effect(() => {
            if (!instance.isMounted) {
                console.log('init')
                const { proxy } = instance
                const subTree = (instance.subTree = instance.render.call(proxy,proxy))
                // vnode tree
                patch(null, subTree, container, instance, anchor)
                // 所有 element 初始化之后
                initialVnode.el = subTree.el

                instance.isMounted = true
            } else {
                console.log('update')
                // 需要一个 新的vnode 来获取props next 更新后的,vnode 更新前的
                const { next, vnode } = instance
                if (next) {
                    next.el = vnode.el
                    updateComponentPreRender(instance, next)
                }

                const { proxy } = instance
                const subTree = instance.render.call(proxy,proxy)
                const prevSubTree = instance.subTree

                instance.subTree = subTree

                // console.log("current",subTree)
                // console.log("prev",prevSubTree)
                patch(prevSubTree, subTree, container, instance, anchor)
            }

        },{
            scheduler(){
                queueJobs(instance.update)
            }
        })

    }
    return {
        createApp: createAppAPI(render)
    }
}

function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode
    instance.next = null

    instance.props = nextVNode.props
}

// 最长递增子序列(不一定连续)
function getSequence(arr) {
    const p = arr.slice()
    const result = [0]
    let i, j, u, v, c
    const len = arr.length
    for (let i = 0; i < len; i++) {
        const arrI = arr[i]
        if (arrI !== 0) {
            j = result[result.length - 1]
            if (arr[j] < arrI) {
                p[i] = j
                result.push(i)
                continue
            }
            u = 0
            v = result.length - 1
            while (u < v) {
                c = (u + v) >> 1
                if (arr[result[c]] < arrI) {
                    u = c + 1
                } else {
                    v = c
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1]
                }
                result[u] = i
            }
        }
    }
    u = result.length
    v = result[u - 1]
    while (u-- > 0) {
        result[u] = v
        v = p[v]
    }
    return result
}