import { h,getCurrentInstance } from '../../lib/cb-vue.esm.js'

export const Foo = {
    name:"Foo",
    setup(props){
        const instance = getCurrentInstance()
        console.log("Foo:",instance)
        return {}
    },
    render(){
        return h("div",{},'foo: ')
    }
}