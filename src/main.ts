import {filepickerCB, M5Data} from './input-data'
import {Log, FileTable, Parameters} from './dom'

interface DOMState {
    fileTable?: FileTable | undefined,
    log: Log,
    parameters: Parameters,
}

export class State {
    files: Map<string, M5Data>
    dom: DOMState

    constructor(dom: DOMState) {
        this.files = new Map()
        this.dom = dom
    }

    set_table(t: FileTable) {
        this.dom.fileTable = t
    }
    hide_parameters() {
        this.dom.parameters.hide()
    }
    show_parameters() {
        this.dom.parameters.show()
    }
    update_files(arr: M5Data[]) {
        this.files.clear()
        for (const data of arr) {
            this.files.set(data.filename, data)
        }
    }
}

const log = new Log()
const parameters = new Parameters()
const state = new State({log, parameters})

const uploadForm = document.getElementById("uploader")
uploadForm.addEventListener("change", e => filepickerCB(e, state))

