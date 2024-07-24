
class OutputView
{

    constructor(editor)
    {
        this.editor = editor;


        this.outputDiv = document.getElementById("output");

        this.currentLine = null;
        this.currentTime = null;
        this.currentP = null;


        this.runtimeOutput = [];


        
        this.currentText = "";
    
        this.addLine();
    }
  

    clear() 
    {
            
        while (this.outputDiv.firstChild)
            this.outputDiv.removeChild(this.outputDiv.lastChild);

        this.currentTime = null;
        this.currentP = null;
        this.currentLine = null;

        this.currentText = "";
        
        this.addLine();
    }


    addLine() {

        let out = document.createElement("div");
        out.classList.add("output_line");

        let outTime = document.createElement("div");
        outTime.classList.add("output_line_time");
        outTime.classList.add("unselectable");
    
        let outP = document.createElement("p");
        outP.classList.add("output_line_text");
        
        out.appendChild(outTime);
        out.appendChild(outP);
        this.outputDiv.appendChild(out);
        
        
        this.currentLine = out;
        this.currentTime = outTime;
        this.currentP = outP;
        this.currentText = "";

        this.outputDiv.scrollTop = this.outputDiv.scrollHeight;

        this.runtimeOutput.push("");
    }

    
    printChar(ch) {

        if (ch==="\n")
            this.addLine()
        else
        {   
            this.currentText += ch;
            this.currentP.innerText = this.currentText;
            this.runtimeOutput[this.runtimeOutput.length-1] = this.currentText;
        }
        this.currentTime.innerText = (new Date()).toISOString().substring(11, 23);
        
    }

    resetRuntimeOutput() {
        this.runtimeOutput = [""];
        this.clear();
    }

    printLine(text,type) {


        if (this.currentText!=="")
            this.addLine();

        this.currentLine.classList.toggle("error",type=="error");
        this.currentLine.classList.toggle("test",type=="test");
        this.currentLine.classList.toggle("success",type=="success");

        /*
        for (let i=0;i<text.length;i++)
            this.printChar(text.charAt(i))*/
        
            
        this.currentText = text;
        this.currentP.innerText = this.currentText;
        this.currentTime.innerText = (new Date()).toISOString().substring(11,23);
        this.runtimeOutput[this.runtimeOutput.length-1] = this.currentText;

        if (this.currentText!=="")
            this.addLine();
    }


    loadFromJSON(json) {

        for (let i=0;i<json.length;i++)
        {
            this.printLine(json[i],"")
        }

    }
    toJSON() {

        

        let newArr = [];

        let finalLength = 0;
  
        for (let i = 0; i < this.runtimeOutput.length; i++) {
            let codeLength = this.runtimeOutput[i].length + 1;
            
            if (finalLength + codeLength <= 512) {
                newArr.push(this.runtimeOutput[i]);
                finalLength += codeLength;
            } else {
                newArr.push("...");
                break;
            }
        }
        

        return newArr;
    }
}


