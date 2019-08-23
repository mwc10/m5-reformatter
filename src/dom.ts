import {State, DOMIds as D} from './state'
import { default_output_name } from './output'

export const html_clear = (e: HTMLElement) => e.innerHTML = ""

export class Uploader {
    private static readonly container = document.getElementById(D.UPLOAD_DIV_ID)

    constructor(state: State) {
        const header = document.createElement('h2')
        header.textContent = "Upload Data"
        
        const help = document.createElement('p')
        help.classList.add("help")
        help.textContent = "Drag any number of M5 text files onto this page to start reformatting your data." +
        " Or, use the button below to select your files"

        const uploader = document.createElement('input')
        uploader.type = 'file'
        uploader.multiple = true
        uploader.accept = '.txt'
        uploader.id = D.FILE_INPUT_ID
        uploader.addEventListener("change", state.cb.add_files)
        uploader.classList.add('visually-hidden')

        const uploadLabel = document.createElement('label')
        uploadLabel.htmlFor = D.FILE_INPUT_ID
        uploadLabel.textContent = "Add Files"

        Uploader.container.appendChild(header)
        Uploader.container.appendChild(help)
        Uploader.container.appendChild(uploader)
        Uploader.container.appendChild(uploadLabel)
    }
}

export class FileTable {
    private readonly container = document.getElementById(D.FILE_TABLE_DIV);
    private elem: HTMLTableElement;
    // map between a file name and its table ROW
    private fileMap: Map<string, HTMLTableRowElement>

    constructor(files: File[], s: State) {
        html_clear(this.container)
        const [table, map] = FileTable.make_file_table(files, s)
        this.container.appendChild(table)
        this.elem = table
        this.fileMap = map
    }

    private static make_file_table(files: File[], state: State): [HTMLTableElement, Map<string, HTMLTableRowElement>] {
        const map = new Map()
        const table = document.createElement("table")
        table.id = D.FILE_TABLE_ID

        const thead = document.createElement('thead')
        const header = document.createElement('tr')
        header.innerHTML = '<th scope="col"> File </th>' +
                           '<th scope="col"> Status </th>' + 
                           '<th scope="col"> Day </th>'
        thead.appendChild(header)
        table.appendChild(thead)

        const tbody = document.createElement('tbody')
        for (const file of files) {
            const row = FileTable.make_file_row(file.name, state)
            tbody.appendChild(row)
            map.set(file.name, row)
        }

        table.appendChild(tbody)
        return [table, map]
    }

    private static make_file_row(fileName: string, state: State): HTMLTableRowElement {
        const row = document.createElement('tr')
        row.innerHTML = `<td>${fileName}</td>`

        const statusCell = document.createElement('td')
        statusCell.innerHTML = "<span> Loading </span>"
        statusCell.classList.add(D.LOADING_CLASS)

        const dayCell = document.createElement('td')
        const dayPicker = document.createElement('input')
        dayPicker.type = "number"
        dayPicker.placeholder = "Enter Day for this plate"
        dayPicker.addEventListener("input", e => state.cb.update_day(e, fileName))

        dayCell.appendChild(dayPicker)
        row.appendChild(statusCell)
        row.appendChild(dayCell)

        return row
    }

    private update_file_status(file: string, status: FileStatus, mesg?: string) {
        const row = this.fileMap.get(file)
        const statusCell = row.querySelector('td:nth-child(2)')

        switch (status) {
            case FileStatus.Error:
                statusCell.textContent = "Error!"
                statusCell.classList.remove(D.LOADING_CLASS)
                statusCell.classList.add(D.ERR_CLASS)
                statusCell.parentElement.classList.add(D.ERR_CLASS)
                row.querySelector("td:nth-child(3)").classList.add(D.HIDDEN_CLASS)
                break;
            case FileStatus.Success:
                statusCell.textContent = "Ready"
                statusCell.classList.remove(D.LOADING_CLASS)
                statusCell.classList.add(D.SUCCESS_CLASS)
                break;
            case FileStatus.Loading:
                statusCell.innerHTML = "<span> Loading </span>"
                statusCell.classList.add(D.LOADING_CLASS)
                break;
        }
    }

    update_sucess(file: string) {
        this.update_file_status(file, FileStatus.Success)
    }

    update_error(file: string, mesg: string) {
        this.update_file_status(file, FileStatus.Error, mesg)
    }
    add_new_file_rows(this: FileTable, files: File[], state: State) {
        const tbody = this.elem.getElementsByTagName('tbody')[0]

        for (const file of files) {
            const row = FileTable.make_file_row(file.name, state)
            tbody.appendChild(row)
            this.fileMap.set(file.name, row)
        }
    }
    remove_error_rows(this: FileTable) {
        const errRows = this.elem.querySelectorAll(`tr.${D.ERR_CLASS}`)
        for (const row of errRows) {
            row.parentElement.removeChild(row)
        }
    }
}

const enum FileStatus {
    Loading,
    Success,
    Error
}

export class Log {
    private readonly elem = document.getElementById(D.LOG_ID);

    constructor() {
        html_clear(this.elem)
    }

    clear() {
        html_clear(this.elem)
    }

    err(mesg: string) {
        const err = document.createElement("p")
        err.classList.add(D.ERR_CLASS)
        err.textContent = mesg

        this.elem.appendChild(err)
    }
}

export class Parameters {
    private readonly elem = document.getElementById(D.PARAMETERS_ID)

    constructor(state: State) {
        html_clear(this.elem)
        const header = document.createElement('h2')
        header.textContent = "Enter Assay Parameters"

        const help = document.createElement('p')
        help.classList.add("help")
        help.textContent = "Add an assay read date to each file above." + 
        " Then, set the Target, Method, and Units in the forms below." + 
        " Once all settings are entered, you will be able to download a CSV for upload into the MPS."

        const assayForm = Parameters.make_assays_form(state)

        this.elem.classList.add(D.HIDDEN_CLASS)
        this.elem.appendChild(header)
        this.elem.appendChild(help)
        this.elem.appendChild(assayForm)
    }

    private static make_assays_form(state: State): HTMLFormElement {
        const form = document.createElement('form')
        form.id = D.SETTINGS_FORM_ID
        form.addEventListener('submit', state.cb.update_settings)
        form.addEventListener('input', state.cb.update_settings)

        const settings = [
            [D.SETTINGS.TARGET, 'Target/Analyte', "targets"],
            [D.SETTINGS.METHOD, 'Method/Kit', 'methods'],
            [D.SETTINGS.UNIT, 'Data Unit', 'units'],
            [D.SETTINGS.LOC, 'Sample Location', 'locations'],
        ]

        for (const [t, l, u] of settings) {
            const [label, input, link] = make_setting_input(t, l, u)
            form.appendChild(label)
            form.appendChild(input)
            form.appendChild(link)
        }

        return form
    }

    show() {
        this.elem.classList.remove(D.HIDDEN_CLASS)
    }

    hide() {
        this.elem.classList.add(D.HIDDEN_CLASS)
    }
}

const BASE_URL = 'https://mps.csb.pitt.edu/assays/'

const make_setting_input = (n: string, l: string, url: string) => {
    const label = document.createElement('label')
    label.htmlFor = n
    label.textContent = l + ":"
    const input = document.createElement('input')
    input.type = "text"
    input.name = n
    input.id = n
    input.placeholder = l
    const link = document.createElement('span')
    link.id = n + "Link"
    link.classList.add("vocab-link")
    link.innerHTML = `<a href="${BASE_URL}${url}" target="_blank" rel="noopener noreferrer">List of all ${l}s</a>`

    return [label, input, link]
}

export class Download {
    private elem: HTMLDivElement

    constructor(parent: HTMLElement, cb: (e: Event) => void, namecb: (e: Event) => void) {
        const div = document.createElement('div')
        div.id = D.DL_DIV

        const btn = document.createElement('button')
        btn.id = D.DL_BTN
        btn.textContent = "Download Formated Data"
        btn.addEventListener('click', cb)

        const filename = document.createElement('input')
        filename.type = 'text'
        filename.placeholder = default_output_name()
        filename.addEventListener('input', namecb)

        div.appendChild(btn)
        div.appendChild(filename)
        this.elem = div
        parent.appendChild(div)
    }
    show() {
        this.elem.classList.remove(D.HIDDEN_CLASS)
    }

    hide() {
        this.elem.classList.add(D.HIDDEN_CLASS)
    }
}
