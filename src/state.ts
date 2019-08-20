import {M5Data} from './input-data'
import {Log, FileTable, Parameters} from './dom'
import {Option, Some, None, Result} from './fp'

interface DOMState {
    fileTable?: FileTable | undefined,
    log: Log,
    parameters: Parameters,
}

interface Settings {
    target: string | null,
    method: string | null,
    unit: string | null,
}

interface Data {
    day: Option<number>,
    data: {
        temperature: number,
        wells: Map<string, number>
    }
}

export class State {
    //files: Map<string, M5Data>
    dom: DOMState
    settings: Settings
    // filename -> Data
    data: Map<string, Data>

    readonly cb = {
        update_day: (e: Event, file: string) => {
            const raw = (e.target as HTMLInputElement).value
            const day = Number.parseFloat(raw)
            if (Number.isFinite(day)) {
                Result.attempt(() => {
                    this.data.get(file).day = Some(day)
                })
                .map_err(e => {
                    console.error("error updating number in file state", e)
                    this.dom.log.err(`${e}`)
                })
            } else {
                this.dom.log.err(`Entered day value "${raw}" for file "${file}" could not be parsed`)
            }
            console.log(this)
            // call a "check to show download button" callback?
        }
    }

    constructor(dom: DOMState) {
        this.data = new Map()
        this.dom = dom
        this.settings = {
            target: null,
            method: null,
            unit: null,
        }
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
        this.data.clear()
        for (const filedata of arr) {
            const data: Data = {
                day: None(),
                data: {
                    temperature: filedata.temperature,
                    wells: filedata.data
                }
            }

            this.data.set(filedata.filename, data)
        }
    }
}