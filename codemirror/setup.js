// Based on copy-paste from the demo page: https://codemirror.net/6/

(function() {
  'use strict';
  const { EditorState, EditorView, basicSetup } = CM["@codemirror/basic-setup"];
  const { javascript, javascriptLanguage } = CM["@codemirror/lang-javascript"];
  // const { completeFromList } = CM["@codemirror/autocomplete"];
  const { keymap } = CM["@codemirror/view"];
  const { defaultTabBinding, defaultKeymap, indentMore, indentLess } = CM["@codemirror/commands"];
  // debugger;

  // let keywords = "break case catch class const continue debugger default delete do else enum export extends false finally for function if implements import interface in instanceof let new package private protected public return static super switch this throw true try typeof var void while with yield".split(" ").map(kw => ({
  //   label: kw,
  //   type: "keyword"
  // }));

  // let globals = Object.getOwnPropertyNames(window).map(p => {
  //   return {
  //     label: p,
  //     type: /^[A-Z]/.test(p) ? "class" : typeof window[p] == "function" ? "function" : "variable"
  //   };
  // });

  //let jsCompletion = completeFromList([...keywords, ...globals]);

  let state = EditorState.create({
    doc: `// Here's an example transform function that converts images to grayscale.

let canvas = new OffscreenCanvas(256, 256);
let ctx = canvas.getContext("2d");

async function transform(data) {
  let blob = await data.fileHandle.getFile();
  
  let img = await createImageBitmap(blob);
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.filter = "grayscale(100%)";
  ctx.drawImage(img, 0, 0);

  let name = data.fileHandle.name;
  if(data.path.length > 0) name = \`\${data.path.join("/")}/\${name}\`;

  return {
    blob: await canvas.convertToBlob({type: blob.type}),
    name,
  };
}`,
    extensions: [
      basicSetup,
      javascript(),
      // keymap.of([defaultTabBinding]),
      keymap.of([
        ...defaultKeymap,
        {
          key: "Tab",
          preventDefault: true,
          run: indentMore,
        },
        {
          key: "Shift-Tab",
          preventDefault: true,
          run: indentLess,
        },
      ]),
      //javascriptLanguage.data.of({autocomplete: jsCompletion}),
      EditorView.updateListener.of((v) => {if (v.docChanged) {window.onEditorDocumentChanged?.()}}),
    ]
  });
  window.editorView = new EditorView({
    state,
    parent: document.querySelector("#code-editor")
  });
})();



let thereAreUnsavedChanges = false;
function updateEditorWithText(text) {
  let transaction = editorView.state.update({changes: {from: 0, to: editorView.state.doc.length, insert: text}})
  let update = editorView.state.update(transaction);
  editorView.update([update]);
}

saveChangesBtn.onclick = async () => {
  if(!window.dataFolder) return alert("please choose a data folder first");

  let transformJsFile = await window.dataFolder.getFileHandle('transform.js', { create: true });
  let editorText = editorView.state.doc.toString();
  let writable = await transformJsFile.createWritable();
  await writable.write(editorText);
  await writable.close();
  thereAreUnsavedChanges = false;
  saveChangesBtn.disabled = true;
}

window.onEditorDocumentChanged = function() {
  thereAreUnsavedChanges = true;
  saveChangesBtn.disabled = false;
}

document.addEventListener("keydown", function(e) {
  if ((e.metaKey || e.ctrlKey)  && e.keyCode == 83) {
    e.preventDefault();
    saveChangesBtn.click();
  }
}, false);

window.addEventListener('beforeunload', function (e) {
  if(!thereAreUnsavedChanges) return;
  e.preventDefault();
  e.returnValue = '';
});
