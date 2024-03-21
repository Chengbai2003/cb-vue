import { createRenderer } from "../runtime-core";

function createElement(type) {
    return document.createElement(type);
}

function patchProp(el,key,prevVal,nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key)
    if(isOn(key)){
        const event = key.slice(2).toLowerCase()
        el.addEventListener(event,nextVal)
    }else {
        if(nextVal === undefined || nextVal === null){
            el.removeAttribute(key)
        }else {
            el.setAttribute(key,nextVal)
        }
    }
}
// anchor 为锚点 添加的指定位置
function insert(child,parent,anchor) {
    parent.insertBefore(child,anchor || null)
}

function remove(child){
    // dom实例的父节点
    const parent = child.parentNode
    if(parent){
        parent.removeChild(child)
    }
}

function setElementText(el,text) {
    el.textContent = text
}

const renderer:any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
})

export function createApp(...args) {
    return renderer.createApp(...args)
}

export * from '../runtime-core'
