import { NodeTypes } from '../src/ast'
import { baseParse } from '../src/parse'

describe('Parse', () => {
    // 插值 interpolation
    describe('interpolation', () => {
        test('simple interpolation', () => {
            const ast = baseParse('{{message}}')

            //root
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.INTERPOLATION,
                content: {
                    type: NodeTypes.SIMPLE_EXPRESSION,
                    content: 'message'
                }
            })
        })
    })
    // element
    describe('element', () => {
        it('simple element div', () => {
            const ast = baseParse('<div></div>')

            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.ELEMENT,
                tag: 'div',
                children: []
            })
        })
    })
    // text
    describe('text', () => {
        it('simple text', () => {
            const ast = baseParse('some text')
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.TEXT,
                content: 'some text'
            })
        })
    })
    // 三种类型联合
    test('hello word', () => {
        const ast = baseParse('<div>hi,{{message}}</div>')
        expect(ast.children[0]).toStrictEqual({
            type: NodeTypes.ELEMENT,
            tag: 'div',
            children: [
                {
                    type: NodeTypes.TEXT,
                    content: 'hi,'
                },
                {
                    type: NodeTypes.INTERPOLATION,
                    content: {
                        type: NodeTypes.SIMPLE_EXPRESSION,
                        content: 'message'
                    }
                }
            ]
        })
    })
    // element嵌套
    test('Nested element', () => {
        const ast = baseParse('<div><p>hi </p>{{message}}</div>')
        expect(ast.children[0]).toStrictEqual({
            type: NodeTypes.ELEMENT,
            tag: 'div',
            children: [
                {
                    type: NodeTypes.ELEMENT,
                    tag: 'p',
                    children: [
                        {
                            type: NodeTypes.TEXT,
                            content: 'hi '
                        }
                    ]
                },
                {
                    type: NodeTypes.INTERPOLATION,
                    content: {
                        type: NodeTypes.SIMPLE_EXPRESSION,
                        content: 'message'
                    }
                }
            ]
        })
    })
    // 标签不闭合
    test('should throw error when lack end tag', () => {
        expect(()=> {
            baseParse('<div><span></div>')
        }).toThrow(`缺少结束标签: span`)
    })
})