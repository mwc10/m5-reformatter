import {filepickerCB} from './input-data'

const uploadForm = document.getElementById("uploader")
const uploadLog = document.getElementById("fileList")
// make state class and variable
uploadForm.addEventListener("change", e => filepickerCB(e, uploadLog))

