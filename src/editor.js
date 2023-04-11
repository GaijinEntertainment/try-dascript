
class Editor {

    constructor(runtimeController)
    {


        this.structVersion = "0.9"

        this.runtimeController = runtimeController;

        this.fileSystem = new FileSystem();
        this.fileView = new FileView(this);
        this.browserView = new BrowserView(this);
        this.outputView = new OutputView(this);


        this.statusDiv = document.getElementById("main_status");

        this.runtimeButton = document.getElementById("run_code");

        
        this.shareDiv = document.getElementById("share_status");

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





        let loadDefaultSample = true;




        let base64preset = null;

        if (window.location.hash)
        {
            base64preset = this.getStatePart(window.location.hash,"s")
        }


        if (base64preset)
            {
                this.loadJSONFromBase64(base64preset,
                    function(jData) {
                        this.loadFromJSON(jData);
                        loadDefaultSample = false;}.bind(this),
                    function(e) {console.error(e)});

                let base64output = this.getStatePart(window.location.hash,"o")

                if (base64output)
                    this.loadJSONFromBase64(base64output,
                        function(jData) {
                            this.outputView.loadFromJSON(jData);}.bind(this),
                        function(e) {console.error(e)});

                
            }


    


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
    
            
            
            if (loadDefaultSample)
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

        /*
            
        <div>
            <button id="restart_env" class="btn btn-danger">Reload</button>
        </div>

        document.getElementById("restart_env").addEventListener("click",
            function() {


                this.runtimeController.restartEnvironment();

                
            }.bind(this))

            */

        document.getElementById("share_code").addEventListener("click",
            function() {
                this.copyShareLink();
            }.bind(this))

            
        document.getElementById("save_json").addEventListener("click",
        function() {
            this.fileSaveJSON();
        }.bind(this))

        
        document.getElementById("load_json").addEventListener("click",
        function() {
            this.fileLoadJSON();
        }.bind(this))


        window.addEventListener("error", function(e)
        {

            console.error(e)

            let msg = e;

            if ("message" in e)
                msg = e.message;

            this.outputView.printLine(msg,'error');
            this.outputView.printLine("An error occurred. Environment will reload",'error');

            this.setPageStatus("Reloading","waiting")

            runtimeController.restartEnvironment();

        }.bind(this));
        
        
        window.addEventListener('hashchange', function (e)
        {
            this.stateHashUpdate();

        }.bind(this));


        this.runtimeController.onPrintLine = function(text){
            

            this.outputView.printLine(text,"");

            this.outputPool.push(text);

        }.bind(this);

        this.runtimeController.onPrintChar = function(ch) {

            this.outputView.printChar(ch);

            if (ch==="\n")
                this.outputPool.push("")
            else
            {

                if (this.outputPool.length === 0)
                    this.outputPool.push("");

                this.outputPool[this.outputPool.length-1] += ch;
            }
                
                

        }.bind(this);


        this.runtimeController.onInit = function() {
            this.checkWASM();
        }.bind(this);


        
        this.runtimeController.onAbort = function() {
            this.setPageStatus("Browser doesn't support WASM","waiting")
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
                this.checkWASM();
                
            if (this.runtimeController.aborted)
                this.setPageStatus("Browser doesn't support WASM","waiting")

            if (onComplete)
                onComplete(fileSystem);
        }.bind(this))



    }

    checkWASM() {

        this.setPageStatus("Checking compatibility","waiting")


        wasmFeatureDetect.simd().then((simdSupported) => {
            if (simdSupported) {
                this.setPageStatus("","ready")
            } else {
                this.setPageStatus("Browser doesn't support WASM SIMD","waiting")

                console.error("No SIMD support")
            }
        })



    }

    toJSON() {
        
        return {
            "v" : this.structVersion,

            "func" : this.funcName,
            "fs" : this.fileSystem.toJSON()
        }
    }

    loadFromJSON(json) {


        if (json["v"] !== this.structVersion)
            throw "Wrong JSON version"

        this.funcName = json["func"];

        this.fileSystem.loadFromJSON(json["fs"]);

        this.browserView.update();
    }


    encodeJSONToBase64(jData)
    {



        let jsonS = JSON.stringify(jData);

        let buf = fflate.strToU8(jsonS);
        
        let compressed = fflate.compressSync(buf, { level: 6, mem: 8,mtime:0 });

        return btoa(String.fromCharCode.apply(null, compressed));

    }

    loadJSONFromBase64(base64, onSuccess, onError)
    {


        try 
        {

            let arr = new Uint8Array(atob(base64).split("").map(function(c) {
                return c.charCodeAt(0); }))

            let decompressed = fflate.decompressSync(arr);

            let decodedS =  fflate.strFromU8(decompressed);
                 
            let jData = JSON.parse(decodedS)

            if (onSuccess)
                onSuccess(jData)
        }
        catch (e)
        {
            if (onError)
                onError(e)
        }

    }


    setShareStatus(text,type) {


        this.shareDiv.innerText = text;

        this.shareDiv.classList.toggle("warning",type=="warning");
        

        this.shareDiv.classList.toggle("hidden",false);
        this.shareDiv.classList.toggle("appeared",true);


    
        window.setTimeout(function () {
            this.shareDiv.classList.toggle("hidden",true);
            this.shareDiv.classList.toggle("appeared",false);
        }.bind(this),10)
    }

    generateStateHash(editor,output)
    {

        let s = "#";

        if (editor)
            s +="s:"+this.encodeJSONToBase64(this.toJSON())+":s";

        if (output)
            s +="o:"+this.encodeJSONToBase64(this.outputView.toJSON())+":o";

        return s;

    }

    generateShareLink()
    {

        //let mainUrl = window.location.protocol + '//' + window.location.hostname  + '/';

        let mainUrl = window.location.protocol+'//'+window.location.host+window.location.pathname+"/";

        let hash = this.generateStateHash(true,true);

        

        return mainUrl+hash;



    }

    copyShareLink()
    {

        let url = this.generateShareLink();

        let warn = url.length > 4000;


        this.setShareStatus("Link coppied to clipboard" + (warn ? " (URL too long)" : ""), warn ? "warning" : "")

        var copyText = document.getElementById("clip_input");
        copyText.value = url;

        copyText.select();
        copyText.setSelectionRange(0, 99999); // For mobile devices

        navigator.clipboard.writeText(copyText.value);
    }


    fileSaveJSON() {

        
        this.setShareStatus("Saved to JSON", "")


        var a = document.createElement("a");
        var file = new Blob([JSON.stringify(this.toJSON())], {type: "text/plain"});
        a.href = URL.createObjectURL(file);



        a.download = this.fileSystem.getFile("runtime").name.split(".")[0] +"_"+((new Date()).toISOString().substring(0, 10).replaceAll('-','_')) + ".json";
        a.click();
    
    }

    fileLoadJSON() {

        

        var el = window._protected_reference = document.createElement("INPUT");
        el.type = "file";
        el.accept = ".json"
        el.addEventListener('change', function(ev2) {

            if (el.files.length) {

                
                //this.setShareStatus("Loading JSON", "")

                let fr = new FileReader();
                fr.readAsText(el.files[0]);
                fr.onload = function () {

                    //this.editor.fileSystem.addFile("",el.files[i].name,fr.result);

                    try {

                        this.loadFromJSON(JSON.parse(fr.result));

                        this.setShareStatus("JSON loaded", "")
                    }
                    catch
                    {
                        this.setShareStatus("Failed loading JSON", "warning")

                    }
                }.bind(this);

    
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

    selectSample(type,id) {



        let vv = id !== undefined ? id : parseInt(this.sampleListDiv[type].value);
        if (vv !== NaN)
        {

            this.loadSample(type,vv,true,null)
        }

        this.sampleListDiv[type].value = "init";


    }

    runCode() {


        this.outputView.resetRuntimeOutput();
        
        window.location.hash = this.generateStateHash(true,false);

        let fName = this.funcName;
    

        this.runtimeController.setFS(this.fileSystem);


        this.runtimeController.run(this.fileSystem.getFile("runtime").path+this.fileSystem.getFile("runtime").name,
            fName,fName === "test" ? function () {
                this.outputView.printLine( "TEST FINISHED" ,"test");
        }.bind(this) : null);
    
    
    
    }


    getStatePart = function(s,ch)
        {
            
            let p1 = s.indexOf(ch+":")
            let p2 = s.indexOf(":"+ch)

            if (p1!==-1 && p2!==-1)
                return s.substring(p1+2,p2)
            else
                return null;
        }

    stateHashUpdate()
    {

        

        let curH = this.generateStateHash(true,false);
        let newH = window.location.hash

        let curEditor64 = this.getStatePart(curH,"s");
        let newEditor64 = this.getStatePart(newH,"s");





        if (newEditor64!==curEditor64 && newEditor64)
            {
                this.loadJSONFromBase64(newEditor64, function(jData)
                {
                    this.loadFromJSON(jData);
                }.bind(this))
            }
    }


    runTest(i) {

        this.outputView.resetRuntimeOutput();

        this.loadSample('tests',i,false,function(fileSystem) {
    
            this.outputView.printLine("Running Test "+(i+1)+"/"+this.samplesData["tests"].length+": "+this.samplesData["tests"][i].name,"test");
    
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
    
    
                this.outputView.printLine(this.samplesData["tests"][i].name+" Test "+(i+1)+"/"+this.samplesData["tests"].length+": "+(ok ? "SUCCESS" : "FAIL"),ok ? "success": 'error');
    
                if (i<this.samplesData["tests"].length-1)
                    this.runTest(i+1);
            }.bind(this));
        }.bind(this))
    }
    
    runTests() {


        this.runTest(0);

    }




}