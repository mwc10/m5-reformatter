const DATA_ROW_ID_BASE = "StatusRow"
const FILE_TABLE_ID = "fileTable"
const FILE_TABLE_DIV = "fileList"
const LOG_ID = "log"
const PARAMETERS_ID = "parameters"
const ERR_CLASS = "error"
const SUCCESS_CLASS = "success"
const HIDDEN_CLASS = "hidden"

export const html_clear = (e: HTMLElement) => e.innerHTML = ""

export class FileTable {
    private readonly container = document.getElementById(FILE_TABLE_DIV);
    private elem: HTMLTableElement;
    // map between a file name and its table ROW
    private fileMap: Map<string, HTMLTableRowElement>

    constructor(files: File[]) {
        html_clear(this.container)
        const [table, map] = FileTable.make_file_table(files)
        this.container.appendChild(table)
        this.elem = table
        this.fileMap = map
    }

    private static make_file_table(files: File[]): [HTMLTableElement, Map<string, HTMLTableRowElement>] {
        const map = new Map()
        const table = document.createElement("table")
        table.id = FILE_TABLE_ID

        const header = document.createElement('tr')
        header.innerHTML = "<th> File </th> <th> Status </th> <th> Day </th>"
        table.appendChild(header)

        for (const file of files) {
            const row = document.createElement('tr')
            row.id = file.name + DATA_ROW_ID_BASE
            row.innerHTML = `<td>${file.name}</td> <td> Uploading... </td> <td></td>`
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
                statusCell.classList.add(ERR_CLASS)
                break;
            case FileStatus.Success:
                statusCell.textContent = "Ready"
                statusCell.classList.add(SUCCESS_CLASS)
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
    private readonly elem = document.getElementById(LOG_ID);

    constructor() {
        html_clear(this.elem)
    }

    clear() {
        html_clear(this.elem)
    }

    err(mesg: string) {
        const err = document.createElement("p")
        err.classList.add(ERR_CLASS)
        err.textContent = mesg

        this.elem.appendChild(err)
    }
}

export class Parameters {
    private readonly elem = document.getElementById(PARAMETERS_ID)

    constructor() {
        html_clear(this.elem)
        const header = document.createElement('h2')
        header.textContent = "Enter Assay Parameters"

        this.elem.appendChild(header)
        this.elem.classList.add(HIDDEN_CLASS)
    }

    show() {
        this.elem.classList.remove(HIDDEN_CLASS)
    }

    hide() {
        this.elem.classList.add(HIDDEN_CLASS)
    }
}
