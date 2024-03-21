import { ref,h } from '../../lib/cb-vue.esm.js'

// 1.左侧对比 (a b) c  -> (a b) d e
// const prevChildren = [
//     h('div',{ key: 'A' },'A'),
//     h('div',{ key: 'B' },'B'),
//     h('div',{ key: 'C' },'C')
// ]
// const nextChildren = [
//     h('div',{ key: 'A' },'A'),
//     h('div',{ key: 'B' },'B'),
//     h('div',{ key: 'D' },'D'),
//     h('div',{ key: 'E' },'E'),
// ]

// 2.右侧对比 a (b c)  -> d e (b c)
// const prevChildren = [
//     h('div',{ key: 'A' },'A'),
//     h('div',{ key: 'B' },'B'),
//     h('div',{ key: 'C' },'C')
// ]
// const nextChildren = [
//     h('div',{ key: 'D' },'D'),
//     h('div',{ key: 'E' },'E'),
//     h('div',{ key: 'B' },'B'),
//     h('div',{ key: 'C' },'C'),
// ]

// 3.新的比老的长 
// 左侧 (a b)  -> (a b) c
// const prevChildren = [
//     h('div',{ key:"A" },'A'),
//     h('div',{ key:"B" },'B'),
// ]
// const nextChildren = [
//     h('div',{ key:"A" },'A'),
//     h('div',{ key:"B" },'B'),
//     h('div',{ key:"C" },'C'),
//     h('div',{ key:"D" },'D'),
// ]
// 右侧 (a b) -> c (a b)
// const prevChildren = [
//     h('div',{ key:"A" },'A'),
//     h('div',{ key:"B" },'B'),
// ]
// const nextChildren = [
//     h('div',{ key:"C" },'C'),
//     h('div',{ key:"D" },'D'),
//     h('div',{ key:"A" },'A'),
//     h('div',{ key:"B" },'B'),
// ]

// 4。老的比新的长 
// 左侧 (a b) c -> (a b)
// const prevChildren = [
//     h('div',{ key:"A" },'A'),
//     h('div',{ key:"B" },'B'),
//     h('div',{ key:"C" },'C'),
// ]
// const nextChildren = [
//     h('div',{ key:"A" },'A'),
//     h('div',{ key:"B" },'B'),
// ]
// 右侧 a (b c) ->  (b c)
// const prevChildren = [
//     h('div',{ key:"A" },'A'),
//     h('div',{ key:"B" },'B'),
//     h('div',{ key:"C" },'C'),
// ]
// const nextChildren = [
//     h('div',{ key:"B" },'B'),
//     h('div',{ key:"C" },'C'),
// ]
// 5.对比中间部分
// const prevChildren = [
//     h('p',{ key:"A" },'A'),
//     h('p',{ key:"B" },'B'),
//     h('p',{ key:"C",id:'c-prev' },'C'),
//     h('p',{ key:"D" },'D'),
//     h('p',{ key:"F" },'F'),
//     h('p',{ key:"G" },'G'),
// ]
// const nextChildren = [
//     h('p',{ key:"A" },'A'),
//     h('p',{ key:"B" },'B'),
//     h('p',{ key:"E" },'E'),
//     h('p',{ key:"C",id:'c-next' },'C'),
//     h('p',{ key:"F" },'F'),
//     h('p',{ key:"G" },'G'),
// ]
// 5.1 老的比新的多，多出来的直接删除
// const prevChildren = [
//     h('p',{ key:"A" },'A'),
//     h('p',{ key:"B" },'B'),
//     h('p',{ key:"C",id:'c-prev' },'C'),
//     h('p',{ key:"E" },'E'),
//     h('p',{ key:"D" },'D'),
//     h('p',{ key:"F" },'F'),
//     h('p',{ key:"G" },'G'),
// ]
// const nextChildren = [
//     h('p',{ key:"A" },'A'),
//     h('p',{ key:"B" },'B'),
//     h('p',{ key:"E" },'E'),
//     h('p',{ key:"C",id:'c-next' },'C'),
//     h('p',{ key:"F" },'F'),
//     h('p',{ key:"G" },'G'),
// ]
// 5.2 移动
// const prevChildren = [
//     h('p',{ key:"A" },'A'),
//     h('p',{ key:"B" },'B'),
//     h('p',{ key:"C" },'C'),
//     h('p',{ key:"E" },'E'),
//     h('p',{ key:"D" },'D'),
//     h('p',{ key:"F" },'F'),
//     h('p',{ key:"G" },'G'),
// ]
// const nextChildren = [
//     h('p',{ key:"A" },'A'),
//     h('p',{ key:"B" },'B'),
//     h('p',{ key:"E" },'E'),
//     h('p',{ key:"C" },'C'),
//     h('p',{ key:"D" },'D'),
//     h('p',{ key:"F" },'F'),
//     h('p',{ key:"G" },'G'),
// ]
// 5.3 创建
// const prevChildren = [
//     h('p',{ key:"A" },'A'),
//     h('p',{ key:"B" },'B'),
//     h('p',{ key:"C" },'C'),
//     h('p',{ key:"E" },'E'),
//     h('p',{ key:"F" },'F'),
//     h('p',{ key:"G" },'G'),
// ]
// const nextChildren = [
//     h('p',{ key:"A" },'A'),
//     h('p',{ key:"B" },'B'),
//     h('p',{ key:"E" },'E'),
//     h('p',{ key:"C" },'C'),
//     h('p',{ key:"D" },'D'),
//     h('p',{ key:"F" },'F'),
//     h('p',{ key:"G" },'G'),
// ]
// 综合例子
// const prevChildren = [
//     h('p',{ key:"A" },'A'),
//     h('p',{ key:"B" },'B'),
//     h('p',{ key:"C" },'C'),
//     h('p',{ key:"D" },'D'),
//     h('p',{ key:"E" },'E'),
//     h('p',{ key:"Z" },'Z'),
//     h('p',{ key:"F" },'F'),
//     h('p',{ key:"G" },'G'),
// ]
// const nextChildren = [
//     h('p',{ key:"A" },'A'),
//     h('p',{ key:"B" },'B'),
//     h('p',{ key:"D" },'D'),
//     h('p',{ key:"C" },'C'),
//     h('p',{ key:"Y" },'Y'),
//     h('p',{ key:"E" },'E'),
//     h('p',{ key:"F" },'F'),
//     h('p',{ key:"G" },'G'),
// ]

// fix c 应该移动 而不是 删除后重新创建
const prevChildren = [
    h('p',{ key:"A" },'A'),
    h('p',{},'C'),
    h('p',{ key:"B" },'B'),
    h('p',{ key:"D" },'D'),
]
const nextChildren = [
    h('p',{ key:"A" },'A'),
    h('p',{ key:"B" },'B'),
    h('p',{},'C'),
    h('p',{ key:"D" },'D'),
]

export default {
    name: "ArrayToArray",
    setup() {
        const isChange = ref(false)
        window.isChange = isChange

        return {
            isChange
        }
    },
    render(){
        const self = this
        return self.isChange === true ? h('div',{},nextChildren) : h('div',{},prevChildren)
    }
}