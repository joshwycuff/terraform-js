import { cloneDeep, mergeWith, MergeWithCustomizer } from 'lodash';

export class MergeStack<T> {
    private stack: Array<T>;

    private customizer?: MergeWithCustomizer;

    constructor(obj?: T, customizer?: MergeWithCustomizer) {
        this.stack = [];
        this.customizer = customizer;
        if (obj !== undefined) {
            this.stack.push(obj);
        }
    }

    get length(): number {
        return this.stack.length;
    }

    push(obj: T) {
        if (this.length > 0) {
            const top = cloneDeep(this.peek());
            mergeWith(top, obj, this.customizer);
            this.stack.push(top);
        } else {
            this.stack.push(obj);
        }
    }

    pop(): T {
        if (this.stack.length === 0) {
            throw new Error('Stack is empty.');
        }
        return this.stack.pop() as T;
    }

    popTo(length: number): void {
        if (this.length > length) {
            const N = this.length - length;
            for (let i = 0; i < N; i++) {
                this.pop();
            }
        }
    }

    peek(): T {
        return this.stack.slice(-1)[0];
    }
}
