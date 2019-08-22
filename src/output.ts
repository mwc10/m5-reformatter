import * as XLSX from 'xlsx'
import { State } from './state'
import { Result, Err, Ok } from './fp'

interface MIFCSettings {
    target: string,
    method: string,
    unit: string,
    location: string
}

export function generate_output(state: State) {
    const output = "mifc-data-test.xlsx"
    const res = create_workbook(state, output)
    if (res.is_err()) {
        state.log_err(res.unwrap_err())
        return;
    }

    const wb = res.unwrap()
    XLSX.writeFile(wb, output)
}

const MIFC_HEADER = [
    "Chip ID",
    "Cross Reference",
    "Assay Plate ID",
    "Assay Well ID",
    "Day",
    "Hour",
    "Minute",
    "Target/Analyte",
    "Subtarget",
    "Method/Kit",
    "Sample Location",
    "Value",
    "Value Unit",
    "Replicate",
    "Caution Flag",
    "Exclude",
    "Notes",
]

function create_workbook(s: State, wbName: string): Result<XLSX.WorkBook, Error> {
    const mbSettings = s.get_settings()
    if (!mbSettings.is_some()) {
        return Err(Error("Not all settings were set when trying to generate output"))
    }
    const settings = mbSettings.unwrap()
    const ws = XLSX.utils.aoa_to_sheet([MIFC_HEADER])

    for (const [fileName, plateData] of s.data) {
        if (!plateData.day.is_some()) {
            return Err(Error(`Day for plate "${fileName}" is missing`))
        }

        const day = plateData.day.unwrap()
        for (const [well, value] of plateData.data.wells) {
            const row = fmt_mifc_row(value, day, well, fileName, settings)
            XLSX.utils.sheet_add_json(
                ws, 
                [row], 
                {header: MIFC_HEADER, skipHeader: true, origin: -1}
            )
        }
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, wbName)

    return Ok(wb)
}

function fmt_mifc_row(
    value: number, 
    day: number, 
    well: string, 
    file: string, 
    settings: MIFCSettings
) {
    return {
        "Chip ID": well,
        "Assay Well ID": well,
        "Day": day,
        "Hour": 0,
        "Minute": 0,
        "Target/Analyte": settings.target,
        "Method/Kit": settings.method,
        "Sample Location": settings.location,
        "Value": value,
        "Value Unit": settings.unit,
        "Notes": `Data from ${file}`
    }
}
