import {filepickerCB} from './input-data'
import {Log, Parameters} from './dom'
import {State} from './state'

const log = new Log()
const state = new State({log})
const parameters = new Parameters(state)
state.update_parameters(parameters)
state.add_download_button(document.body)

const uploadForm = document.getElementById("uploader")
uploadForm.addEventListener("change", e => filepickerCB(e, state))
