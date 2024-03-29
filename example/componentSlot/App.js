import { h,createTextVnode } from '../../lib/cb-vue.esm.js'
import { Foo } from './Foo.js'
window.self = null
export const App = {
    name: 'App',
    render() {
        const app = h('div', {}, 'app')
        const foo = h(Foo, {}, {
            header:({age}) => [h('p', {}, 'header' + age),
            createTextVnode('你好呀')
        ],
            footer:() => h('p', {}, 'footer')
        })
        // const foo = h(Foo,{},h('p',{},'456'))

        return h('div', {}, [app, foo])
    },
    setup() {
        return {}
    }
}