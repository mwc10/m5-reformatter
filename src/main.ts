import {Log, Parameters, Uploader} from './dom'
import {State, DOMIds} from './state'
import { None } from './fp'

const log = new Log()
const state = new State({log, fileTable: None()})
const parameters = new Parameters(state)
state.update_parameters(parameters)
state.add_download_button(document.body)
document.addEventListener("dragenter", state.cb.dragover_enter)
document.addEventListener("dragover", state.cb.dragover_enter)
document.addEventListener("drop", state.cb.dragdrop)


const help = document.getElementById(DOMIds.JS_WARNING_ID)
help.parentNode.removeChild(help)

new Uploader(state)
