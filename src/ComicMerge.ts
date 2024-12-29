import { Entry } from "@zip.js/zip.js";

const zip = require("@zip.js/zip.js");

export type FileAddedListener = (file: ZipFile) => void;

export default class ComicMerge {
    files: ZipFile[] = [];
    listeners: Set<FileAddedListener> = new Set();
    lastIdx = -1;

    addFile(file: File) {
        this.lastIdx++;
        const zipFile = new ZipFile(file, String(this.lastIdx));
        this.files.push(zipFile);
        for(const listener of this.listeners) {
            listener(zipFile);
        }
    }

    addFiles(files: FileList) {
        for (const file of files) {
            this.addFile(file);
        }
    }

    getEntries(file: File, options) {
        return (new zip.ZipReader(new zip.BlobReader(file))).getEntries(options);
    }

    async getURL(entry, options) {
        return URL.createObjectURL(await entry.getData(new zip.BlobWriter(), options));
    }

    async generateZip(fileOrder: ZipFile[], progressListener?: (value: number, max: number) => void) {
        function notifyProgress() {
            if (progressListener) progressListener(fileIdx, count);
        }

        const zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"))
        const fileCount = fileOrder.length;
        const maxLength = fileCount.toString().length;
        await Promise.all(fileOrder.map(i => i.waitForEntries()));
        const count = fileOrder.map(i => i.entries.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        let fileIdx = 0;
        notifyProgress();
        for (let i = 0; i < fileCount; i++) {
            const zipFile = fileOrder[i];
            for (let zfi = 0; zfi < zipFile.entries.length; zfi++) {
                const entry = zipFile.entries[zfi];
                const data = await entry.getData(new zip.BlobWriter()) as Blob;
                zipWriter.add(`${i.toString().padStart(maxLength, '0')} - ${zipFile.file.name} - ${entry.filename}`, new zip.BlobReader(data));
                fileIdx += 1;
                notifyProgress();
            }
        }

        const blobURL = URL.createObjectURL(await zipWriter.close());
        return blobURL;
    }

    addListener(listener: FileAddedListener) {
        this.listeners.add(listener);
    }
}

export class ZipFile {
    file: File;
    entries: Entry[];
    entriesPromise: Promise<Entry[]>;
    idx: string;

    constructor(file: File, idx: string) {
        this.file = file;
        this.idx = idx;
        this.entriesPromise = (new zip.ZipReader(new zip.BlobReader(file))).getEntries({});
        this.entriesPromise.then(e => {
            this.entries = e;
        })
    }

    async waitForEntries(): Promise<Entry[]> {
        if (this.entries) return this.entries;
        return this.entriesPromise;
    }
}