import { h, renderSlots } from '../../lib/cb-vue.esm.js'

export const Foo = {
    setup() {
        return {}
    },
    render() {
        const foo = h('p', {}, 'foo')
        // Foo.vnode.children
        const age = 18
        return h('div', {}, [
            renderSlots(this.$slots, 'header',{
                age
            }),
            foo,
            renderSlots(this.$slots, 'footer')
        ])
    }
}