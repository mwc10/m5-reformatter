import {Result, Err, Ok} from './fp'
import {FileTable, Log} from './dom'
import {State} from './state'

/** Summarized data from an M5 text data file */
export interface M5Data {
    filename: string,
    temperature: number,
    data: Map<string, number>,
}

class ParseErr {
    constructor(
        readonly filename: string, 
        readonly mesg: string
    ){ }
}

type ParseResult<T> = Result<T, ParseErr>
type ParsePromise<T> = Promise<ParseResult<T>>

const EXT_REG = /\.[\w\d]+$/

/** Handle user selecting files for upload */
export function filepickerCB(e: Event, state: State) {
    e.preventDefault()
    state.hide_parameters()

    console.log(Err)

    const filelist: FileList = (e.target as HTMLInputElement).files
    const files: File[] = Array.prototype.slice.call(filelist)
    const logger = state.dom.log
    logger.clear()

    // make a list of each file to be uploaded and processed
    const table = new FileTable(files, state)
    const update_status = (res: ParseResult<M5Data>[]) => {
        const [oks, errs] = partition_results(res)
        return update_file_status(oks, errs, logger, table)
    }
    const update_state_finish = (data: M5Data[]) => {
        if (data.length > 0) {
            state.update_files(data)
            state.show_parameters()
            console.log(state)
        } else {
            throw Error("No valid M5 data files. Pick new files")
        }
    }
    const promisedFiles = files
        .map(f => 
            read_m5_datafile(f)
            .catch(e => Err<M5Data, ParseErr>(new ParseErr(f.name, e)))
        )

    state.set_table(table)
    Promise.all(promisedFiles)
        .then(update_status)
        .then(([oks, _]) => oks)
        .then(update_state_finish)
        .catch(e => logger.err(e))
}

function partition_results(results: ParseResult<M5Data>[]): [M5Data[], ParseErr[]] {
    return results.reduce(([ok, err], r) => {
        return r.is_ok() ? 
            [ok.concat(r.unwrap()), err] :
            [ok, err.concat(r.unwrap_err())]
    }, [[],[]] as [M5Data[], ParseErr[]])
}

function update_file_status(oks: M5Data[], errs: ParseErr[], log:Log, table: FileTable): [M5Data[], ParseErr[]] {
    for (const err of errs) {
        table.update_error(err.filename, err.mesg)
        log.err(err.mesg)
    }

    for (const ok of oks) {
        table.update_sucess(ok.filename)
    }

    return [oks, errs]
} 


function read_m5_datafile(f: File): ParsePromise<M5Data> {
    const format_data = ([t, d]: [number, Map<string, number>]) =>
        ({filename: f.name, temperature: t, data: d})
    const fileExt = f.name.match(EXT_REG).pop()

    if (fileExt !== ".txt") {
        return Promise.resolve(
            Err(new ParseErr(
                f.name, 
                `Expected a .txt text file, but received file "${f.name}" with extension "${fileExt}"`
                )
            )
        )
    }

    let promise = new Promise((resolve, reject) => {
        let rdr = new FileReader()
        rdr.onload = () => resolve(rdr.result as string)
        rdr.onerror = () => reject(rdr.error)
        rdr.readAsText(f)
    })
    .then((res: string)=> parse_m5_datafile(res).map_err(e => new ParseErr(f.name, e)))
    .then(res => res.map(format_data))

    return promise
}

function parse_m5_datafile(data: string): Result<[number, Map<string, number>], string> {
    let rawRows = data.split("\n")
    const plateInfo = rawRows.splice(0, 2)
    const plateHeader = rawRows.splice(0, 1)
    const plateData = rawRows

    if (!plateInfo[0].startsWith("##BLOCKS= ")) {
        return Err(`Datafile didn't start with proper header, instead had "${plateInfo[0]}"`)
    }
    const blockCount = parseInt(plateInfo[0].slice(10))
    if (blockCount !== 1) {
        return Err("More than one plate in datafile")
    }

    // Transform the tab separated plate values into a map
    const parse_raw_data = (s: string[]) => parse_plate(format_plate_delimited(s, '\t'))
    const tempStr = plateData[0].split('\t')[1]
    const temperature = Number.parseFloat(tempStr)
    if (!Number.isFinite(temperature)) {
        return Err(`Couldn't parse "${tempStr}" as valid temperature`)
    }
    const welldata = parse_raw_data(rawRows)

    return Ok([temperature, welldata])
}

/** take a raw array of tab separated rows of plate values to convert into a 
 * a 2D array.
 * This assumes that the first two tabs are for spacing, and that the actual plate
 * data starts in the third column
  */
function format_plate_delimited(raw: string[], sep: string): string[][] {
    return raw.map(row => row.split(sep).slice(2))
}

/** convert a 2D array of string values into a well map */
function parse_plate(data: string[][]): Map<string, number> {
    return data
        .reduce((acc, row, i) => {
            const rowLetter = String.fromCharCode(65 + i)

            row
                .map(Number.parseFloat)
                .forEach((val, col) => {
                    if (!Number.isFinite(val)) { return }
                    
                    const well = `${rowLetter}${col + 1}`
                    acc.set(well, val)
                })

            return acc
        }, new Map())
}