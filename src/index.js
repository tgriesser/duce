// A thin wrapper over "transduce"

import * as transduce from 'transduce'
export * from 'transduce'

const {isIterator, isIterable, iterator, 
  sequence, protocols: protocols} = transduce

export const iterSymbol = protocols.iterator

export function lazySeq(t, value) {
  return iterator(sequence(t, value))
}

export class FlattenIterator {

  constructor(iterator, guard) {
    this.iterator = iterator
    this.guard    = guard
    this.complete = false
    this.buffer   = []
    this.stack    = []
  }

  next() {
    while (!this.complete && this.buffer.length === 0) {
      this.__cycle()
    }
    return this.complete && this.buffer.length === 0 
      ? {done: true, value: undefined} 
      : {done: false, value: this.buffer.shift()}
  }

  __cycle() {
    if (!isIterator(this.iterator)) {
      throw new TypeError(`Invalid iterator value: ${this.iterator}`)
    }
    var {done, value} = this.iterator.next()
    if (done) {
      if (this.stack.length === 0) {
        this.complete = true
      }
      else {
        this.iterator = this.stack.pop()
      }
    }
    this.__next(value)
  }

  __next(value) {
    if (typeof value === 'string' || (!isIterable(value) && !isIterator(value))) {
      this.buffer.push(value)
    } 
    else if (isIterable(value) || isIterator(value)) {
      if (this.guard && this.guard(value)) {
        this.buffer.push(value)
      } else {
        this.stack.push(this.iterator)
        this.iterator = isIterator(value) ? value : iterator(value)        
      }
    }
  }
  
  [iterSymbol]() {
    return this
  }

}

export function iterOnce(val) {
  var done;
  return {
    next() {
      if (done) return {done: true, value: undefined}
      done = true
      return {done: false, value: val}
    }
  }
}

export const iterdone = {
  next() {
    return {done: true, value: undefined}
  },
  [iterSymbol]() {
    return this
  }
}
