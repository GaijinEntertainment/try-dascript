
class FileView
{

    constructor(editor)
    {
        this.editor = editor;

    
        this.file = null;
    

        this.codeDiv = document.getElementById("code");
        this.fileCaptionDiv = document.getElementById("file_name_caption");
    
        this.code = CodeMirror( this.codeDiv, {
            lineNumbers: true, matchBrackets: true, indentWithTabs: false, styleActiveLine: true,
            theme:'material-darker', mode:"application/javascript",
            tabSize: 4, indentUnit: 4, highlightSelectionMatches: {showToken: /\w/}
        });
    
        this.code.on('change', function(c){
            let text = c.doc.getValue()
    
            if (this.file)
    
            this.file.text = text;
        }.bind(this));
    
    }
   
    

    view(file)
    {

        this.file = file;


        if (this.file)
        {

            this.fileCaptionDiv.innerText = file.name;

            this.code.setValue(file.text);
        }
        else
        {

            this.fileCaptionDiv.innerText = "";

            this.code.setValue("");
        }
    }

}