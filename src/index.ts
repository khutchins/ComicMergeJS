import ComicMerge, { ZipFile } from "./ComicMerge";
import Sortable from 'sortablejs';
import BiMap from "./BiMap";

const cbzMerge = new ComicMerge();
const biMap = new BiMap<ZipFile, HTMLElement>();
const fileList = document.getElementById('file-list') as HTMLDivElement;
const sortOption = document.getElementById('sort-order') as HTMLInputElement;
const sortable = new Sortable(fileList, {
    dataIdAttr: 'data-id',
    onChange: (evt: Event) => {
        sortOption.value = 'custom';
    }
});

// List management
{
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
    cbzMerge.addListener((file) => addFile(file));

    
    async function addFile(file: ZipFile) {
        if (biMap.hasKey(file)) return;
        const row = addRow(file);
        biMap.setFromKey(file, row);
        fileList.appendChild(row);
    }

    function addRow(file: ZipFile): HTMLElement {
        const li = document.createElement("li") as HTMLElement;
        li.classList.add('sortable-item');
        li.setAttribute('data-id', file.idx);

        const filenameContainer = document.createElement('div');
        filenameContainer.classList.add('filename-container');

        const handle = document.createElement('span');
        handle.classList.add('handle');
        handle.textContent = '☰';
        filenameContainer.appendChild(handle);

        const filename = document.createElement('span');
        filename.classList.add('filename');
        filename.textContent = filename.title = `${file.file.name}`;
        filenameContainer.appendChild(filename);

        const fileCount = document.createElement('span');
        fileCount.classList.add('filecount');
        file.waitForEntries().then(_ => {
            fileCount.textContent = `${file.entries.length}`;
        });
        filenameContainer.appendChild(fileCount);

        const deleteRow = document.createElement('span');
        deleteRow.classList.add('file-delete');
        deleteRow.textContent = '⌫';
        deleteRow.onclick = (ev) => {
            ev.preventDefault();
            fileList.removeChild(li);
            biMap.removeByValue(li);
        }
        filenameContainer.appendChild(deleteRow);

        li.appendChild(filenameContainer);

        return li;
    }
}

function zipFileOrder(): ZipFile[] {
    return sortable.toArray().map(x => cbzMerge.files.filter(q => q.idx === x)[0]);
}

// Downloads
{
    const downloadButton = document.getElementById('download-button') as HTMLButtonElement;
    const progressBar = document.getElementById('download-progress') as HTMLProgressElement;
    downloadButton.addEventListener("click", onDownloadButtonClick, false);
    async function onDownloadButtonClick(event) {
        
        try {
            downloadButton.disabled = true;
            progressBar.classList.replace('hide', 'show');
            const blobURL = await cbzMerge.generateZip(
                zipFileOrder(),
                (value, max) => {
                    progressBar.max = max;
                    progressBar.value = value;
                }
            );
            if (blobURL) {
                const anchor = document.createElement("a");
                const clickEvent = new MouseEvent("click");
                anchor.href = blobURL;
                anchor.download = 'Download.cbz';
                anchor.dispatchEvent(clickEvent);
            }
        } catch (error) {
            alert(error);
        } finally {
            event.preventDefault();
            downloadButton.disabled = false;
            progressBar.classList.replace('show', 'hide');
        }
    }
}

// List reordering
{
    function sortRows(compareFn: (a: ZipFile, b: ZipFile) => number) {
        sortable.sort(zipFileOrder().sort(compareFn).map(x => x.idx));
    }

    function smartCompare(a: ZipFile, b: ZipFile): number {
        const aList = a.file.name.split(/(\d+)/);
        const bList = b.file.name.split(/(\d+)/);

        for (let i = 0; i < aList.length && i < bList.length; i++) {
            if (aList[i] === bList[i]) continue;
            if (aList[i].match(/\d/) && bList[i].match(/\d/)) return Number(aList[i]) - Number(bList[i]);
            return aList[i].localeCompare(bList[i]);
        }
        return aList.length - bList.length;
    }

    function checkSort() {
        if (sortOption.value === 'smart') {
            sortRows(smartCompare);
        } else if (sortOption.value === 'alpha') {
            sortRows((a, b) => a.file.name < b.file.name ? -1 : a.file.name > b.file.name ? 1 : 0);
        }
    }

    sortOption.addEventListener('change', (ev) => {
        checkSort();
    });

    // This must be added after the above listener, as it's relying on the row created there.
    // It probably should be merged, but I don't want to.
    cbzMerge.addListener((x) => {
        checkSort();
    })
}
