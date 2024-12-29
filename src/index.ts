import { ZipEntry } from "@zip.js/zip.js";
import ComicMerge, { ZipFile } from "./ComicMerge";
import Sortable from 'sortablejs';

export const cbzMerge = new ComicMerge();

function preventDefaults(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e: DragEvent) {
    e.preventDefault();
    setHighlightEnabled(false);
    const files = e.dataTransfer.files;
    if (files.length) {
        cbzMerge.addFiles(files);
    }
}

function setHighlightEnabled(enable: boolean) {
    if (enable) dropArea.classList.add('drag-over');
    else dropArea.classList.remove('drag-over');
}

const dropArea = document.getElementById('file-drop-area');
dropArea.addEventListener('dragover', preventDefaults);
dropArea.addEventListener('dragenter', preventDefaults);
dropArea.addEventListener('dragleave', preventDefaults);
dropArea.addEventListener('dragover', () => {
    setHighlightEnabled(true);
});
dropArea.addEventListener('dragleave', () => {
    setHighlightEnabled(false);
});
dropArea.addEventListener('drop', handleDrop);

const fileInput = document.getElementById("file-input") as HTMLInputElement;
dropArea.onclick = () => fileInput.dispatchEvent(new MouseEvent("click"));
fileInput.onchange = () => { cbzMerge.addFiles(fileInput.files); };
cbzMerge.addListener(() => refreshList());

let fileList = document.getElementById("file-list") as HTMLDivElement;
async function refreshList() {
    const newFileList = fileList.cloneNode() as HTMLDivElement;
    for (const file of cbzMerge.files) {
        await file.waitForEntries();
        newFileList.appendChild(addRow(file));
    };
    fileList.replaceWith(newFileList);
    fileList = newFileList;
}

function addRow(file: ZipFile): HTMLElement {
    const li = document.createElement("li") as HTMLElement;
    const filenameContainer = document.createElement("span");
    const filename = document.createElement("span");
    filenameContainer.classList.add("filename-container");
    li.appendChild(filenameContainer);
    filename.classList.add("filename");
    filename.textContent = filename.title = `${file.file.name}`;
    const fileCount = document.createElement("span");
    fileCount.classList.add("filecount");
    fileCount.textContent = `${file.entries.length}`;
    filenameContainer.appendChild(filename);
    filenameContainer.appendChild(fileCount);
    return li;
}

const downloadButton = document.getElementById("download-button");
downloadButton.addEventListener("click", onDownloadButtonClick, false);
async function onDownloadButtonClick(event) {
    let blobURL;
    try {
        blobURL = await cbzMerge.generateZip(cbzMerge.files);
    } catch (error) {
        alert(error);
    }
    if (blobURL) {
        const anchor = document.createElement("a");
        const clickEvent = new MouseEvent("click");
        anchor.href = blobURL;
        anchor.download = 'Download.cbz';
        anchor.dispatchEvent(clickEvent);
    }
    event.preventDefault();
}