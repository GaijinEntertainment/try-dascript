
const Editor = function()
{
    
}



var editorFileSystem;
var editorCode; 
var editorOutput;
var editorFiles;




var samplesData;



var sampleList = {"examples":null, "tests":null};



var editorSelectedFile = -1;
var editorRuntimeFile = -1;
//var editorFilesData = [];

var funcName = "main";



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

    //$.getScript("daScript.js"
        
    editorFileSystem = new FileSystem(null);
    editorCode = new CodeView(null);
    editorOutput = new OutputView(null);
    editorFiles = new FilesView(null);



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




    sampleList["examples"] = document.getElementById("examples");
    sampleList["tests"] = document.getElementById("tests");


    





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



var fileCacheURL = {};

getFiles = function(filesDesc,onComplete) {


    let outFiles = [];



    let getFile = function (i) {

        if (i>=filesDesc.length)
        {
            let tempFileSystem = new FileSystem(null);
            
            tempFileSystem.setFiles(outFiles);
            onComplete(tempFileSystem);
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


    getFiles(samplesData[type][index].files,function (fileSystem) {

        /*
        if (updateEnv)
            code.setValue(filesData[0].text);*/


        if (updateEnv)
        {
            //editorFilesData = filesData;
            editorFileSystem = fileSystem;
            editorSelectedFile = 0;
            editorRuntimeFile = 0;
            funcName = samplesData[type][index]["func"];
            editorFiles.update();

        }


        if (runtimeLoaded)
            setPageStatus("Ready","#000000")

        if (onComplete)
            onComplete(fileSystem);
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

clickRunCode = function() {

    let fName = funcName;

    //[{"name":"main.das","text":code.getValue()}]
    console.log(fName);

    runScript(editorFileSystem,
        //editorFilesData[editorRuntimeFile].path+editorFilesData[editorRuntimeFile].name,
        editorFileSystem.getFile(editorRuntimeFile).path+editorFileSystem.getFile(editorRuntimeFile).name,
        fName,fName === "test" ? function () {
            editorOutput.print( "TEST FINISHED" ,"#4adbdb");


    } : null);



}


runTests = function() {


    runTest(0);

}

var outputPool = [];

runTest = function(i) {

    loadSample('tests',i,false,function(fileSystem) {

        editorOutput.print("Running Test "+(i+1)+"/"+samplesData["tests"].length+": "+samplesData["tests"][i].name,"#bec7b6");

        outputPool = [];

        fName = samplesData["tests"][i].function_name ? samplesData["tests"][i].function_name : "main";

        runScript(fileSystem,fileSystem.getFile(0).path+fileSystem.getFile(0).name,samplesData["tests"][i]["func"],function () {


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


            editorOutput.print(samplesData["tests"][i].name+" Test "+(i+1)+"/"+samplesData["tests"].length+": "+(ok ? "SUCCESS" : "FAIL"),ok ? "#89db4a": '#ff9393');

            if (i<samplesData["tests"].length-1)
                runTest(i+1);
        });
    })
}





runScript = function(tempFileSystem,mainFile,mainFunc,onComplete)
{


    let files = tempFileSystem.getFiles();
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




    if (onComplete)
        onComplete();
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
                editorOutput.print(text,'#ffffff');

                outputPool.push(text);
            };
        })(),
    }

window.onerror = function(message)
{

    editorOutput.print(message,'#ff2d2d');

    editorOutput.print("An error occurred, you may need to reload the page",'#ff9393');
}

window.onresize = function() 
{

    updateMainCol();
}





