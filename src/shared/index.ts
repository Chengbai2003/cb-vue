export const extend = Object.assign

export const isObject = (val) => {
    return val !== null && typeof val === 'object'
}
// 是否改变
export const hasChanged = (val,newVal) => {
    return !Object.is(val,newVal)
}