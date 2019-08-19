import {Result, Err, Ok} from './result'

const DATA_ROW_ID_BASE = "StatusRow"
const html_clear = (e: HTMLElement) => e.innerHTML = ""


/** Handle user selecting files for upload */
export function filepickerCB(e: Event, log: HTMLElement) {
    e.preventDefault()
    const filelist: FileList = (e.target as any).files
    const files = Array.prototype.slice.call(filelist)

    const filetable = make_file_table(files)
    html_clear(log)
    log.appendChild(filetable)

    Promise.all(files.map(read_m5_datafile))
        .then((results) => console.log(results))
        .catch((err) => console.log("promise error!", err))
}

function make_file_table(files: File[]): HTMLTableElement {
    const table = document.createElement("table")
    table.id = "fileTable"

    const header = document.createElement('tr')
    header.innerHTML = "<th> File </th> <th> Status </th> <th> Day </th>"
    table.appendChild(header)

    for (const file of files) {
        const row = document.createElement('tr')
        row.id = file.name + DATA_ROW_ID_BASE
        row.innerHTML = `<td>${file.name}</td> <td> Uploading... </td> <td></td>`
        table.appendChild(row)
    }

    return table
}

interface M5Data {
    filename: string,
    temperature: number,
    data: Map<string, number>,
}

function read_m5_datafile(f: File): Promise<M5Data> {
    const format_data = ([t, d]: [number, Map<string, number>]) =>
        ({filename: f.name, temperature: t, data: d})

    let promise = new Promise((resolve, reject) => {
        let rdr = new FileReader()
        rdr.onload = () => resolve(rdr.result as string)
        rdr.onerror = () => reject(rdr.error)
        rdr.readAsText(f)
    })
    .then(parse_m5_datafile)
    .then(res => res.map(format_data).to_promise())

    return promise
}

function parse_m5_datafile(data: string): Result<[number, Map<string, number>], string> {
    let plateData = data.split("\n")
    let plateInfo = plateData.splice(0, 2)
    if (!plateInfo[0].startsWith("##BLOCKS= ")) {
        return Err(`Datafile didn't start with proper header, instead had "${plateInfo[0]}"`)
    }
    const blockCount = parseInt(plateInfo[0].slice(10))
    if (blockCount !== 1) {
        return Err("More than one plate in datafile")
    }

    const parse_raw_data = (s: string[]) => parse_plate(format_plate_delimited(s))
    const temperature = parseFloat(plateData[1].trim())
    let welldata = parse_raw_data(plateData.slice(1))

    return Ok([temperature, welldata])
}

/** take a raw array of tab separated rows of plate values to convert into a 
 * a 2D array.
 * This assumes that the first two tabs are for spacing, and that the actual plate
 * data starts in the third column
  */
function format_plate_delimited(raw: string[]): string[][] {
    return raw.map(row => row.split('\t').slice(2))
}

/** convert a 2D array of string values into a well map */
function parse_plate(data: string[][]): Map<string, number> {
    return data
        .reduce((acc, row, i) => {
            
            const rowLetter = String.fromCharCode(65 + i)

            row.map(v => parseFloat(v))
                .forEach((val, col) => {
                    if (!isFinite(val)) { return }
                    
                    const well = `${rowLetter}${col + 1}`
                    acc.set(well, val)
                })

            return acc
        }, new Map())
}