
class Editor {

    constructor()
    {
        this.fileSystem = new FileSystem();
        this.codeView = new CodeView(this);
        this.filesView = new FilesView(this);
        this.outputView = new OutputView(this);


        this.statusDiv = document.getElementById("main_status");



        this.mainColPos = [2/10,6/10];

        this.separatorDiv = [];
        this.mainColumnDiv = [];
        this.mainColumnNum = 3;

        this.selectedSeparator = -1;

        for (let i=0;i<this.mainColumnNum;i++)
        {
    
    
            let mc = document.getElementById("main_col"+(i+1));
    
            this.mainColumnDiv.push(mc);
        }
    
    
        for (let i=0;i<this.mainColumnNum-1;i++)
        {
            let sep = document.getElementById("separator"+(i+1));
    
            sep.addEventListener("mousedown",function(e){
                if (this.selectedSeparator===-1)
                this.selectedSeparator = i;
            }.bind(this))
    
            //sep.style.left = (sp[i])+"px"
    
            this.separatorDiv.push(sep);
        }
        
    
    
        this.updateMainCol();
    
        this.setPageStatus("Loading WASM","#ff0000")


        this.fileCacheURL = {};

        this.samplesData;

        this.sampleListDiv =
         {
            "examples":document.getElementById("select_examples"), 
            "tests":document.getElementById("select_tests")
        };

    
    

        this.selectedFile = -1;
        this.runtimeFile = -1;
        this.funcName = "main";


        $.getJSON( "./samples/data.json", function(res) {
            this.samplesData = res;
    
    
            let mainTests = [];
    
            this.samplesData["unit_tests"]["files"].forEach(function (testId) {
    
                let ff = [
                    {
                        name: testId+".das",
                        path: this.samplesData["unit_tests"]["to_path"],
                        url: this.samplesData["unit_tests"]["url"]+testId+".das"}];
    
                        this.samplesData["unit_test_dependencies"].forEach(function (depGroup) {
    
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
            }.bind(this));
    
            this.samplesData["tests"] = mainTests.concat(this.samplesData["tests"]);
    
            ["example","test"].forEach(function (n) {
    
                let ll = this.sampleListDiv[n+"s"];
                while (ll.firstChild) {
                    ll.removeChild(ll.lastChild);
                }
    
                for (let i=0;i<this.samplesData[n+"s"].length+1;i++)
                {
                    let newO = document.createElement("option");
                    if (i===0)
                    {
    
                        newO.innerText = "Select "+n;
                        newO.value = "init";
                    }
                    else
                    {
                        newO.innerText = this.samplesData[n+"s"][i-1].name;
                        newO.value = i-1;
    
                    }
                    ll.appendChild(newO);
                }
            }.bind(this));
    
            this.selectSample("examples",0);
    
    
    
        }.bind(this));
    
    
        this.outputPool = [];

        this.sampleListDiv["examples"].addEventListener("change",
            function() {
                this.selectSample('examples')
            }.bind(this)
        );


        this.sampleListDiv["tests"].addEventListener("change",
            function() {
                this.selectSample('tests')
            }.bind(this)
        );

        document.getElementById("run_tests").addEventListener("click",
            function() {
                this.runTests();
            }.bind(this))


        document.getElementById("run_code").addEventListener("click",
            function() {
                this.clickRunCode()
            }.bind(this))

        document.addEventListener("mousemove",function(e){
            if (this.selectedSeparator!==-1)
                this.setMainColPos(e);
        }.bind(this));
    
        document.addEventListener("mouseup", function(e){
            this.selectedSeparator = -1;
        }.bind(this));

        window.addEventListener("onerror", function(message)
        {
            this.outputView.print(message,'#ff2d2d');
            this.outputView.print("An error occurred, you may need to reload the page",'#ff9393');
        }.bind(this));
        
        window.addEventListener("onresize",function() 
        {
            this.updateMainCol();
        }.bind(this));
        

    }


    setPageStatus(text,color) {

        this.statusDiv.style.color = color;
        this.statusDiv.innerText = text;
    }


    updateMainCol() {
            
        let wp = [];

        for (let i=0;i<this.mainColumnNum-1;i++)
            wp.push(Math.round(this.mainColPos[i]*window.innerWidth));


        for (let i=0;i<this.mainColumnNum-1;i++)
        {

            
            this.separatorDiv[i].style.left = (wp[i]-10)+"px"
            this.mainColumnDiv[i+1].style.left = (wp[i])+"px"
        }


        this.mainColumnDiv[0].style.width = wp[0]-10+"px";
        
        this.mainColumnDiv[1].style.width = (wp[1]-wp[0]-10)+"px";
        
        this.mainColumnDiv[2].style.width = (window.innerWidth-wp[1]-10)+"px";

    
    }

    setMainColPos(e) {

        e.preventDefault();
        let xx = e.clientX;
        let wp = xx/window.innerWidth;
    
    
        let minw = 0.05;
        let maxw = 1-0.05;
    
        if (this.selectedSeparator>0)
            minw = this.mainColPos[this.selectedSeparator-1]+0.05;
    
        if (this.selectedSeparator<this.mainColumnNum-2)
            maxw = this.mainColPos[this.selectedSeparator+1]-0.05;
    
        if (wp>maxw)
            wp = maxw;
    
        if (wp<minw)
            wp = minw;
    
            this.mainColPos[this.selectedSeparator] = wp;
    
        this.updateMainCol();
    }


    getFiles(filesDesc,onComplete) {


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
    
                if (this.fileCacheURL[filesDesc[i].url] !== undefined)
                {
                    outFiles.push(
                        {
                            name : filesDesc[i].name,
                            path : filesDesc[i].path ? filesDesc[i].path : "",
                            text : this.fileCacheURL[filesDesc[i].url]
                        });
    
                    getFile(i+1);
                }
                else
                {
    
                    $.get(filesDesc[i].url, function(ft) {
    
                        this.fileCacheURL[filesDesc[i].url] = ft;
    
                        outFiles.push(
                            {
                                name : filesDesc[i].name,
                                path : filesDesc[i].path ? filesDesc[i].path : "",
                                text : ft
                            });
    
                        getFile(i+1);
    
                    }.bind(this), 'text');
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
    
        }.bind(this);
    
        getFile(0);
    
    }
    

    loadSample(type,index,updateEnv,onComplete)
    {

        if (runtimeLoaded)
            this.setPageStatus("Loading files","#ff0000")


        this.getFiles(this.samplesData[type][index].files,function (fileSystem) {

            /*
            if (updateEnv)
                code.setValue(filesData[0].text);*/


            if (updateEnv)
            {
                //editorFilesData = filesData;
                this.fileSystem = fileSystem;
                this.selectedFile = 0;
                this.runtimeFile = 0;
                this.funcName = this.samplesData[type][index]["func"];
                this.filesView.update();

            }


            if (runtimeLoaded)
                this.setPageStatus("Ready","#000000")

            if (onComplete)
                onComplete(fileSystem);
        }.bind(this))



    }

    selectSample(type,id) {



        let vv = id !== undefined ? id : parseInt(this.sampleListDiv[type].value);
        if (vv !== NaN)
        {


            this.loadSample(type,vv,true,null)



        }

        this.sampleListDiv[type].value = "init";


    }

    clickRunCode() {

        let fName = this.funcName;
    
    
    
        this.runScript(this.fileSystem,
            
            this.fileSystem.getFile(this.runtimeFile).path+this.fileSystem.getFile(this.runtimeFile).name,
            fName,fName === "test" ? function () {
                this.outputView.print( "TEST FINISHED" ,"#4adbdb");
    
    
        }.bind(this) : null);
    
    
    
    }


    runTest(i) {

        this.loadSample('tests',i,false,function(fileSystem) {
    
            this.outputView.print("Running Test "+(i+1)+"/"+this.samplesData["tests"].length+": "+this.samplesData["tests"][i].name,"#bec7b6");
    
            this.outputPool = [];
    
            //fName = this.samplesData["tests"][i].function_name ? this.samplesData["tests"][i].function_name : "main";
    
            this.runScript(fileSystem,fileSystem.getFile(0).path+fileSystem.getFile(0).name,this.samplesData["tests"][i]["func"],function () {
    
    
                let ok = true;
    
    
    
                if (this.outputPool.length<this.samplesData["tests"][i].correct_output.length)
                    ok = false;
                else
                    for (let o=0;o<this.samplesData["tests"][i].correct_output.length;o++) {
                        let correct = this.samplesData["tests"][i].correct_output[o];
    
                        if (Array.isArray(correct))
                        {
                            let outp = this.outputPool[o].split(' ');
    
                            if (outp.length<correct.length)
                                ok = false;
                            else
                                for (let k=0;k<correct.length;k++)
                                    if (correct[k] !== null && outp[k] !== correct[k])
                                        ok = false;
    
    
                        }
                        else
                        {
                            if (correct !== null && this.outputPool[o] !== correct)
                                ok = false;
                        }
    
                    }
    
                for (let o=0;o<this.outputPool.length;o++)
                    if (this.outputPool[o].includes("error") || this.outputPool[o].includes("can't"))
                        ok = false;
    
    
                this.outputView.print(this.samplesData["tests"][i].name+" Test "+(i+1)+"/"+this.samplesData["tests"].length+": "+(ok ? "SUCCESS" : "FAIL"),ok ? "#89db4a": '#ff9393');
    
                if (i<this.samplesData["tests"].length-1)
                    this.runTest(i+1);
            }.bind(this));
        }.bind(this))
    }
    
    runTests() {


        this.runTest(0);

    }

    runScript(tempFileSystem,mainFile,mainFunc,onComplete)
    {


        let files = tempFileSystem.getFiles();


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





}