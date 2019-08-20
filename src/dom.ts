import {State, DOMIds as D} from './state'

export const html_clear = (e: HTMLElement) => e.innerHTML = ""

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

        const header = document.createElement('tr')
        header.innerHTML = "<th> File </th> <th> Status </th> <th> Day </th>"
        table.appendChild(header)

        for (const file of files) {
            const row = document.createElement('tr')
            row.innerHTML = `<td>${file.name}</td> <td> Loading </td>`

            const dayCell = document.createElement('td')
            const dayPicker = document.createElement('input')
            dayPicker.type = "number"
            dayPicker.addEventListener("change", e => state.cb.update_day(e, file.name))

            dayCell.appendChild(dayPicker)
            row.appendChild(dayCell)
            table.appendChild(row)
            map.set(file.name, row)
        }

        return [table, map]
    }

    private update_file_status(file: string, status: FileStatus, mesg?: string) {
        const row = this.fileMap.get(file)
        const statusCell = row.querySelector('td:nth-child(2)')

        switch (status) {
            case FileStatus.Error:
                statusCell.textContent = "Error!"
                statusCell.classList.add(D.ERR_CLASS)
                row.querySelector("td:nth-child(3)").classList.add(D.HIDDEN_CLASS)
                break;
            case FileStatus.Success:
                statusCell.textContent = "Ready"
                statusCell.classList.add(D.SUCCESS_CLASS)
                break;
            case FileStatus.Loading:
                statusCell.textContent = "Loading"
                break;
        }
    }

    update_sucess(file: string) {
        this.update_file_status(file, FileStatus.Success)
    }

    update_error(file: string, mesg: string) {
        this.update_file_status(file, FileStatus.Error, mesg)
    }
}

enum FileStatus {
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
        form.addEventListener('change', state.cb.update_settings)

        const settings = [
            [D.SETTINGS.TARGET, 'Target/Analyte:'],
            [D.SETTINGS.METHOD, 'Method/Kit:'],
            [D.SETTINGS.UNIT, 'Unit of Data:'],
        ]

        for (const [t, l] of settings) {
            const [label, input] = make_input(t, l)
            form.appendChild(label)
            form.appendChild(input)
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

const make_input = (n: string, l: string) => {
    const label = document.createElement('label')
    label.htmlFor = n
    label.textContent = l
    const input = document.createElement('input')
    input.type = "text"
    input.name = n
    input.id = n

    return [label, input]
}
