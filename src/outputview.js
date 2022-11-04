
const OutputView = function(editor)
{
    this.editor = editor;


    this.outputDiv = document.getElementById("output");



    this.clear = function() 
    {
            
        while (this.outputDiv.firstChild) {
            this.outputDiv.removeChild(this.outputDiv.lastChild);
    }
    }


    this.print = function(text,color) {
    
        var currentdate = new Date();
    
    
        let out = document.createElement("div");
        out.classList.add("output_line");
        out.style.backgroundColor = color;
    
    
        let outTime = document.createElement("div");
        outTime.classList.add("output_line_time");
        outTime.classList.add("unselectable");
        outTime.innerText = currentdate.toISOString().substr(11, 12);
    
        out.appendChild(outTime);
    
    
        let outP = document.createElement("p");
        outP.classList.add("output_line_text");
        outP.innerText = text;
    
        out.appendChild(outP);
    
    
        this.outputDiv.appendChild(out);
    
    
        this.outputDiv.scrollTop = this.outputDiv.scrollHeight;
    
    

    }
}


clickClearOutput = function() {


    editorOutput.clear();
}