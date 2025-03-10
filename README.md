# ComicMergeJS

## Description

This is a simple single-page tool that allows you to merge multiple .cbz files into a single .cbz file in your browser without downloading anything. It's an evolution of [ComicMerge](https://github.com/khutchins/ComicMerge), but in a format that doesn't require me to install anything and has a visual interface.

If all you want is the page that does this, click [here](https://khutchins.github.io/ComicMergeJS).

## Details

This glues together [zip.js](https://gildas-lormeau.github.io/zip.js/) and [Sortable](https://github.com/SortableJS/Sortable) to create a simple browser page for merging cbz files.

There are two (kind of three) sort orders:

* Alphabetical: Does simple alphabetical supporting using the browser's rules and your locale.
* Smart: Does alphabetical sorting until it encounters a number, at which point it will compare those results numerically.
* Custom: Does not automatically sort on adding files.

Smart sorting is probably what you want, as it will cause `Comic Number (5)` to be sorted before `Comic Number (10)`. After you've added files, you can drag and drop the files to reorder them manually.

This has basically no error handling, so you'll probably run into some rough edges if you try to merge zips that have directories or files that aren't zips or cbzs. Don't do that.