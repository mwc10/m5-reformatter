import {filepickerCB} from './input-data'
import {Log, Parameters} from './dom'
import {State} from './state'

const log = new Log()
const parameters = new Parameters()
const state = new State({log, parameters})

const uploadForm = document.getElementById("uploader")
uploadForm.addEventListener("change", e => filepickerCB(e, state))

