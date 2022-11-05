

const FilesView = function(editor)
{
    this.editor = editor;


    this.filesDiv = document.getElementById("file_browser");

    this.filePathInputDiv = document.getElementById("file_path_input");
    this.fileNameInputDiv = document.getElementById("file_name_input");
    this.funcDiv = document.getElementById("func_name");
    this.runtimeButton = document.getElementById("runtime_button");

    
    this.fileGroupDiv = [];
    this.filePathDiv = [];
    this.fileNameDiv = [];


    this.update = function() 
    {
        
        let filesTraversal = this.editor.fileSystem.getTreeView();



        console.log(filesTraversal)

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

                    let pathDiv = document.createElement("div");
                    pathDiv.classList.add("file_path");
                    groupDiv.appendChild(pathDiv);
                    this.filePathDiv.push(pathDiv);

                    let nameDiv = document.createElement("div");
                    nameDiv.classList.add("file_name");
                    groupDiv.appendChild(nameDiv);
                    this.fileNameDiv.push(nameDiv);

                    this.fileGroupDiv.push(groupDiv);
                    this.filesDiv.appendChild(groupDiv);

                    this.fileGroupDiv[i].addEventListener('click',function(event)
                    {
                                            
                        editorSelectedFile = event.target.selectFileIndex;

                        this.editor.filesView.update();
                    }.bind(this),false);

                    this.fileNameDiv[i].selectFileIndex = this.filePathDiv[i].selectFileIndex = this.fileGroupDiv[i].selectFileIndex = -1;
                }



                let pre = new Array(filesTraversal[i].depth+1).join( "&ensp;" );

                if (filesTraversal[i].type==='directory')
                {

                    this.filePathDiv[i].innerHTML = pre+filesTraversal[i].name;
                    this.fileNameDiv[i].innerHTML = "";

                    this.fileGroupDiv[i].style.backgroundColor = "#FFFFFF";
                    this.fileGroupDiv[i].style.fontWeight = "normal";

                    this.fileNameDiv[i].selectFileIndex = this.filePathDiv[i].selectFileIndex = this.fileGroupDiv[i].selectFileIndex = -1;

        
                }
                else if (filesTraversal[i].type==='file')
                {
                    
                    this.fileNameDiv[i].selectFileIndex = this.filePathDiv[i].selectFileIndex = this.fileGroupDiv[i].selectFileIndex = filesTraversal[i].index;

                    this.filePathDiv[i].innerHTML = "";
                    this.fileNameDiv[i].innerHTML = pre+filesTraversal[i].name;

                    this.fileGroupDiv[i].style.backgroundColor = filesTraversal[i].index===editorSelectedFile ? "#e1e4f3" : "#FFFFFF";
                    this.fileGroupDiv[i].style.fontWeight = filesTraversal[i].index===editorRuntimeFile ? "bold" : "normal";
                }

                //
            }
            else
            {
                this.fileGroupDiv[i].style.display = "none";
            }

        }
        
        if (editorSelectedFile===-1)
        {


            this.editor.codeView.setCode("", "");
            
            this.filePathInputDiv.value = "";

            this.runtimeButton.disabled = true;


        }
        else
        {
            //fileNameCaption.innerText = editorFilesData[editorSelectedFile].name;
            

            this.runtimeButton.disabled = editorSelectedFile === editorRuntimeFile;


            this.editor.codeView.setCode(this.editor.fileSystem.getFile(editorSelectedFile).name, this.editor.fileSystem.getFile(editorSelectedFile).text);
            
            //editorFilePathInputDiv.value = editorFilesData[editorSelectedFile].path;
            this.filePathInputDiv.value = this.editor.fileSystem.getFile(editorSelectedFile).path;
            //editorFileNameInputDiv.value = editorFilesData[editorSelectedFile].name;
            this.fileNameInputDiv.value = this.editor.fileSystem.getFile(editorSelectedFile).name;


        }

        this.funcDiv.value = funcName;
   
    




    }
}

clickNewFile = function()
{

    editor.fileSystem.newFile();

    editor.filesView.update();
}

clickLoadFile = function(ev)
{

    var el = window._protected_reference = document.createElement("INPUT");
    el.type = "file";
    el.multiple = "multiple"
    el.addEventListener('change', function(ev2) {
        if (el.files.length) {
                //document.getElementById('out').src = URL.createObjectURL(el.files[0]);


                console.log(el.files);


                for (let i=0;i<el.files.length;i++)
                {
                    let fr = new FileReader();
                    fr.readAsText(el.files[i]);
                    fr.onload = function () {

                        editor.fileSystem.addFile({
                            "path":"",
                            "name":el.files[i].name,
                            "text":fr.result
                        });
                        editor.filesView.update();
                    };
                }



        }


        new Promise(function(resolve) {
                setTimeout(function() { console.log(el.files); resolve(); }, 1000);
            })
                .then(function() {

                    el = window._protected_reference = undefined;
                });

        });

    el.click();

}

clickRemoveFile = function()
{

    if (editorSelectedFile>=0)
    {
        if (editorSelectedFile===editorRuntimeFile)
            editorRuntimeFile = -1;

        editor.fileSystem.removeFile(editorSelectedFile);

        if (editorSelectedFile>=editor.fileSystem.getFiles().length)
            editorSelectedFile = editor.fileSystem.getFiles().length-1;


            editor.filesView.update();
    }

}


inputPathValue = function() {


    if (editorSelectedFile!==-1)
    {
        //editorFilesData[editorSelectedFile].path = editorFilePathInputDiv.value;
        editor.fileSystem.getFile(editorSelectedFile).path = editor.filesView.filePathInputDiv.value;
        editor.filesView.update();
    }
}

inputNameValue = function() {
    if (editorSelectedFile!==-1)
    {
        //editorFilesData[editorSelectedFile].name = editorFileNameInputDiv.value;
        editor.fileSystem.getFile(editorSelectedFile).name = editor.filesView.fileNameInputDiv.value;
        editor.filesView.update();
    }
}


clickSelectForRuntime = function () {
    editorRuntimeFile = editorSelectedFile;
    editor.filesView.update();

}


inputFuncName = function() {



    funcName = this.editor.filesView.funcDiv.value;
    editor.filesView.update();
}
