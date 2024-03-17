export const extend = Object.assign

export const isObject = (val) => {
    return val !== null && typeof val === 'object'
}
// 是否改变
export const hasChanged = (val,newVal) => {
    return !Object.is(val,newVal)
}
export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val,key)

// add -> onAdd ;  add-foo -> onAddFoo
export const camelize = (str) => {
    return str.replace(/-(\w)/g,(_,c:string) => {
        return c ? c.toUpperCase() : ''
    })
}
const capitalize = (str:string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}
export const toHandlerKey = (str:string) => {
    return str ? 'on' + capitalize(str) : ''
}