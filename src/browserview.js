

class BrowserView
{
    
    constructor(editor)
    {
        this.editor = editor;


        this.filesDiv = document.getElementById("file_browser");

        this.filePathInputDiv = document.getElementById("file_path_input");
        this.fileNameInputDiv = document.getElementById("file_name_input");
        this.funcDiv = document.getElementById("func_name");
        this.runtimeButton = document.getElementById("select_runtime");

        
        this.fileGroupDiv = [];
        this.fileNameDiv = [];


        document.getElementById("new_file").addEventListener("click",function()
        {
            this.newFile();
        }.bind(this));

        document.getElementById("load_file").addEventListener("click",function(ev){
            this.loadFile(ev);
        }.bind(this))

        document.getElementById("remove_file").addEventListener("click",function(){

            this.removeFile();
        }.bind(this));

        document.getElementById("file_path_input").addEventListener("input",function(){
            this.inputPathValue(); 
        }.bind(this));

        document.getElementById("file_name_input").addEventListener("input",function(){
            this.inputNameValue(); 
        }.bind(this));
        
        this.runtimeButton.addEventListener("click",function() {
            this.selectForRuntime();
        }.bind(this));

        
        document.getElementById("func_name").addEventListener("input",function(){
            this.inputFuncName(); 
        }.bind(this));
    }

    update() 
    {
        
        let filesTraversal = this.editor.fileSystem.getTreeView();




        for (let i=0;i<Math.max(filesTraversal.length,this.fileGroupDiv.length);i++)
        {

            if (i<filesTraversal.length)
            {

                if (i<this.fileGroupDiv.length)
                {
                    this.fileGroupDiv[i].style.display = "block";



                }
                else
                {
                    let groupDiv = document.createElement("div");
                    groupDiv.classList.add("file_line");


                    let nameDiv = document.createElement("div");
                    nameDiv.classList.add("file_path");
                    groupDiv.appendChild(nameDiv);
                    this.fileNameDiv.push(nameDiv);

                    this.fileGroupDiv.push(groupDiv);
                    this.filesDiv.appendChild(groupDiv);

                    this.fileGroupDiv[i].addEventListener('click',function(event)
                    {
                                            
                        this.editor.fileSystem.setSelector("browser",event.target._fileData);

                        this.update();
                    }.bind(this),false);

                    this.fileNameDiv[i]._fileData = this.fileGroupDiv[i]._fileData = null;
                }



                let pre = new Array(filesTraversal[i].depth+1).join( "&ensp;" );

                if (filesTraversal[i].type==='directory')
                {

                    this.fileNameDiv[i].innerHTML = pre+filesTraversal[i].name+"/";
                    this.fileNameDiv[i].classList.toggle('directory',true);
                    this.fileNameDiv[i].classList.toggle('selected',false);
                    this.fileNameDiv[i].classList.toggle('runtime',false);


                    this.fileNameDiv[i]._fileData = this.fileGroupDiv[i]._fileData = null;

        
                }
                else if (filesTraversal[i].type==='file')
                {
                    
                    this.fileNameDiv[i]._fileData = this.fileGroupDiv[i]._fileData = filesTraversal[i].file;
                    this.fileNameDiv[i].classList.toggle('directory',false)

                    this.fileNameDiv[i].innerHTML = pre+filesTraversal[i].name;

                    this.fileNameDiv[i].classList.toggle('selected',filesTraversal[i].file===this.editor.fileSystem.getFile("browser") );
                    this.fileNameDiv[i].classList.toggle('runtime',filesTraversal[i].file===this.editor.fileSystem.getFile("runtime"));

                }

                //
            }
            else
            {
                this.fileGroupDiv[i].style.display = "none";
            }

        }
        
        if (!this.editor.fileSystem.getFile("browser"))
        {


            this.editor.fileView.view(null);
            
            this.filePathInputDiv.value = "";

            this.runtimeButton.disabled = true;


        }
        else
        {

            

            this.runtimeButton.disabled = this.editor.fileSystem.getFile("browser") === this.editor.fileSystem.getFile("runtime");


            this.editor.fileView.view(this.editor.fileSystem.getFile("browser"));
            
            this.filePathInputDiv.value = this.editor.fileSystem.getFile("browser").path;
            
            this.fileNameInputDiv.value = this.editor.fileSystem.getFile("browser").name;


        }

        this.funcDiv.value = this.editor.funcName;
   
    




    }

    newFile() 
    {
        this.editor.fileSystem.newFile();

        this.update();
    }

    loadFile(el)
    {
        var el = window._protected_reference = document.createElement("INPUT");
        el.type = "file";
        el.multiple = "multiple"
        el.addEventListener('change', function(ev2) {
            if (el.files.length) {
                    //document.getElementById('out').src = URL.createObjectURL(el.files[0]);
    
    
    
    
                    for (let i=0;i<el.files.length;i++)
                    {
                        let fr = new FileReader();
                        fr.readAsText(el.files[i]);
                        fr.onload = function () {
    
                            this.editor.fileSystem.addFile("",el.files[i].name,fr.result);
                            this.update();
                        }.bind(this);
                    }
    
    
    
            }
    
    
            new Promise(function(resolve) {
                    setTimeout(function() { resolve(); }, 1000);
                })
                    .then(function() {
    
                        el = window._protected_reference = undefined;
                    });
    
            }.bind(this));
    
        el.click();
    }

    removeFile()
    {
        if (this.editor.fileSystem.getFile("browser"))
        {
            if (this.editor.fileSystem.getFile("browser")===this.editor.fileSystem.getFile("runtime"))
                this.editor.fileSystem.setSelector("runtime",null);
    
            this.editor.fileSystem.removeFile("browser");
    
            this.update();
        }
    }

    
    inputPathValue() {


        if (this.editor.fileSystem.getFile("browser"))
        {
            this.editor.fileSystem.getFile("browser").path = this.filePathInputDiv.value;
            this.update();
        }
    }

    inputNameValue() {
        if (this.editor.fileSystem.getFile("browser"))
        {
            this.editor.fileSystem.getFile("browser").name = this.fileNameInputDiv.value;
            this.update();
        }
    }

    selectForRuntime() {
        this.editor.fileSystem.setSelector("runtime",this.editor.fileSystem.getFile("browser"))
        this.update();
    
    }
    
    inputFuncName() {


        this.editor.funcName = this.funcDiv.value;
        this.update();
    }
}








