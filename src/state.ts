import {M5Data} from './input-data'
import {Log, FileTable, Parameters, Download} from './dom'
import {Option, Some, None, Result} from './fp'
import {generate_output} from './output'

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
        LOC: 'location',
    },
    DL_BTN: 'downloadBtn',
}

interface DOMState {
    fileTable?: FileTable,
    log: Log,
    parameters?: Parameters,
    download?: Download,
}

interface Settings {
    target: Option<string>,
    method: Option<string>,
    unit: Option<string>,
    location: Option<string>,
}

interface Data {
    day: Option<number>,
    data: {
        temperature: number,
        wells: Map<string, number>
    }
}

export class State {
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
                .map_err((e: Error) => {
                    this.log_err(e, "error updating number in file state")
                })
            } else {
                this.log_err(`Entered day value "${raw}" for file "${file}" could not be parsed`)
            }
            this.show_download()
        },
        update_settings: (e: Event) => {
            e.preventDefault()
            
            const form = e.currentTarget as HTMLFormElement
            this.settings.target = get_val(form, DOMIds.SETTINGS.TARGET)
            this.settings.method = get_val(form, DOMIds.SETTINGS.METHOD)
            this.settings.unit = get_val(form, DOMIds.SETTINGS.UNIT)
            this.settings.location = get_val(form, DOMIds.SETTINGS.LOC)

            this.show_download()
        },
        download_data: (e: Event) => {
            generate_output(this)
        },
    }

    constructor(dom: DOMState) {
        this.data = new Map()
        this.dom = dom
        this.settings = {
            target: None(),
            method: None(),
            unit: None(),
            location: None(),
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
    private should_show_download(this: State): boolean {
        const check_data_days = (ok: boolean, [, data]: [string, Data]) =>
            ok && data.day.is_some()

        return  this.settings.target.is_some() &&
                this.settings.method.is_some() &&
                this.settings.unit.is_some() &&
                this.settings.location.is_some() &&
                [...this.data].reduce(check_data_days, true)
    }
    add_download_button(this: State, elem: HTMLElement) {
        this.dom.download = new Download(elem, this.cb.download_data)

        this.show_download()
    }
    show_download(this: State){
        if (this.should_show_download()) { 
            this.dom.download.show()
        } else {
            this.dom.download.hide()
        }
    }
    /** Get MIFC settings as an object, if all settings are present  */
    get_settings(this: State) {
        const s = this.settings
        return  s.target.and_then(target => 
                s.method.and_then(method => 
                s.unit.and_then(unit => 
                s.location.map(location => 
                    ({ target, method, unit, location })
                ))))
    }
    reset(this: State) {
        this.dom.fileTable = undefined
        this.data.clear()
        this.hide_parameters()
        try {
            this.dom.download.hide()
        } catch (e) {
            this.log_err(e)
        }
    }
    /** Write an Error or string to the DOM log */
    log_err(this: State, err: Error | string, context?: string) {
        if (typeof err === 'string') {
            this.dom.log.err(err)
        } else {
            if (context) { console.error(context) }
            console.error(err)
            this.dom.log.err(err.message + " [check console for trace]")
        }
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
