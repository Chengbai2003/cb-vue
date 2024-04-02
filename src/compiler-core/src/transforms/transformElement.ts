import { NodeTypes, createVNodeCall } from "../ast";


export function transformElement(node, context) {
    if(node.type === NodeTypes.ELEMENT){

        return () => {
            // 中间处理层
    
            // tag
            const vnodeTag = `"${node.tag}"`
            // props
            let vnodeProps = node.props
            // children
            const { children } = node
            let vnodeChildren = children[0]

            node.codegenNode = createVNodeCall(vnodeTag,vnodeProps,vnodeChildren,context)
        }
    }
}