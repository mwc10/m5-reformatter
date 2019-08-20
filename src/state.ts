import {M5Data} from './input-data'
import {Log, FileTable, Parameters} from './dom'
import {Option, Some, None, Result} from './fp'

export const DOMIds = {
    FILE_TABLE_ID: "fileTable",
    FILE_TABLE_DIV: "fileList",
    LOG_ID: "log",
    PARAMETERS_ID: "parameters",
    SETTINGS_FORM_ID: "settingsForm",
    ERR_CLASS: "error",
    SUCCESS_CLASS: "success",
    HIDDEN_CLASS: "hidden",
    SETTINGS: {
        TARGET: 'target',
        METHOD: 'method',
        UNIT: 'unit',
    }
}

interface DOMState {
    fileTable?: FileTable,
    log: Log,
    parameters?: Parameters,
}

interface Settings {
    target: Option<string>,
    method: Option<string>,
    unit: Option<string>,
}

interface Data {
    day: Option<number>,
    data: {
        temperature: number,
        wells: Map<string, number>
    }
}

function get_form_input(form: HTMLFormElement, name: string): HTMLInputElement {
    return form.elements.namedItem(name) as HTMLInputElement
}

function ignore_empty_str(s: string): Option<string> {
    return s === "" || s === null || s === undefined ? 
        None() : 
        Some(s)
}

const get_val = (f: HTMLFormElement, v: string) => ignore_empty_str(get_form_input(f, v).value)

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
        },
        update_settings: (e: Event) => {
            e.preventDefault()
            
            const form = e.currentTarget as HTMLFormElement
            this.settings.target = get_val(form, DOMIds.SETTINGS.TARGET)
            this.settings.method = get_val(form, DOMIds.SETTINGS.METHOD)
            this.settings.unit = get_val(form, DOMIds.SETTINGS.UNIT)

            console.log(this)
        }
    }

    constructor(dom: DOMState) {
        this.data = new Map()
        this.dom = dom
        this.settings = {
            target: None(),
            method: None(),
            unit: None(),
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
    update_parameters(params: Parameters) {
        this.dom.parameters = params
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