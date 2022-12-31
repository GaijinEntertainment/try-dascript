
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
            if (window.location.hash.charAt(1)==="z")
                base64preset = window.location.hash.substring(3)


        if (base64preset)
            {
                this.loadStateFromBase64(base64preset,
                    function() {loadDefaultSample = false;},
                    null);
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

        document.getElementById("share_code").addEventListener("click",
            function() {
                this.generateShareLink();
            }.bind(this))

            
        document.getElementById("save_json").addEventListener("click",
        function() {
            this.fileSaveJSON();
        }.bind(this))

        
        document.getElementById("load_json").addEventListener("click",
        function() {
            this.fileLoadJSON();
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


    encodeStateToBase64()
    {


        let jData = this.toJSON();



        let jsonS = JSON.stringify(jData);


        return btoa(jsonS)
    }

    loadStateFromBase64(base64, onSuccess, onError)
    {


        try 
        {


            let decodedS= atob(base64);

            let jData = JSON.parse(decodedS)

            this.loadFromJSON(jData);


            if (onSuccess)
                onSuccess()
        }
        catch (e)
        {
            console.log(e)
            if (onError)
                onError()
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

    generateShareLink()
    {

        let mainUrl = window.location.protocol + '//' + window.location.hostname  + '/';
        let base64 = this.encodeStateToBase64();




        let warn = base64.length > 4000;


        this.setShareStatus("Link coppied to clipboard" + (warn ? " (URL too long)" : ""), warn ? "warning" : "")

        var copyText = document.getElementById("clip_input");
        copyText.value = mainUrl+"#z:"+base64;

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