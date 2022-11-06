
class CodeView
{

    constructor(editor)
    {
        this.editor = editor;

    
    

        this.codeDiv = document.getElementById("code");
        this.fileCaptionDiv = document.getElementById("file_name_caption");
    
        this.code = CodeMirror( this.codeDiv, {
            lineNumbers: true, matchBrackets: true, indentWithTabs: false, styleActiveLine: true,
            theme:'eclipse', mode:"application/javascript",
            tabSize: 4, indentUnit: 4, highlightSelectionMatches: {showToken: /\w/}
        });
    
        this.code.on('change', function(c){
            let text = c.doc.getValue()
    
            if (this.editor.selectedFile>=0)
    
                this.editor.fileSystem.getFile(this.editor.selectedFile).text = text;
        }.bind(this));
    
    }
   
    

    setCode(name, txt)
    {
        this.fileCaptionDiv.innerText = name;

        this.code.setValue(txt);
    }

}