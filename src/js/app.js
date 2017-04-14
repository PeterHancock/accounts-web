import html from 'choo/html'
import choo from 'choo'

const logger = (state, emitter) => {
  emitter.on('*', (messageName, data) => {
    console.log('event', messageName, data)
  })
}

const updateBalance = (state, emitter) => {
  const balance = calculate(state.data)
  const report = `
Accounts:

${balance}


----  input  ----
${state.data}
  `
  state.report = report
  emitter.emit('render')
}

const dataStore = (state, emitter) => {
  state.data =
`#  Account format:
#    from to amount [ignored]
#    e.g. bob alice 30.86 for the phone bill

`
  state.report = null
  emitter.on('update', (data) => {
    state.data = data
    emitter.emit('render')
  })
  emitter.on('generate', () => {
    updateBalance(state, emitter)
    emitter.emit('render')
  })
  emitter.on('send', () => {
    updateBalance(state, emitter)
    window.location = `mailto:?subject=Accounts&body=${encodeURIComponent(state.report)}`
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

const mainView = (state, emit) => html`
  <body>
    <div style='display: flex; justify-content: space-around;'>
      <textarea
        style= "font-family: monospace;font-size: inherit;" type="text" rows="20" cols="100"
        onchange=${(e) => { emit('update', e.target.value) }}>${state.data}</textarea>
      <div>
        ${state.report && html`<div><pre>${state.report}</pre></div>`}
      </div>
    </div>
    <div style='display: flex; justify-content: flex-start;'>
      <button onclick=${(e) => {
        emit('generate')
        e.preventDefault()
      }}>Generate</button>
      <button onclick=${(e) => {
        emit('send')
        e.preventDefault()
      }}>Send</button>
    </div>

  </body>
`
const app = choo()
app.use(logger)
app.use(dataStore)
app.route('/', mainView)
app.route('/accounts-web', mainView)
app.mount('body')
