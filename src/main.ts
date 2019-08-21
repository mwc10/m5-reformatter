import {Log, Parameters, Uploader} from './dom'
import {State, DOMIds} from './state'

const log = new Log()
const state = new State({log})
const parameters = new Parameters(state)
state.update_parameters(parameters)
state.add_download_button(document.body)

const help = document.getElementById(DOMIds.JS_WARNING_ID)
help.parentNode.removeChild(help)

new Uploader(state)
