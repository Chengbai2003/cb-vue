import { ShapeFlags } from "../shared/ShapeFlags"


export function initSlots(instance, children) {

    // children 不一定 slot or 不一定存在
    if(instance.vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN){
        normalizeObjectSlots(children,instance.slots)
    }
}

function normalizeObjectSlots(children,slots) {
    for (const key in children) {
        const value = children[key]
        slots[key] = (props) => normalizeSlotValue(value(props))
    }
}

function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value]
}

