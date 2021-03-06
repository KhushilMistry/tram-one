const assert = require('assert')
const belCreateElement = require('bel-create-element')
const HoverEngine = require('hover-engine')
const morph = require('nanomorph')
const rlite = require('rlite-router')
const rbelRegister = require('rbel')
const urlListener = require('url-listener')

class Tram {
  constructor(options) {
    if (options) {
      assert.equal(typeof options, 'object', 'Tram-One: options should be an object')
    }

    options = options || {}
    this.defaultRoute = options.defaultRoute || '/404'

    this.router = rlite()
    this.internalRouter = {}
    this.engine = new HoverEngine()
  }

  addActions(actionGroups) {
    assert.equal(
      typeof actionGroups, 'object',
      'Tram-One: ActionGroups should be { store-key: { action-name: action-function } }'
    )

    this.engine.addActions(actionGroups)

    return this
  }

  addListener(listener) {
    assert.equal(typeof listener, 'function', 'Tram-One: page should be a function')
    this.engine.addListener(listener)

    return this
  }

  addRoute(path, page) {
    assert.equal(typeof path, 'string', 'Tram-One: path should be a string')
    assert.equal(typeof page, 'function', 'Tram-One: page should be a function')

    this.internalRouter[path] = (params) => (store, actions) => page(store, actions, params)
    this.router = rlite(this.internalRouter[this.defaultRoute], this.internalRouter)

    return this
  }

  start(selector, pathName) {
    this.engine.addListener((store, actions) => {
      this.mount(selector, pathName, store, actions)
    })

    urlListener(() => {
      this.mount(selector, pathName)
    })

    this.mount(selector, pathName)

    return this
  }

  mount(selector, pathName, store, actions) {
    const target = (typeof selector) === 'string' ? document.querySelector(selector) : selector
    if (target === null) {
      console.warn('Tram-One: could not find target, is the element on the page yet?')
    }
    if (!target.firstElementChild) {
      const targetChild = document.createElement('div')
      target.appendChild(targetChild)
    }
    const targetChild = target.firstElementChild

    const routePath = pathName || window.location.href.replace(window.location.origin, '')
    morph(targetChild, this.toNode(routePath, store, actions))

    return this
  }

  toNode(pathName, state, actions) {
    const pageComponent = this.router(pathName)
    const pageState = state || this.engine.store
    const pageActions = actions || this.engine.actions
    return pageComponent(pageState, pageActions)
  }

  toString(pathName, state) {
    if (typeof window !== 'undefined') {
      return this.toNode(pathName, state).outerHTML
    }
    return this.toNode(pathName, state).toString()
  }

  static html(registry) {
    if (registry) {
      assert.equal(typeof registry, 'object', 'Tram-One: registry should be an object')
      assert.ok(!(Array.isArray(registry)), 'Tram-One: registry should be an object')
    }

    return rbelRegister(belCreateElement, registry || {})
  }
}

module.exports = Tram
