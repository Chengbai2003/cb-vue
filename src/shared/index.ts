
export * from './toDisplayString'


export const extend = Object.assign

export const EMPTY_OBJ = {}


export const isObject = (val) => val !== null && typeof val === 'object'

export const isString = (val) => typeof val === 'string'

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