const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    if ((vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) && typeof children === 'object') {
        vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
    }
    return vnode;
}
function createTextVnode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
// 是否改变
const hasChanged = (val, newVal) => {
    return !Object.is(val, newVal);
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
// add -> onAdd ;  add-foo -> onAddFoo
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? 'on' + capitalize(str) : '';
};

function emit(instance, event, ...args) {
    // instance.props -> event
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

let shouldTrack;
let activeEffect;
class ReactiveEffect {
    //  加上public 外面才能获取到 也就是 effct.scheduler
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        // 避免重复收集
        if (!this.active) {
            return this._fn();
        }
        // 执行fn 并 收集依赖
        activeEffect = this;
        shouldTrack = true;
        const result = this._fn();
        activeEffect = undefined;
        shouldTrack = false;
        return result;
    }
    stop() {
        // 性能问题 频繁调用清空 但是第一次已经清空
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effct) {
    effct.deps.forEach((dep) => dep.delete(effct));
    effct.deps.length = 0;
}
const targetMap = new Map();
function track(target, key) {
    if (!isTracking()) {
        return;
    }
    // target -> key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    // fn
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // 后续可能更多 options 
    // _effect.onStop = options.onStop
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (isShallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, val) {
        const res = Reflect.set(target, key, val);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, val) {
        console.warn(`set key:${key} error,because target is readonly`, target);
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}
function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} 必须是一个对象`);
        return target;
    }
    return new Proxy(target, baseHandlers);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    // $slots
    $slots: (i) => i.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlots(instance, children) {
    // children 不一定 slot or 不一定存在
    if (instance.vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

// 单值的话并不能通过proxy代理，因此另开一个逻辑，给它挂载到value属性下
class RefImpl {
    constructor(value) {
        this._v_isRef = true;
        // 以防对比时 存储值是已转化为proxy代理对象
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newVal) {
        if (hasChanged(this._rawValue, newVal)) {
            this._rawValue = newVal;
            this._value = convert(newVal);
            triggerEffects(this.dep);
        }
    }
}
function convert(val) {
    return isObject(val) ? reactive(val) : val;
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function ref(value) {
    return new RefImpl(value);
}
// isRef and unRef
function isRef(ref) {
    return !!ref._v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

function createComponentInstance(vnode, parent) {
    // console.log("createComponentInstance",parent)
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // setup:return function, obj
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}
let currenInstance = null;
function getCurrentInstance() {
    return currenInstance;
}
function setCurrentInstance(instance) {
    currenInstance = instance;
}

function provide(key, value) {
    // 存
    const currenInstance = getCurrentInstance();
    if (currenInstance) {
        let { provides } = currenInstance;
        const parentProvides = currenInstance.parent.provides;
        // init 只执行一次 利用原型链 查找
        if (parentProvides === provides) {
            provides = currenInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    const currenInstance = getCurrentInstance();
    if (currenInstance) {
        const parentProvides = currenInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

const createAppAPI = (render) => {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先创建虚拟节点
                // 后续操作基于虚拟节点处理
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer, undefined);
            }
        };
    };
};

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container, parentComponent) {
        // patch 
        patch(null, vnode, container, parentComponent, null);
    }
    // n1 旧的; n2 新的
    function patch(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag, type } = n2;
        // Fragment -> 只渲染children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // 判断是不是 element, vnode.type 是对象就是组件节点
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        // 处理 element update -> props,children
        // console.log('patchElement')
        // console.log(n1, n2)
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const preShapeFlag = n1.shapeFlag;
        const shapeFlag = n2.shapeFlag;
        const c2 = n2.children;
        const c1 = n1.children;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (preShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // array to text
                unmountChildren(n1.children);
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            if (preShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // array to array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        function isSomeVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        if (i > e1) {
            // 新的比老的多 创建
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            // 老的比新的多 删除
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 乱序部分 -> 创建、删除、移动
            // 中间对比
            let s1 = i, s2 = i;
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            const keyToNewIndexMap = new Map();
            // 初始化映射表
            const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
            let moved = false;
            let maxNewIndexSoFar = 0;
            // 映射表查找 O(1)
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // 当匹配的数量已经≥ 新的数量 那么后续直接删除即可
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                // 可能没有设置key
                let newIndex;
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // 表示新的一组中，该位置的元素是旧的一组中的第几个元素 避免i为0
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
            let j = increasingNewIndexSequence.length - 1; // 执行递增子序列的开始
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    // 创建
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // console.log('移动位置')
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                // 新的属性 比老的属性少 -> 删除少了的
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        // 挂载
        mountComponent(n2, container, parentComponent, anchor);
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { children, props, shapeFlag } = vnode;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        for (const key in props) {
            const val = props[key];
            // 初始化没有 oldVal
            hostPatchProp(el, key, null, val);
        }
        // container.append(el)
        hostInsert(el, container, anchor);
    }
    // 抽离出来
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(v => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function mountComponent(initialVnode, container, parentComponent, anchor) {
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container, anchor);
    }
    function setupRenderEffect(instance, initialVnode, container, anchor) {
        effect(() => {
            if (!instance.isMounted) {
                console.log('init');
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                // vnode tree
                patch(null, subTree, container, instance, anchor);
                // 所有 element 初始化之后
                initialVnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log('update');
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                // console.log("current",subTree)
                // console.log("prev",prevSubTree)
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        });
    }
    return {
        createApp: createAppAPI(render)
    };
}
// 最长递增子序列(不一定连续)
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let j, u, v, c;
    const len = arr.length;
    for (let i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
// anchor 为锚点 添加的指定位置
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    // dom实例的父节点
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVnode, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };
