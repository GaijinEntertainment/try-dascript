
class Editor {

    constructor(runtimeController)
    {
        this.runtimeController = runtimeController;

        this.fileSystem = new FileSystem();
        this.fileView = new FileView(this);
        this.browserView = new BrowserView(this);
        this.outputView = new OutputView(this);


        this.statusDiv = document.getElementById("main_status");

        this.runtimeButton = document.getElementById("run_code");

        //this.windowController = new WindowController(this,5, [2/10,4/10,6/10,8/10],[true,true,true,true,true])

        this.windowController = new WindowController(this,3, [2.03/10,6/10],[false,true,true])


    
        this.setPageStatus("Loading WASM","waiting")


        this.fileCacheURL = {};

        this.samplesData;

        this.sampleListDiv =
         {
            "examples":document.getElementById("select_examples"), 
            "tests":document.getElementById("select_tests")
        };

    
    
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



        this.runtimeButton.addEventListener("click",
            function() {
                this.runCode()
            }.bind(this))


        window.addEventListener("error", function(message)
        {
            this.outputView.print(message,'error');
            this.outputView.print("An error occurred, you may need to reload the page",'error');
        }.bind(this));
        
        

        this.runtimeController.onPrint = function(text){
            

            this.outputView.print(text,"");

            this.outputPool.push(text);

        }.bind(this);


        this.runtimeController.onInit = function() {
            
            this.setPageStatus("","ready")
        }.bind(this);

    }


    setPageStatus(text,type) {

        this.statusDiv.classList.toggle("waiting",type=="waiting");
        this.statusDiv.classList.toggle("ready",type=="ready");
        this.statusDiv.innerText = text;


        this.runtimeButton.disabled = type==="waiting";
    }




    getFiles(filesDescription,onComplete) {


        let tempFileSystem = new FileSystem();
    
    
        let getFile = function (i) {
    
            if (i>=filesDescription.length)
            {
                onComplete(tempFileSystem);
                return;
            }
    
    
            if (filesDescription[i].url)
            {
    
                if (this.fileCacheURL[filesDescription[i].url] !== undefined)
                {
                    tempFileSystem.addFile( filesDescription[i].name,
                             filesDescription[i].path ? filesDescription[i].path : "",
                           this.fileCacheURL[filesDescription[i].url]
                        );
    
                    getFile(i+1);
                }
                else
                {
    
                    $.get(filesDescription[i].url, function(ft) {
    
                        this.fileCacheURL[filesDescription[i].url] = ft;
    
                        tempFileSystem.addFile(filesDescription[i].name,
                                filesDescription[i].path ? filesDescription[i].path : "",
                                ft
                            );
    
                        getFile(i+1);
    
                    }.bind(this), 'text');
                }
            }
            else
            {
                tempFileSystem.addFile(
                    filesDescription[i].name,
                    filesDescription[i].path ? filesDescription[i].path : "",
                    filesDescription[i].text
                )
    
                getFile(i+1);
            }
    
        }.bind(this);
    
        getFile(0);
    
    }
    

    loadSample(type,index,updateEnv,onComplete)
    {

        if (this.runtimeController.loaded)
            this.setPageStatus("Loading files","waiting")


        this.getFiles(this.samplesData[type][index].files,function (fileSystem) {

            if (updateEnv)
            {
                this.fileSystem = fileSystem;
                this.fileSystem.addSelector("browser");
                this.fileSystem.addSelector("runtime");
                this.funcName = this.samplesData[type][index]["func"];
                this.browserView.update();

            }


            if (this.runtimeController.isLoaded())
                this.setPageStatus("","ready")

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

    runCode() {

        let fName = this.funcName;
    

        this.runtimeController.setFS(this.fileSystem);

        this.runtimeController.run(this.fileSystem.getFile("runtime").path+this.fileSystem.getFile("runtime").name,
            fName,fName === "test" ? function () {
                this.outputView.print( "TEST FINISHED" ,"test");
        }.bind(this) : null);
    
    
    
    }


    runTest(i) {

        this.loadSample('tests',i,false,function(fileSystem) {
    
            this.outputView.print("Running Test "+(i+1)+"/"+this.samplesData["tests"].length+": "+this.samplesData["tests"][i].name,"test");
    
            this.outputPool = [];
    
            //fName = this.samplesData["tests"][i].function_name ? this.samplesData["tests"][i].function_name : "main";
    
            fileSystem.addSelector("test_runtime")


            this.runtimeController.setFS(fileSystem);

            this.runtimeController.run(fileSystem.getFile("test_runtime").path+fileSystem.getFile("test_runtime").name,this.samplesData["tests"][i]["func"],function () {
    
    
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
    
    
                this.outputView.print(this.samplesData["tests"][i].name+" Test "+(i+1)+"/"+this.samplesData["tests"].length+": "+(ok ? "SUCCESS" : "FAIL"),ok ? "success": 'error');
    
                if (i<this.samplesData["tests"].length-1)
                    this.runTest(i+1);
            }.bind(this));
        }.bind(this))
    }
    
    runTests() {


        this.runTest(0);

    }




}