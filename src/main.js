
var editorCodeDiv;
var editorOutputDiv;
var editorFilesDiv;
var samplesData;

var fileNameCaption;


var code;

var editorFilePathInputDiv;
var editorFileNameInputDiv;
var editorFuncDiv;
var editorRuntimeButton;

var sampleList = {"examples":null, "tests":null};



var editorSelectedFile = -1;
var editorRuntimeFile = -1;
var editorFilesData = [];

var funcName = "main";


var editorFileGroupDiv = [];
var editorFilePathDiv = [];
var editorFileNameDiv = [];


var separatorDiv = [];
var mainColumnDiv = [];
var mainColumnNum = 3;

var mainColPos = [2/10,6/10];

var selectedSeparator = -1;

updateMainCol = function() {


    let wp = [];

    for (let i=0;i<mainColumnNum-1;i++)
        wp.push(Math.round(mainColPos[i]*window.innerWidth));


    for (let i=0;i<mainColumnNum-1;i++)
    {

        
        separatorDiv[i].style.left = (wp[i]-10)+"px"
        mainColumnDiv[i+1].style.left = (wp[i])+"px"
    }


    mainColumnDiv[0].style.width = wp[0]-10+"px";
    
    mainColumnDiv[1].style.width = (wp[1]-wp[0]-10)+"px";
    
    mainColumnDiv[2].style.width = (window.innerWidth-wp[1]-10)+"px";

    
}

setMainColPos = function(e) {

    e.preventDefault();
    let xx = e.clientX;
    let wp = xx/window.innerWidth;


    let minw = 0.05;
    let maxw = 1-0.05;

    if (selectedSeparator>0)
        minw = mainColPos[selectedSeparator-1]+0.05;

    if (selectedSeparator<mainColumnNum-2)
        maxw = mainColPos[selectedSeparator+1]-0.05;

    if (wp>maxw)
        wp = maxw;

    if (wp<minw)
        wp = minw;

    mainColPos[selectedSeparator] = wp;

    updateMainCol();
}

pageInit = function () {

    //$.getScript("daScript.js")



    for (let i=0;i<mainColumnNum-1;i++)
    {   
        
    }
    

    for (let i=0;i<mainColumnNum;i++)
    {


        let mc = document.getElementById("main_col"+(i+1));

        mainColumnDiv.push(mc);
    }


    for (let i=0;i<mainColumnNum-1;i++)
    {
        let sep = document.getElementById("separator"+(i+1));

        sep.addEventListener("mousedown",function(e){
            if (selectedSeparator===-1)
                selectedSeparator = i;
        })

        //sep.style.left = (sp[i])+"px"

        separatorDiv.push(sep);
    }
    window.addEventListener("mousemove",function(e){
        if (selectedSeparator!==-1)
            setMainColPos(e);

    });

    window.addEventListener("mouseup", function(e){
        selectedSeparator = -1;
    });


    updateMainCol();

    setPageStatus("Loading WASM","#ff0000")


    editorCodeDiv = document.getElementById("code");
    editorOutputDiv = document.getElementById("output");
    editorFilesDiv = document.getElementById("file_browser");

    sampleList["examples"] = document.getElementById("examples");
    sampleList["tests"] = document.getElementById("tests");

    editorFilePathInputDiv = document.getElementById("file_path_input");
    editorFileNameInputDiv = document.getElementById("file_name_input");
    editorFuncDiv = document.getElementById("func_name");
    editorRuntimeButton = document.getElementById("runtime_button");

    
    fileNameCaption = document.getElementById("file_name_caption");


    code = CodeMirror( editorCodeDiv, {
        lineNumbers: true, matchBrackets: true, indentWithTabs: false, styleActiveLine: true,
        theme:'eclipse', mode:"application/javascript",
        tabSize: 4, indentUnit: 4, highlightSelectionMatches: {showToken: /\w/}
    });

    code.on('change', function(c){
        let text = c.doc.getValue()


        if (editorSelectedFile>=0)
            editorFilesData[editorSelectedFile].text = text;
    });


    $.getJSON( "./samples/data.json", function(res) {
        samplesData = res;


        let mainTests = [];

        samplesData["unit_tests"]["files"].forEach(function (testId) {

            let ff = [
                {
                    name: testId+".das",
                    path: samplesData["unit_tests"]["to_path"],
                    url: samplesData["unit_tests"]["url"]+testId+".das"}];

            samplesData["unit_test_dependencies"].forEach(function (depGroup) {

                depGroup["files"].forEach(function (file) {
                    ff.push(
                        {
                            name:file,
                            path:depGroup["to_path"],
                            url: depGroup["url"]+file
                        })
                })

            })

            mainTests.push({
                name : testId,
                files : ff,
                correct_output : [],
                func : "test"
            })
        });

        samplesData["tests"] = mainTests.concat(samplesData["tests"]);

        ["example","test"].forEach(function (n) {

            let ll = document.getElementById(n+"s");
            while (ll.firstChild) {
                ll.removeChild(ll.lastChild);
            }

            for (let i=0;i<samplesData[n+"s"].length+1;i++)
            {
                let newO = document.createElement("option");
                if (i===0)
                {

                    newO.innerText = "Select "+n;
                    newO.value = "init";
                }
                else
                {
                    newO.innerText = samplesData[n+"s"][i-1].name;
                    newO.value = i-1;

                }
                ll.appendChild(newO);
            }
        });

        selectSample("examples",0);



    });




}

setPageStatus = function(text,color) {

    let sDiv = document.getElementById("main_status");
    sDiv.style.color = color;
    sDiv.innerText = text;
}

inputPathValue = function() {


    if (editorSelectedFile!==-1)
    {

        editorFilesData[editorSelectedFile].path = editorFilePathInputDiv.value;
        updateFileBrowser();
    }
}

inputNameValue = function() {
    if (editorSelectedFile!==-1)
    {
        editorFilesData[editorSelectedFile].name = editorFileNameInputDiv.value;
        updateFileBrowser();
    }
}

inputFuncName = function() {



    funcName = editorFuncDiv.value;
    updateFileBrowser();
}

updateFileBrowser = function(updateSource) {



    let files = [];

    for (let i=0;i<editorFilesData.length;i++)
    {
        let p = editorFilesData[i].path.split('/');



        let currentDir = files;
        for (let j=0;j<p.length-1;j++)
            {
                

                let found = null;
                for (let k=0;k<currentDir.length;k++)
                    if (currentDir[k].name==p[j])
                    {
                        found = currentDir[k].files;
                    }

                if (found == null)
                {
                    currentDir.push({'name':p[j],'type':'directory','files':[]})

                    found = currentDir[currentDir.length-1].files;
                }
                

                currentDir = found;
            }
        
        currentDir.push({'name':editorFilesData[i].name,'type':'file','index':i})
    }

    console.log(files);

    let filesTraversal = [];

    let traverse = function(f,depth)
    {
        for (let i=0;i<f.length;i++)
            if (f[i].type=='directory')
            {
                filesTraversal.push({'name':f[i].name,'type':'directory','depth':depth})
                traverse(f[i].files,depth+1);
            }
            else if (f[i].type=='file')
            {
                filesTraversal.push({'name':f[i].name,'type':'file','depth':depth,'index':f[i].index})
            }
    }
    traverse(files,0);



    console.log(filesTraversal)

    for (let i=0;i<Math.max(filesTraversal.length,editorFileGroupDiv.length);i++)
    {

        if (i<filesTraversal.length)
        {

            if (i<editorFileGroupDiv.length)
            {
                editorFileGroupDiv[i].style.display = "block";



            }
            else
            {
                let groupDiv = document.createElement("div");
                groupDiv.classList.add("file_line");

                let pathDiv = document.createElement("div");
                pathDiv.classList.add("file_path");
                groupDiv.appendChild(pathDiv);
                editorFilePathDiv.push(pathDiv);

                let nameDiv = document.createElement("div");
                nameDiv.classList.add("file_name");
                groupDiv.appendChild(nameDiv);
                editorFileNameDiv.push(nameDiv);

                editorFileGroupDiv.push(groupDiv);
                editorFilesDiv.appendChild(groupDiv);

                editorFileGroupDiv[i].addEventListener('click',selectFile,false);

                editorFileNameDiv[i].selectFileIndex = editorFilePathDiv[i].selectFileIndex = editorFileGroupDiv[i].selectFileIndex = -1;
            }



            let pre = new Array(filesTraversal[i].depth+1).join( "&ensp;" );

            if (filesTraversal[i].type==='directory')
            {

                editorFilePathDiv[i].innerHTML = pre+filesTraversal[i].name;
                editorFileNameDiv[i].innerHTML = "";

                editorFileGroupDiv[i].style.backgroundColor = "#FFFFFF";
                editorFileGroupDiv[i].style.fontWeight = "normal";

                editorFileNameDiv[i].selectFileIndex = editorFilePathDiv[i].selectFileIndex = editorFileGroupDiv[i].selectFileIndex = -1;

    
            }
            else if (filesTraversal[i].type==='file')
            {
                
                editorFileNameDiv[i].selectFileIndex = editorFilePathDiv[i].selectFileIndex = editorFileGroupDiv[i].selectFileIndex = filesTraversal[i].index;

                editorFilePathDiv[i].innerHTML = "";
                editorFileNameDiv[i].innerHTML = pre+filesTraversal[i].name;

                editorFileGroupDiv[i].style.backgroundColor = filesTraversal[i].index===editorSelectedFile ? "#e1e4f3" : "#FFFFFF";
                editorFileGroupDiv[i].style.fontWeight = filesTraversal[i].index===editorRuntimeFile ? "bold" : "normal";
            }

            //
        }
        else
        {
            editorFileGroupDiv[i].style.display = "none";
        }

    }

    /*
    for (let i=0;i<Math.max(editorFilesData.length,editorFileGroupDiv.length);i++)
    {

        if (i<editorFilesData.length)
        {

            if (i<editorFileGroupDiv.length)
            {
                editorFileGroupDiv[i].style.display = "block";



            }
            else
            {
                let groupDiv = document.createElement("div");
                groupDiv.classList.add("file_line");

                let pathDiv = document.createElement("div");
                pathDiv.classList.add("file_path");
                groupDiv.appendChild(pathDiv);
                editorFilePathDiv.push(pathDiv);

                let nameDiv = document.createElement("div");
                nameDiv.classList.add("file_name");
                groupDiv.appendChild(nameDiv);
                editorFileNameDiv.push(nameDiv);

                editorFileGroupDiv.push(groupDiv);
                editorFilesDiv.appendChild(groupDiv);

                editorFileGroupDiv[i].addEventListener('click',selectFile.bind(event,i),false);

            }

            editorFilePathDiv[i].innerText = editorFilesData[i].path;
            editorFileNameDiv[i].innerText = editorFilesData[i].name;


            editorFileGroupDiv[i].style.backgroundColor = i===editorSelectedFile ? "#e1e4f3" : "#FFFFFF";
            editorFileGroupDiv[i].style.fontWeight = i===editorRuntimeFile ? "bold" : "normal";
            //
        }
        else
        {
            editorFileGroupDiv[i].style.display = "none";
        }

    }*/
    
    if (editorSelectedFile===-1)
    {


        fileNameCaption.innerText = "";

        code.setValue("");
        editorFilePathInputDiv.value = "";

        editorRuntimeButton.disabled = true;


    }
    else
    {
        fileNameCaption.innerText = editorFilesData[editorSelectedFile].name;

        editorRuntimeButton.disabled = editorSelectedFile === editorRuntimeFile;

        code.setValue(editorFilesData[editorSelectedFile].text);
        editorFilePathInputDiv.value = editorFilesData[editorSelectedFile].path;
        editorFileNameInputDiv.value = editorFilesData[editorSelectedFile].name;

    }

    editorFuncDiv.value = funcName;
   
    



}

var fileCacheURL = {};

getFiles = function(filesDesc,onComplete) {


    let outFiles = [];



    let getFile = function (i) {

        if (i>=filesDesc.length)
        {

            onComplete(outFiles);
            return;
        }


        if (filesDesc[i].url)
        {

            if (fileCacheURL[filesDesc[i].url] !== undefined)
            {
                outFiles.push(
                    {
                        name : filesDesc[i].name,
                        path : filesDesc[i].path ? filesDesc[i].path : "",
                        text : fileCacheURL[filesDesc[i].url]
                    });

                getFile(i+1);
            }
            else
            {

                $.get(filesDesc[i].url, function(ft) {

                    fileCacheURL[filesDesc[i].url] = ft;

                    outFiles.push(
                        {
                            name : filesDesc[i].name,
                            path : filesDesc[i].path ? filesDesc[i].path : "",
                            text : ft
                        });

                    getFile(i+1);

                }, 'text');
            }
        }
        else
        {
            outFiles.push({
                name:filesDesc[i].name,
                path:filesDesc[i].path ? filesDesc[i].path : "",
                text:filesDesc[i].text
            })

            getFile(i+1);
        }

    }

    getFile(0);

}

var runtimeLoaded = false;

loadSample = function(type,index,updateEnv,onComplete)
{

    if (runtimeLoaded)
        setPageStatus("Loading files","#ff0000")


    getFiles(samplesData[type][index].files,function (filesData) {

        /*
        if (updateEnv)
            code.setValue(filesData[0].text);*/


        if (updateEnv)
        {
            editorFilesData = filesData;
            editorSelectedFile = 0;
            editorRuntimeFile = 0;
            funcName = samplesData[type][index]["func"];
            updateFileBrowser();

        }


        if (runtimeLoaded)
            setPageStatus("Ready","#000000")

        if (onComplete)
            onComplete(filesData);
    })



}

selectSample = function(type,id) {



    let vv = id !== undefined ? id : parseInt(sampleList[type].value);
    if (vv !== NaN)
    {


        loadSample(type,vv,true,null)



    }

    sampleList[type].value = "init";


}

runCode = function() {

    let fName = funcName;

    //[{"name":"main.das","text":code.getValue()}]
    console.log(fName);

    runScript(editorFilesData,editorFilesData[editorRuntimeFile].path+editorFilesData[editorRuntimeFile].name,fName,fName === "test" ? function () {
        printOutput( "TEST FINISHED" ,"#4adbdb");


    } : null);



}


runTests = function() {


    runTest(0);

}

var outputPool = [];

runTest = function(i) {

    loadSample('tests',i,false,function(filesData) {

        printOutput("Running Test "+(i+1)+"/"+samplesData["tests"].length+": "+samplesData["tests"][i].name,"#bec7b6");

        outputPool = [];

        fName = samplesData["tests"][i].function_name ? samplesData["tests"][i].function_name : "main";

        runScript(filesData,filesData[0].path+filesData[0].name,samplesData["tests"][i]["func"],function () {


            let ok = true;



            if (outputPool.length<samplesData["tests"][i].correct_output.length)
                ok = false;
            else
                for (let o=0;o<samplesData["tests"][i].correct_output.length;o++) {
                    let correct = samplesData["tests"][i].correct_output[o];

                    if (Array.isArray(correct))
                    {
                        let outp = outputPool[o].split(' ');

                        if (outp.length<correct.length)
                            ok = false;
                        else
                            for (let k=0;k<correct.length;k++)
                                if (correct[k] !== null && outp[k] !== correct[k])
                                    ok = false;


                    }
                    else
                    {
                        if (correct !== null && outputPool[o] !== correct)
                            ok = false;
                    }

                }

            for (let o=0;o<outputPool.length;o++)
                if (outputPool[o].includes("error") || outputPool[o].includes("can't"))
                    ok = false;


            printOutput(samplesData["tests"][i].name+" Test "+(i+1)+"/"+samplesData["tests"].length+": "+(ok ? "SUCCESS" : "FAIL"),ok ? "#89db4a": '#ff9393');

            if (i<samplesData["tests"].length-1)
                runTest(i+1);
        });
    })
}

clearOutput = function() {

    while (editorOutputDiv.firstChild) {
        editorOutputDiv.removeChild(editorOutputDiv.lastChild);
    }
}


printOutput = function(text,color) {

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


    editorOutputDiv.appendChild(out);


    editorOutputDiv.scrollTop = editorOutputDiv.scrollHeight;



}


runScript = function(files,mainFile,mainFunc,onComplete)
{


    console.log(files);


    //let mainPath = "";

    for (let i=0;i<files.length;i++)
    {


        if (files[i].path !== "")
        {

            let folders = files[i].path.split("/");
            let paths = [folders[0]+"/"];
            for (let j=1;j<folders.length;j++)
                paths.push(paths[j-1] + folders[j]+"/")

            for (let j=0;j<paths.length;j++)

                if (!FS.analyzePath(paths[j]).exists)
                    FS.mkdir(paths[j]);
        }

        FS.writeFile(files[i].path+files[i].name, files[i].text);

        //if (files[i].name === "main.das")
        //    mainPath = files[i].path;

    }

    callMain([mainFile,"-main",mainFunc]);




    //printOutput(text,"#fff2d2");

    if (onComplete)
        onComplete();
}


newFile = function()
{

    let newN = 0;

    let exists = false;

    for (let i=0;i<editorFilesData.length;i++)
        if (editorFilesData[i].path === "" && editorFilesData[i].name ==="new.das")
            exists = true;
    while (exists)
    {
        newN +=1;
        let fName = "new("+newN+").das";

        exists = false;
        for (let i=0;i<editorFilesData.length;i++)
            if (editorFilesData[i].path === "" && editorFilesData[i].name ===fName)
                exists = true;

    }

    editorFilesData.push({
        "path":"",
        "name":"new"+(newN===0 ? "" : "("+newN+")")+".das",
        "text":""
    });

    updateFileBrowser();
}

loadFile = function(ev)
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

                        editorFilesData.push({
                            "path":"",
                            "name":el.files[i].name,
                            "text":fr.result
                        });
                        updateFileBrowser();
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
removeFile = function()
{

    if (editorSelectedFile>=0)
    {
        if (editorSelectedFile===editorRuntimeFile)
            editorRuntimeFile = -1;

        editorFilesData.splice(editorSelectedFile, 1);

        if (editorSelectedFile>=editorFilesData.length)
            editorSelectedFile = editorFilesData.length-1;




        updateFileBrowser();
    }

}


selectFile = function(event)
{

    console.log(event);

    editorSelectedFile = event.target.selectFileIndex;

    updateFileBrowser();
}

selectForRuntime = function () {
    editorRuntimeFile = editorSelectedFile;
    updateFileBrowser();

}



var Module = {
        noInitialRun : [],
        preRun: [],
        postRun: [],
        onRuntimeInitialized: function() {
            runtimeLoaded = true;
            setPageStatus("Runtime Ready","#000000")

        },
        print: (function() {

            return function(text) {

                if (arguments.length > 1)
                    text = Array.prototype.slice.call(arguments).join(' ');
                console.log(text);
                printOutput(text,'#ffffff');

                outputPool.push(text);
            };
        })(),
    }

window.onerror = function(message)
{

    printOutput(message,'#ff2d2d');


    printOutput("An error occurred, you may need to reload the page",'#ff9393');
}

window.onresize = function() 
{

    updateMainCol();
}





