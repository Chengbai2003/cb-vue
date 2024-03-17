import { h } from '../../lib/cb-vue.esm.js'
import { Foo } from './Foo.js'
window.self = null
export const App = {
    // 实现render函数
    render(){
        window.self = this
        // 视图逻辑
        return h("div",{
            id: 'root',
            class:["red",'hard'],
            onClick(){
                console.log('clicked');
            },
            onMousedown(){
                console.log('mousedown');
            }
        },
        [
            h('div',{}, 'hi, '+ this.msg),
            h(Foo,{
                count: 1
            })
        ]
        // [h('p',{class:'red'},'hi'),h('p',{class:'blue'},'cb-vue')]
        // 'hi, '+ this.msg
        )
    },
    setup() {
        return {
            msg:'cb-vue-hhh'
        }
    }
}