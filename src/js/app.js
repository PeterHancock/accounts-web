import html from 'choo/html'
import choo from 'choo'
import css from 'csjs'
import cssify from 'cssify'
require('bulma/css/bulma.css')
cssify.byUrl('//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css')

const style = css `
.editor {
  font-family: monospace;
  font-size: inherit;
}
`

const logger = (state, emitter) => {
  emitter.on('*', (messageName, data) => {
    console.log('event', messageName, data)
  })
}

const updateBalance = (state) => {
  let balance = null
  try {
    balance = calculate(state.data)
    const report =
  `${balance}
  ----  input  ----
  ${state.data}`

    state.report = report
    state.error = null
  } catch (e) {
    state.report = null
    state.error = e.message
  }
}

const dataStore = (state, emitter) => {
  state.data = null
  state.report = null
  state.error = null
  emitter.on('update', (data) => {
    state.data = data
    emitter.emit('render')
  })
  emitter.on('refresh', () => {
    updateBalance(state)
    emitter.emit('render')
  })
  emitter.on('send', () => {
    updateBalance(state)
    if (!state.error) {
      window.location = `mailto:?subject=Accounts&body=${encodeURIComponent(state.report)}`
    }
    emitter.emit('render')
  })
}

const calculate = (raw) => {
  const data = raw.split('\n').map((l) => l.trim()).filter((l) => l && l.indexOf('#') !== 0)
  const balance = data.reduce((acc, l) => {
    const [from, to, ammount] = l.split(/\s+/)
    const F = from.toUpperCase()
    const T = to.toUpperCase()
    acc[F] = (acc[F] || 0) - parseFloat(ammount)
    acc[T] = (acc[T] || 0) + parseFloat(ammount)
    return acc
  }, {})
  return Object.keys(balance).reduce((output, key) => {
    const bal = balance[key]
    if (bal === 0) {
      return output
    }
    output.push(`${key} ${bal < 0 ? 'owes' : 'is owed'} £${Math.abs(bal)}`)
    return output
  }, []).join('\n')
}

const on = (handle) => (e) => {
  handle(e)
  e.preventDefault()
}

const placeholder =
`#  Account format:
#    from to amount [ignored]
#    e.g. bob alice 30.86 for the phone bill

`

const mainView = (state, emit) => html `
<body>
  <div class="content container is-fluid">
    <h1>accounts</h1>
    <div class="columns">
      <div class="column">
        <div class="card">
          <header class="card-header">
            <p class="card-header-title">
              debts
            </p>
          </header>
          <div class="card-content">
            <div class="content">
              <textarea class='textarea ${style.editor}' type="text" rows="10" cols="60"  placeholder=${placeholder}
                onchange=${(e) => { emit('update', e.target.value) }}>${state.data}</textarea>
            </div>
          </div>
          <footer class="card-footer">
            <button class="button is-primary is-large card-footer-item" onclick=${on((e) => { emit('refresh') })}>
              <span class="icon"><i class="fa fa-refresh"></i></span>\u00a0 refresh
            </button>
            <button class="button is-primary is-large card-footer-item" onclick=${on((e) => { emit('send') })}>
              <span class="icon"><i class="fa fa-envelope"></i></span>\u00a0 send
            </button>
          </footer>
        </div>
      </div>
      <div class="column">
      <div class="card">
        <header class="card-header">
          <p class="card-header-title">
            actions
          </p>
        </header>
        <div class="card-content">
          <div class="content">
            ${state.report && html`<pre>${state.report}</pre>`}
            ${state.error && html`
              <div class="notification is-danger">
                Format error:
                ${state.error}
              </div>`
            }
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
`
const app = choo()
app.use(logger)
app.use(dataStore)
app.route('/', mainView)
app.route('/accounts-web', mainView)
app.mount('body')
