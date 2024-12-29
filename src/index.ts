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
        const filenameContainer = document.createElement("span");
        const filename = document.createElement("span");
        filenameContainer.classList.add("filename-container");
        li.appendChild(filenameContainer);
        filename.classList.add("filename");
        filename.textContent = filename.title = `${file.file.name}`;
        const fileCount = document.createElement("span");
        fileCount.classList.add("filecount");
        file.waitForEntries().then(x => {
            fileCount.textContent = `${file.entries.length}`;
        });
        filenameContainer.appendChild(filename);
        filenameContainer.appendChild(fileCount);
        return li;
    }
}

// Downloads
{
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
}

// List reordering
{
    function sortRows(compareFn: (a: ZipFile, b: ZipFile) => number) {
        const arr = sortable.toArray();
        const newArr = arr.map(x => cbzMerge.files.filter(q => q.idx === x)[0]).sort(compareFn).map(x => x.idx);
        console.log(newArr);
        sortable.sort(newArr);
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
