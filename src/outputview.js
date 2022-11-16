
class OutputView
{

    constructor(editor)
    {
        this.editor = editor;


        this.outputDiv = document.getElementById("output");
    
    
    
        document.getElementById("clear_output").addEventListener("click",function(){
    
            this.clear();
        }.bind(this))
    }
  

    clear() 
    {
            
        while (this.outputDiv.firstChild) {
            this.outputDiv.removeChild(this.outputDiv.lastChild);
    }
    }


    print(text,color) {
    
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


